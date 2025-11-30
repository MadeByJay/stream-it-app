import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const jwtSecret: string = process.env.JWT_SECRET || 'dev-default-secret';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export async function hashPassword(plainPassword: string) {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateJwt(payload: JwtPayload): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn as any });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, jwtSecret) as JwtPayload;
}
