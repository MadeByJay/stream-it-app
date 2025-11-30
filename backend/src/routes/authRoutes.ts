import { Router, Request, Response } from 'express';
import {
  createUser,
  findUserByEmail,
  findUserById,
} from '../modules/users/userRepository';
import {
  hashPassword,
  verifyPassword,
  generateJwt,
} from '../modules/auth/authService';
import { requireAuth } from '../middleware/authMiddleware';

export const authRouter: Router = Router();

/**
 * POST /api/auth/register
 * Body: { email, password }
 */
authRouter.post('/register', async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      response.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      response
        .status(409)
        .json({ error: 'A user with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser = await createUser(email, passwordHash);

    const token = generateJwt({
      userId: newUser.id,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    });

    response.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      },
    });
  } catch (error) {
    console.error('Error during registration', error);
    response.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
authRouter.post('/login', async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      response.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      response.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      response.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateJwt({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Error during login', error);
    response.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/me
 * Return current user info based on JWT
 */
authRouter.get(
  '/me',
  requireAuth,
  async (request: Request, response: Response) => {
    try {
      if (!request.userId) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await findUserById(request.userId);
      if (!user) {
        response.status(404).json({ error: 'User not found' });
        return;
      }

      response.json({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error('Error fetching current user', error);
      response.status(500).json({ error: 'Failed to fetch user' });
    }
  },
);
