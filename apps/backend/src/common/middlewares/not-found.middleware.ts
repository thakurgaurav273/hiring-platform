import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../errors/app-error';

const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND));
};

export default notFoundMiddleware;
