import { projectId, publicAnonKey } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c8938417`;

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async signup(email: string, password: string, name: string) {
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Dogs
  async getDogs() {
    return this.request('/dogs');
  }

  async createDog(dog: any) {
    return this.request('/dogs', {
      method: 'POST',
      body: JSON.stringify(dog),
    });
  }

  async deleteDog(id: string) {
    return this.request(`/dogs/${id}`, {
      method: 'DELETE',
    });
  }

  // Tracks
  async getTracks() {
    return this.request('/tracks');
  }

  async getTrack(id: string) {
    return this.request(`/tracks/${id}`);
  }

  async createTrack(track: any) {
    return this.request('/tracks', {
      method: 'POST',
      body: JSON.stringify(track),
    });
  }

  // Sharing
  async shareTrack(trackId: string) {
    return this.request(`/tracks/${trackId}/share`, {
      method: 'POST',
    });
  }

  async getSharedTrack(code: string) {
    // Public endpoint, no auth needed
    const response = await fetch(`${API_URL}/shared/${code}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async importSharedTrack(code: string) {
    return this.request(`/shared/${code}/import`, {
      method: 'POST',
    });
  }

  // Live tracking
  async createLiveSession(dogId: string, type: 'trail' | 'tracking') {
    return this.request('/live-sessions', {
      method: 'POST',
      body: JSON.stringify({ dogId, type }),
    });
  }

  async getLiveSession(sessionId: string) {
    // Public endpoint for instructors to view
    const response = await fetch(`${API_URL}/live-sessions/${sessionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async updateLiveSession(sessionId: string, data: any) {
    return this.request(`/live-sessions/${sessionId}/update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async endLiveSession(sessionId: string) {
    return this.request(`/live-sessions/${sessionId}/end`, {
      method: 'POST',
    });
  }

  // Export
  async exportTrackGPX(trackId: string) {
    const headers: HeadersInit = {
      'Authorization': this.token ? `Bearer ${this.token}` : `Bearer ${publicAnonKey}`,
    };

    const response = await fetch(`${API_URL}/tracks/${trackId}/export`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to export track');
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient();
