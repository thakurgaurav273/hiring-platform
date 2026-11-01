import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/app-error';
import logger from '../../shared/logger/logger';
import jwt from 'jsonwebtoken';

const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired',
    });
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
    });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Internal Server Error',
  });
};

export default errorHandler;
