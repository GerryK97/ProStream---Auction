// API Client for frontend components

const API_BASE_URL = '/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Get headers with authentication
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Export helper for components that need direct fetch calls
export { getAuthHeaders };

// Generic fetch wrapper with authentication
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('token');
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Tournaments API
export const tournamentsAPI = {
  getAll: () => fetchAPI('/tournaments'),
  getById: (id: string) => fetchAPI(`/tournaments/${id}`),
  create: (data: any) =>
    fetchAPI('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchAPI(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI(`/tournaments/${id}`, {
      method: 'DELETE',
    }),
};

// Teams API
export const teamsAPI = {
  getAll: () => fetchAPI('/teams'),
  getById: (id: string) => fetchAPI(`/teams/${id}`),
  create: (data: any) =>
    fetchAPI('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchAPI(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI(`/teams/${id}`, {
      method: 'DELETE',
    }),
};

// Players API
export const playersAPI = {
  getAll: () => fetchAPI('/players'),
  getById: (id: string) => fetchAPI(`/players/${id}`),
  create: (data: any) =>
    fetchAPI('/players', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchAPI(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchAPI(`/players/${id}`, {
      method: 'DELETE',
    }),
};
