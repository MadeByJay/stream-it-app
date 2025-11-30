import { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../modules/auth/authService';

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    response
      .status(401)
      .json({ error: 'Authorization header missing or invalid' });
    return;
  }

  const token = authorizationHeader.replace('Bearer ', '').trim();

  try {
    const payload = verifyJwt(token);

    request.userId = payload.userId;
    request.userEmail = payload.email;
    request.isAdmin = payload.isAdmin;

    next();
  } catch (error) {
    console.error('Error verifying JWT', error);
    response.status(401).json({ error: 'Invalid or expired token' });
  }
}
