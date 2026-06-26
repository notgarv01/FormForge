import { CONFIG } from './config.js';

export class FormForgeAPI {
  static async request(endpoint, options = {}) {
    let url;
    if (endpoint.startsWith('http')) {
      url = endpoint;
    } else {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const base = isLocal ? window.location.origin : (CONFIG.BACKEND_URL || window.location.origin);
      url = `${base}${endpoint}`;
    }
    
    // Append standard headers
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong. Please try again.');
    }

    return data;
  }

  // --- Auth Methods ---
  static async register(email, password) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // --- Forms Operations ---
  static async getForms(userId) {
    return this.request(`/api/forms?userId=${userId}`);
  }

  static async createForm(userId, name, customRedirect, notifyEmail) {
    return this.request('/api/forms', {
      method: 'POST',
      body: JSON.stringify({ userId, name, customRedirect, notifyEmail })
    });
  }

  static async deleteForm(userId, formId) {
    return this.request(`/api/forms/${formId}?userId=${userId}`, {
      method: 'DELETE'
    });
  }

  // --- Submissions View ---
  static async getSubmissions(userId, formId) {
    return this.request(`/api/forms/${formId}/submissions?userId=${userId}`);
  }
}
