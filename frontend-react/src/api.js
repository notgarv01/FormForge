import { auth } from './firebase.js';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const isMocked = !import.meta.env.VITE_FIREBASE_API_KEY;

// Mock local storage database for when Firebase is missing
const MOCK_FORMS_KEY = 'formforge_mock_forms';
const MOCK_SUBMISSIONS_KEY = 'formforge_mock_submissions';

function getMockForms() {
  const data = localStorage.getItem(MOCK_FORMS_KEY);
  return data ? JSON.parse(data) : [
    {
      id: 'form_dev_1',
      name: 'Portfolio Contact Form',
      customRedirect: 'https://mysite.com/thanks',
      notifyEmail: 'dev-user@formforge.dev',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'form_dev_2',
      name: 'Newsletter Signup Form',
      customRedirect: '',
      notifyEmail: 'dev-user@formforge.dev',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ];
}

function saveMockForms(forms) {
  localStorage.setItem(MOCK_FORMS_KEY, JSON.stringify(forms));
}

function getMockSubmissions() {
  const data = localStorage.getItem(MOCK_SUBMISSIONS_KEY);
  return data ? JSON.parse(data) : [
    {
      id: 'sub_1',
      formId: 'form_dev_1',
      createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      payload: { name: 'John Doe', email: 'john@domain.com', message: 'Interested in working with you!' }
    },
    {
      id: 'sub_2',
      formId: 'form_dev_1',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      payload: { name: 'Alice Smith', email: 'alice@domain.com', message: 'Hello, what is your rate?' }
    },
    {
      id: 'sub_3',
      formId: 'form_dev_2',
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      payload: { email: 'subscriber@gmail.com' }
    }
  ];
}

function saveMockSubmissions(submissions) {
  localStorage.setItem(MOCK_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

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
  async getForms() {
    if (isMocked) {
      await new Promise(r => setTimeout(r, 400));
      return getMockForms();
    }
    return request('/api/forms');
  },

  async createForm(name, customRedirect, notifyEmail) {
    if (isMocked) {
      await new Promise(r => setTimeout(r, 400));
      const forms = getMockForms();
      const newForm = {
        id: 'form_' + Math.random().toString(36).substring(2, 9),
        name,
        customRedirect,
        notifyEmail,
        createdAt: new Date().toISOString()
      };
      forms.push(newForm);
      saveMockForms(forms);
      return newForm;
    }
    return request('/api/forms', {
      method: 'POST',
      body: JSON.stringify({ name, customRedirect, notifyEmail })
    });
  },

  async updateForm(formId, customRedirect, notifyEmail) {
    if (isMocked) {
      await new Promise(r => setTimeout(r, 400));
      const forms = getMockForms();
      const idx = forms.findIndex(f => f.id === formId);
      if (idx !== -1) {
        forms[idx].customRedirect = customRedirect;
        forms[idx].notifyEmail = notifyEmail;
        saveMockForms(forms);
        return forms[idx];
      }
      throw new Error('Form not found');
    }
    return request(`/api/forms/${encodeURIComponent(formId)}`, {
      method: 'PUT',
      body: JSON.stringify({ customRedirect, notifyEmail })
    });
  },

  async deleteForm(formId) {
    if (isMocked) {
      await new Promise(r => setTimeout(r, 400));
      const forms = getMockForms();
      const nextForms = forms.filter(f => f.id !== formId);
      saveMockForms(nextForms);
      
      const subs = getMockSubmissions();
      const nextSubs = subs.filter(s => s.formId !== formId);
      saveMockSubmissions(nextSubs);
      return { success: true };
    }
    return request(`/api/forms/${encodeURIComponent(formId)}`, {
      method: 'DELETE'
    });
  },

  async getSubmissions(formId) {
    if (isMocked) {
      await new Promise(r => setTimeout(r, 400));
      const subs = getMockSubmissions();
      return subs.filter(s => s.formId === formId);
    }
    return request(`/api/forms/${encodeURIComponent(formId)}/submissions`);
  }
};