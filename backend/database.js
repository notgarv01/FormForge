import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

class FormForgeDatabase {
  constructor() {
    this.data = {
      users: [],
      forms: [],
      submissions: []
    };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to initialize FormForge database:', err);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  // --- USER API ---
  createUser(email, password) {
    const existing = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      email: email,
      password: password, // In a real app, hash this, but simple text matches spec mock boundaries
      createdAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.save();
    return { id: newUser.id, email: newUser.email };
  }

  authenticateUser(email, password) {
    const user = this.data.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    return { id: user.id, email: user.email };
  }

  // --- FORMS API ---
  createForm(userId, name, customRedirect = '', notifyEmail = '') {
    const formId = 'frm_' + Math.random().toString(36).substr(2, 9);
    const newForm = {
      id: formId,
      userId: userId,
      name: name,
      customRedirect: customRedirect,
      notifyEmail: notifyEmail || this.data.users.find(u => u.id === userId)?.email || '',
      createdAt: new Date().toISOString()
    };

    this.data.forms.push(newForm);
    this.save();
    return newForm;
  }

  getForms(userId) {
    return this.data.forms.filter(f => f.userId === userId);
  }

  getForm(formId) {
    return this.data.forms.find(f => f.id === formId);
  }

  updateForm(userId, formId, customRedirect, notifyEmail) {
    const form = this.data.forms.find(f => f.id === formId && f.userId === userId);
    if (!form) {
      throw new Error('Form not found or unauthorized.');
    }
    form.customRedirect = customRedirect;
    form.notifyEmail = notifyEmail;
    this.save();
    return form;
  }

  deleteForm(userId, formId) {
    const initialLength = this.data.forms.length;
    this.data.forms = this.data.forms.filter(f => !(f.id === formId && f.userId === userId));
    
    if (this.data.forms.length < initialLength) {
      // Also delete related submissions
      this.data.submissions = this.data.submissions.filter(s => s.formId !== formId);
      this.save();
      return true;
    }
    return false;
  }

  // --- SUBMISSIONS API ---
  addSubmission(formId, payload) {
    const form = this.getForm(formId);
    if (!form) {
      throw new Error('Form not found.');
    }

    const submission = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      formId: formId,
      payload: payload,
      createdAt: new Date().toISOString()
    };

    this.data.submissions.push(submission);
    this.save();
    return submission;
  }

  getSubmissions(formId) {
    return this.data.submissions
      .filter(s => s.formId === formId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

export const db = new FormForgeDatabase();
