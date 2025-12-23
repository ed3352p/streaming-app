const API_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data;
  }

  // ============ AUTH ============
  async login(identifier, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    this.setToken(data.token);
    return data.user;
  }

  async register(userData) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data.user;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // ============ MOVIES ============
  async getMovies() {
    return this.request('/api/movies');
  }

  async getMovie(id) {
    return this.request(`/api/movies/${id}`);
  }

  async createMovie(movieData) {
    return this.request('/api/movies', {
      method: 'POST',
      body: JSON.stringify(movieData),
    });
  }

  async updateMovie(id, movieData) {
    return this.request(`/api/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData),
    });
  }

  async deleteMovie(id) {
    return this.request(`/api/movies/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ SERIES ============
  async getSeries() {
    return this.request('/api/series');
  }

  async getSeriesById(id) {
    return this.request(`/api/series/${id}`);
  }

  async createSeries(seriesData) {
    return this.request('/api/series', {
      method: 'POST',
      body: JSON.stringify(seriesData),
    });
  }

  async updateSeries(id, seriesData) {
    return this.request(`/api/series/${id}`, {
      method: 'PUT',
      body: JSON.stringify(seriesData),
    });
  }

  async deleteSeries(id) {
    return this.request(`/api/series/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ IPTV ============
  async getIPTV() {
    return this.request('/api/iptv');
  }

  async createIPTV(channelData) {
    return this.request('/api/iptv', {
      method: 'POST',
      body: JSON.stringify(channelData),
    });
  }

  async updateIPTV(id, channelData) {
    return this.request(`/api/iptv/${id}`, {
      method: 'PUT',
      body: JSON.stringify(channelData),
    });
  }

  async deleteIPTV(id) {
    return this.request(`/api/iptv/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ USERS (Admin) ============
  async getUsers() {
    return this.request('/api/users');
  }

  async updateUser(id, userData) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  async createUser(userData) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async resetUserPassword(id) {
    return this.request(`/api/users/${id}/reset-password`, {
      method: 'POST',
    });
  }

  // ============ PASSWORD ============
  async changePassword(currentPassword, newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
}

export const api = new ApiService();
export default api;
