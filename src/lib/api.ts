export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

const BASE_URL = ((import.meta as any).env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const getFullUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanUrl}`;
};

const headers = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  post: async (url: string, body: any) => {
    try {
      const res = await fetch(getFullUrl(url), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'API Request failed');
      }
      return res.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error('Unable to connect to the backend server. Please verify your Spring Boot backend is running on http://localhost:8080.');
      }
      throw err;
    }
  },
  get: async (url: string) => {
    try {
      const res = await fetch(getFullUrl(url), {
        method: 'GET',
        headers: headers(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'API Request failed');
      }
      return res.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error('Unable to connect to the backend server. Please verify your Spring Boot backend is running on http://localhost:8080.');
      }
      throw err;
    }
  }
};
