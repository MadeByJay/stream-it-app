import { Request, Response, NextFunction } from 'express';

/**
 * Require that the current user is authenticated AND is an admin.
 * This should be used AFTER requireAuth, so request.isAdmin is populated.
 */
export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (!request.userId) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!request.isAdmin) {
    response.status(403).json({ error: 'Admin privileges required' });
    return;
  }

  next();
}
