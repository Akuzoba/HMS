import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../core/config/index.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { AuthRepository } from './repository.js';

export class AuthService {
  constructor() {
    this.repository = new AuthRepository();
  }

  async register(userData) {
    // Check if user already exists
    const existingEmail = await this.repository.findUserByEmail(userData.email);
    if (existingEmail) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    const existingUsername = await this.repository.findUserByUsername(userData.username);
    if (existingUsername) {
      throw new AppError('Username already taken', 400, 'USERNAME_EXISTS');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, config.bcrypt.saltRounds);

    // Create user
    const user = await this.repository.createUser({
      email: userData.email,
      username: userData.username,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      roleId: userData.roleId
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Save refresh token
    await this.repository.saveRefreshToken(user.id, refreshToken);

    // Remove sensitive data
    const { passwordHash: _, refreshToken: __, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  async login(username, password, ipAddress, userAgent) {
    // Find user
    const user = await this.repository.findUserByUsername(username);
    
    if (!user || user.deletedAt) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is inactive', 401, 'ACCOUNT_INACTIVE');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await this.repository.updateLastLogin(user.id);

    // Log audit
    await this.repository.logAudit(
      user.id,
      'LOGIN',
      'USER',
      user.id,
      null,
      ipAddress,
      userAgent
    );

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    // Save refresh token
    await this.repository.saveRefreshToken(user.id, refreshToken);

    // Remove sensitive data
    const { passwordHash: _, refreshToken: __, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  async refreshToken(oldRefreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(oldRefreshToken, config.jwt.refreshSecret);

      // Find user and verify refresh token matches
      const user = await this.repository.findUserById(decoded.userId);
      
      if (!user || user.refreshToken !== oldRefreshToken || !user.isActive || user.deletedAt) {
        throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      // Generate new tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Save new refresh token
      await this.repository.saveRefreshToken(user.id, refreshToken);

      return {
        accessToken,
        refreshToken
      };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  async logout(userId) {
    await this.repository.deleteRefreshToken(userId);
    
    await this.repository.logAudit(
      userId,
      'LOGOUT',
      'USER',
      userId,
      null,
      null,
      null
    );
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.repository.findUserById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    // Update password
    await this.repository.updateUser(userId, { passwordHash });

    // Log audit
    await this.repository.logAudit(
      userId,
      'UPDATE',
      'USER',
      userId,
      { action: 'password_changed' },
      null,
      null
    );
  }

  async getProfile(userId) {
    const user = await this.repository.findUserById(userId);
    
    if (!user || user.deletedAt) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const { passwordHash, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }
}
