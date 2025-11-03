// API Client for frontend components

const API_BASE_URL = '/api';

// Generic fetch wrapper
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

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
