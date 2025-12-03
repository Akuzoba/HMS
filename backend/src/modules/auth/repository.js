import prisma from '../../core/database/prisma.js';

export class AuthRepository {
  async createUser(data) {
    return await prisma.user.create({
      data,
      include: {
        role: true
      }
    });
  }

  async findUserByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });
  }

  async findUserByUsername(username) {
    return await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    });
  }

  async findUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });
  }

  async updateUser(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
      include: { role: true }
    });
  }

  async updateLastLogin(id) {
    return await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() }
    });
  }

  async saveRefreshToken(userId, refreshToken) {
    return await prisma.user.update({
      where: { id: userId },
      data: { refreshToken }
    });
  }

  async deleteRefreshToken(userId) {
    return await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
  }

  async logAudit(userId, action, entityType, entityId, changes, ipAddress, userAgent) {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        changes,
        ipAddress,
        userAgent
      }
    });
  }
}
