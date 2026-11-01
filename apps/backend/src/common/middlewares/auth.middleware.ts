import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { jwtConfig } from '../../config/jwt.config';
import { AppError } from '../errors/app-error';
import { StatusCodes } from 'http-status-codes';
import logger from '../../shared/logger/logger';
import prisma from '../../database/prisma-client';
import { Role } from '@prisma/client';
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        department?: string | null;
      };
    }
  }
}

async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = jwt.verify(token, jwtConfig.secret);
    const { id, email, role } = decodedToken as { id: string; email: string; role: Role };

    const dbUser = await prisma.user.findUnique({ where: { id } });

    if (!dbUser) {
      throw new AppError('User not found', StatusCodes.UNAUTHORIZED);
    }

    if (!dbUser.isActive) {
      throw new AppError('User account is deactivated', StatusCodes.UNAUTHORIZED);
    }

    if (dbUser.role !== role) {
      throw new AppError(
        'User role has been updated. Please log in again.',
        StatusCodes.UNAUTHORIZED,
      );
    }

    req.user = { id, email, role, department: dbUser.department };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
}

export default authenticateUser;
