import type { AuthResponse, AuthUser } from '../types/auth';

async function handleJsonResponse<ResponseType>(
  response: Response,
): Promise<ResponseType> {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed with status ${response.status}: ${errorBody || response.statusText}`,
    );
  }
  return (await response.json()) as ResponseType;
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleJsonResponse<AuthResponse>(response);
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleJsonResponse<AuthResponse>(response);
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleJsonResponse<AuthUser>(response);
}
