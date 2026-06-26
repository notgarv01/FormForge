import { auth } from './firebase.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } catch {
      // Token retrieval failed; request will be rejected as unauthenticated
    }
  }

  const response = await fetch(url, { ...options, headers });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.error ? data.error : 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}

export const FormForgeAPI = {
  getForms() {
    return request('/api/forms');
  },

  createForm(name, customRedirect, notifyEmail) {
    return request('/api/forms', {
      method: 'POST',
      body: JSON.stringify({ name, customRedirect, notifyEmail })
    });
  },

  updateForm(formId, customRedirect, notifyEmail) {
    return request(`/api/forms/${encodeURIComponent(formId)}`, {
      method: 'PUT',
      body: JSON.stringify({ customRedirect, notifyEmail })
    });
  },

  deleteForm(formId) {
    return request(`/api/forms/${encodeURIComponent(formId)}`, {
      method: 'DELETE'
    });
  },

  getSubmissions(formId) {
    return request(`/api/forms/${encodeURIComponent(formId)}/submissions`);
  }
};