import { FormForgeAPI } from '../api.js';

export class FormForgeAuth {
  constructor(panelEl, toast, onSuccess) {
    this.panel = panelEl;
    this.toast = toast;
    this.onSuccess = onSuccess;
    this.mode = 'login'; // 'login' or 'register'
    
    this.authForm = document.getElementById('auth-form');
    this.authTitle = document.getElementById('auth-title');
    this.authSubtitle = document.getElementById('auth-subtitle');
    this.authEmail = document.getElementById('auth-email');
    this.authPassword = document.getElementById('auth-password');
    this.btnSubmit = document.getElementById('btn-auth-submit');
    this.btnSwitch = document.getElementById('btn-auth-switch');
    this.switchText = document.getElementById('auth-switch-text');

    this.bindEvents();
  }

  bindEvents() {
    this.btnSwitch.addEventListener('click', () => this.toggleMode());
    this.authForm.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  toggleMode() {
    if (this.mode === 'login') {
      this.mode = 'register';
      this.authTitle.textContent = 'Create Account';
      this.authSubtitle.textContent = 'Register to build endpoints and connect headless forms.';
      this.btnSubmit.textContent = 'Sign Up';
      this.btnSwitch.textContent = 'Login';
      this.switchText.textContent = 'Already have an account?';
    } else {
      this.mode = 'login';
      this.authTitle.textContent = 'Welcome Back';
      this.authSubtitle.textContent = 'Login to configure form endpoints and read submissions.';
      this.btnSubmit.textContent = 'Login';
      this.btnSwitch.textContent = 'Sign Up';
      this.switchText.textContent = "Don't have an account?";
    }
    this.authEmail.value = '';
    this.authPassword.value = '';
  }

  async handleSubmit(e) {
    e.preventDefault();
    const email = this.authEmail.value.trim();
    const password = this.authPassword.value;

    this.btnSubmit.disabled = true;
    try {
      if (this.mode === 'login') {
        const user = await FormForgeAPI.login(email, password);
        this.toast.show('success', 'Logged in successfully!');
        this.onSuccess(user);
      } else {
        await FormForgeAPI.register(email, password);
        this.toast.show('success', 'Registration successful! You can now log in.');
        this.toggleMode();
      }
    } catch (err) {
      this.toast.show('error', err.message);
    } finally {
      this.btnSubmit.disabled = false;
    }
  }

  show() {
    this.panel.classList.remove('hidden');
  }

  hide() {
    this.panel.classList.add('hidden');
    this.authEmail.value = '';
    this.authPassword.value = '';
  }
}
