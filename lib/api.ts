const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type FetchOptions = RequestInit & {
  token?: string | null;
};

async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An API error occurred');
  }

  if (response.status === 204) { // No Content
    return null;
  }

  return response.json();
}

export default apiFetch;
