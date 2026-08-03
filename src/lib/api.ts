import { AuthResponse, Book, Episode, User, UserProgress } from '../types';

const TOKEN_KEY = 'zuniobooks_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type to json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const data = await res.json();
      errorMsg = data.error || data.detail || errorMsg;
    } catch {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  async checkUserExist(identifier: string): Promise<{ exists: boolean; username: string | null; role: 'admin' | 'user' | null }> {
    return fetchApi<{ exists: boolean; username: string | null; role: 'admin' | 'user' | null }>(
      `/api/auth/check-user?identifier=${encodeURIComponent(identifier)}`
    );
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await fetchApi<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const data = await fetchApi<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async getMe(): Promise<User> {
    const data = await fetchApi<{ user: User }>('/api/auth/me');
    return data.user;
  },

  logout(): void {
    removeStoredToken();
  },

  // Books
  async getBooks(query = '', genre = ''): Promise<Book[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (genre) params.append('genre', genre);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Book[]>(`/api/books${queryString}`);
  },

  async getBook(id: string): Promise<Book> {
    return fetchApi<Book>(`/api/books/${id}`);
  },

  async createBook(formData: FormData): Promise<Book> {
    return fetchApi<Book>('/api/books', {
      method: 'POST',
      body: formData,
    });
  },

  async updateBook(id: string, formData: FormData): Promise<Book> {
    return fetchApi<Book>(`/api/books/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async deleteBook(id: string): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/api/books/${id}`, {
      method: 'DELETE',
    });
  },

  // Episodes
  async createEpisode(bookId: string, formData: FormData): Promise<Episode> {
    return fetchApi<Episode>(`/api/books/${bookId}/episodes`, {
      method: 'POST',
      body: formData,
    });
  },

  async deleteEpisode(id: string): Promise<{ message: string }> {
    return fetchApi<{ message: string }>(`/api/episodes/${id}`, {
      method: 'DELETE',
    });
  },

  // Favorites
  async toggleFavorite(bookId: string): Promise<{ bookId: string; isFavorite: boolean }> {
    return fetchApi<{ bookId: string; isFavorite: boolean }>(`/api/favorites/${bookId}`, {
      method: 'POST',
    });
  },

  async getFavorites(): Promise<Book[]> {
    return fetchApi<Book[]>('/api/favorites');
  },

  // User Playback Progress
  async saveProgress(
    episodeId: string,
    bookId: string,
    positionSeconds: number,
    durationSeconds: number,
    completed = false
  ): Promise<UserProgress> {
    return fetchApi<UserProgress>('/api/progress', {
      method: 'POST',
      body: JSON.stringify({ episodeId, bookId, positionSeconds, durationSeconds, completed }),
    });
  },

  async getProgress(): Promise<UserProgress[]> {
    return fetchApi<UserProgress[]>('/api/progress');
  },
};
