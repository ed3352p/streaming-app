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

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Réponse invalide du serveur');
        }
      } else {
        data = {};
      }
    } else {
      data = {};
    }

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
    // Sauvegarder l'utilisateur dans localStorage pour les composants qui en ont besoin
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }

  async register(userData) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    // Sauvegarder l'utilisateur dans localStorage
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }

  async getMe() {
    const user = await this.request('/api/auth/me');
    // Mettre à jour le localStorage avec les données fraîches
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Vérification sécurisée du statut premium (anti-bypass)
  async verifyPremium() {
    try {
      const result = await this.request('/api/auth/verify-premium');
      console.log('verifyPremium API result:', result);
      return result;
    } catch (err) {
      console.error('verifyPremium error:', err);
      // Si pas connecté ou erreur, retourner les valeurs par défaut (non-premium)
      return { isPremium: false, maxQuality: 360, skipAds: false };
    }
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('user');
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

  // ============ ADS ============
  async getAds() {
    return this.request('/api/ads');
  }

  async createAd(adData) {
    return this.request('/api/ads', {
      method: 'POST',
      body: JSON.stringify(adData),
    });
  }

  async updateAd(id, adData) {
    return this.request(`/api/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(adData),
    });
  }

  async deleteAd(id) {
    return this.request(`/api/ads/${id}`, {
      method: 'DELETE',
    });
  }

  async trackAdImpression(adId, userId) {
    return this.request(`/api/ads/${adId}/impression`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async trackAdClick(adId, userId) {
    return this.request(`/api/ads/${adId}/click`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // ============ ANALYTICS ============
  async trackView(data) {
    return this.request('/api/analytics/view', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async trackSession(data) {
    return this.request('/api/analytics/session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async trackBandwidth(data) {
    return this.request('/api/analytics/bandwidth', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAnalytics(range = '24h') {
    return this.request(`/api/analytics?range=${range}`);
  }

  async getPopularContent(limit = 10) {
    return this.request(`/api/analytics/popular?limit=${limit}`);
  }

  async getStatsByGenre() {
    return this.request('/api/analytics/genres');
  }

  async getPeakHours() {
    return this.request('/api/analytics/peak-hours');
  }

  async getTrends(days = 7) {
    return this.request(`/api/analytics/trends?days=${days}`);
  }

  async getRealtimeStats() {
    return this.request('/api/analytics/realtime');
  }

  // ============ WATCHLIST ============
  async getWatchlist() {
    return this.request('/api/watchlist');
  }

  async addToWatchlist(contentId, contentType, title, imageUrl) {
    return this.request('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ contentId, contentType, title, imageUrl }),
    });
  }

  async removeFromWatchlist(id) {
    return this.request(`/api/watchlist/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ FAVORITES ============
  async getFavorites() {
    return this.request('/api/favorites');
  }

  async addToFavorites(contentId, contentType, title, imageUrl) {
    return this.request('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ contentId, contentType, title, imageUrl }),
    });
  }

  async removeFromFavorites(id) {
    return this.request(`/api/favorites/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ HISTORY ============
  async getHistory() {
    return this.request('/api/history');
  }

  async addToHistory(contentId, contentType, title, imageUrl, progress, duration) {
    return this.request('/api/history', {
      method: 'POST',
      body: JSON.stringify({ contentId, contentType, title, imageUrl, progress, duration }),
    });
  }

  async removeFromHistory(id) {
    return this.request(`/api/history/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ BOOKMARKS ============
  async getBookmark(contentId) {
    return this.request(`/api/bookmarks/${contentId}`);
  }

  async saveBookmark(contentId, contentType, timestamp, duration) {
    return this.request('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ contentId, contentType, timestamp, duration }),
    });
  }

  // ============ SEARCH ============
  async search(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/search?${queryString}`);
  }

  async getSearchSuggestions(query) {
    return this.request(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  // ============ VIDEO UPLOAD ============
  async initUpload(filename, totalChunks, fileSize) {
    return this.request('/api/upload/init', {
      method: 'POST',
      body: JSON.stringify({ filename, totalChunks, fileSize }),
    });
  }

  async uploadChunk(uploadId, chunkIndex, chunkData) {
    const formData = new FormData();
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex);
    formData.append('chunk', chunkData);

    const url = `${import.meta.env.VITE_API_URL || ''}/api/upload/chunk`;
    const token = this.getToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data;
  }

  async finalizeUpload(uploadId) {
    return this.request('/api/upload/finalize', {
      method: 'POST',
      body: JSON.stringify({ uploadId }),
    });
  }

  async getUploadStatus(uploadId) {
    return this.request(`/api/upload/status/${uploadId}`);
  }

  async processVideo(videoPath, baseName) {
    return this.request('/api/video/process', {
      method: 'POST',
      body: JSON.stringify({ videoPath, baseName }),
    });
  }

  // ============ PAYMENT & SUBSCRIPTION ============
  async getSubscriptionPlans() {
    return this.request('/api/subscription/plans');
  }

  async getBTCRate() {
    return this.request('/api/payment/btc-rate');
  }

  async createPayment(planId, promoCode = null) {
    return this.request('/api/payment/create', {
      method: 'POST',
      body: JSON.stringify({ planId, promoCode }),
    });
  }

  async verifyPayment(paymentId, txHash) {
    return this.request('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({ paymentId, txHash }),
    });
  }

  async getPayment(paymentId) {
    return this.request(`/api/payment/${paymentId}`);
  }

  async getPayments() {
    return this.request('/api/payments');
  }

  async getSubscription() {
    return this.request('/api/subscription');
  }

  async cancelSubscription() {
    return this.request('/api/subscription/cancel', {
      method: 'POST',
    });
  }

  async validatePromoCode(code) {
    return this.request('/api/promo/validate', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Admin
  async getAllPayments() {
    return this.request('/api/admin/payments');
  }

  async getAllSubscriptions() {
    return this.request('/api/admin/subscriptions');
  }

  async getPromoCodes() {
    return this.request('/api/admin/promo-codes');
  }

  async createPromoCode(data) {
    return this.request('/api/admin/promo-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePromoCode(id, data) {
    return this.request(`/api/admin/promo-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePromoCode(id) {
    return this.request(`/api/admin/promo-codes/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ ACCESS CODES ============
  async generateAccessCodes(duration, quantity) {
    return this.request('/api/admin/access-codes/generate', {
      method: 'POST',
      body: JSON.stringify({ duration, quantity }),
    });
  }

  async getAccessCodes() {
    return this.request('/api/admin/access-codes');
  }

  async getAccessCodesStats() {
    return this.request('/api/admin/access-codes/stats');
  }

  async deleteAccessCode(id) {
    return this.request(`/api/admin/access-codes/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteUsedAccessCodes() {
    return this.request('/api/admin/access-codes/used', {
      method: 'DELETE',
    });
  }

  async exportAccessCodes() {
    const token = this.getToken();
    const url = `${import.meta.env.VITE_API_URL || ''}/api/admin/access-codes/export`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'access_codes.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }

  async redeemAccessCode(code) {
    return this.request('/api/access-code/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // ============ SCRAPER ============
  async scrapeUrl(url) {
    return this.request('/api/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  // ============ NOTIFICATIONS ============
  async subscribeToNotifications(userId, subscription) {
    return this.request('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({ userId, subscription }),
    });
  }

  async getNotifications(userId) {
    return this.request(`/api/notifications/${userId}`);
  }

  async markNotificationAsRead(notificationId, userId) {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // ============ RECOMMENDATIONS ============
  async getRecommendations(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/recommendations?${queryString}`);
  }

  // ============ RATINGS ============
  async rateContent(contentId, contentType, rating) {
    return this.request('/api/ratings', {
      method: 'POST',
      body: JSON.stringify({ userId: this.getUserId(), contentId, contentType, rating }),
    });
  }

  async getContentRatings(contentId, contentType) {
    return this.request(`/api/ratings/${contentId}?contentType=${contentType}`);
  }

  // ============ COMMENTS ============
  async getComments(contentId, contentType) {
    return this.request(`/api/comments/${contentId}?contentType=${contentType}`);
  }

  async addComment(contentId, contentType, text) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.request('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, username: user.username, contentId, contentType, text }),
    });
  }

  async likeComment(commentId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.request(`/api/comments/${commentId}/like`, {
      method: 'POST',
      body: JSON.stringify({ userId: user.id }),
    });
  }

  async deleteComment(commentId) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.request(`/api/comments/${commentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId: user.id }),
    });
  }

  async reportComment(commentId) {
    return this.request(`/api/comments/${commentId}/report`, {
      method: 'POST',
    });
  }

  // ============ REFERRALS ============
  async getReferralCode(userId) {
    return this.request(`/api/referrals/code/${userId}`);
  }

  async getReferrals() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.request(`/api/referrals/${user.id}`);
  }

  async getReferralStats(userId) {
    return this.request(`/api/referrals/${userId}/stats`);
  }

  // ============ BADGES ============
  async getUserBadges() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.request(`/api/badges/${user.id}`);
  }

  async getBadgeProgress(userId) {
    return this.request(`/api/badges/${userId}/progress`);
  }

  // ============ USER STATS ============
  async getUserStats() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.request(`/api/stats/${user.id}`);
  }

  getUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  }
}

export const api = new ApiService();
export default api;
