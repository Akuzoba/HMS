import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';
import prisma from '../database/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true }
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name,
      roleId: user.roleId,
      permissions: user.role.permissions
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles) => {
  // Flatten in case an array was passed as single argument
  const roles = allowedRoles.flat();
  
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
    }

    next();
  };
};
