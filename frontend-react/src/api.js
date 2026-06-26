const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.error ? data.error : 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return data;
}

export const FormForgeAPI = {
  register(email, password) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  login(email, password) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  getForms(userId) {
    return request(`/api/forms?userId=${encodeURIComponent(userId)}`);
  },

  createForm(userId, name, customRedirect, notifyEmail) {
    return request('/api/forms', {
      method: 'POST',
      body: JSON.stringify({ userId, name, customRedirect, notifyEmail })
    });
  },

  updateForm(userId, formId, customRedirect, notifyEmail) {
    return request(`/api/forms/${encodeURIComponent(formId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({ customRedirect, notifyEmail })
    });
  },

  deleteForm(userId, formId) {
    return request(`/api/forms/${encodeURIComponent(formId)}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
  },

  getSubmissions(userId, formId) {
    return request(`/api/forms/${encodeURIComponent(formId)}/submissions?userId=${encodeURIComponent(userId)}`);
  }
};
