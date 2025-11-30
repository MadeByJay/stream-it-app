import { databasePool } from '../../db/databasePool';

export interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
}

function mapUserRow(row: any): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    isAdmin: row.is_admin,
  };
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const queryResult = await databasePool.query(
    'SELECT id, email, password_hash, is_admin FROM users WHERE email = $1',
    [email],
  );

  if (queryResult.rows.length === 0) {
    return null;
  }

  return mapUserRow(queryResult.rows[0]);
}

export async function findUserById(userId: number): Promise<UserRecord | null> {
  const queryResult = await databasePool.query(
    'SELECT id, email, password_hash, is_admin FROM users WHERE id = $1',
    [userId],
  );

  if (queryResult.rows.length === 0) {
    return null;
  }

  return mapUserRow(queryResult.rows[0]);
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<UserRecord> {
  const queryResult = await databasePool.query(
    `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, password_hash, is_admin
    `,
    [email, passwordHash],
  );

  return mapUserRow(queryResult.rows[0]);
}
