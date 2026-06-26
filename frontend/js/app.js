import { FormForgeToast } from './components/toast.js';
import { FormForgeAuth } from './components/auth.js';
import { FormForgeDashboard } from './components/dashboard.js';
import { FormForgeFormDetails } from './components/form-details.js';

class FormForgeApp {
  constructor() {
    // Top-level Toast Notification system
    const toastContainer = document.getElementById('toast-container');
    this.toast = new FormForgeToast(toastContainer);

    // Track active user session
    this.user = null;

    // Retrieve Panel Containers
    this.authPanelEl = document.getElementById('auth-panel');
    this.dashboardPanelEl = document.getElementById('dashboard-panel');
    this.detailsPanelEl = document.getElementById('form-details-panel');

    // Instantiate Sub-Controllers
    this.authComponent = new FormForgeAuth(
      this.authPanelEl,
      this.toast,
      (user) => this.handleAuthSuccess(user)
    );

    this.dashboardComponent = new FormForgeDashboard(
      this.dashboardPanelEl,
      this.toast,
      (formId) => this.showFormDetails(formId),
      () => this.handleLogout()
    );

    this.detailsComponent = new FormForgeFormDetails(
      this.detailsPanelEl,
      this.toast,
      () => this.showDashboard()
    );

    // Initial routing configuration
    this.checkSession();
  }

  checkSession() {
    const session = localStorage.getItem('formforge_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        this.handleAuthSuccess(user);
      } catch (err) {
        localStorage.removeItem('formforge_session');
        this.showAuth();
      }
    } else {
      this.showAuth();
    }
  }

  handleAuthSuccess(user) {
    this.user = user;
    localStorage.setItem('formforge_session', JSON.stringify(user));
    
    this.authComponent.hide();
    this.detailsComponent.hide();
    this.dashboardComponent.load(user);
  }

  handleLogout() {
    this.user = null;
    localStorage.removeItem('formforge_session');
    
    this.dashboardComponent.hide();
    this.detailsComponent.hide();
    this.authComponent.show();
    this.toast.show('info', 'Logged out of FormForge Console.');
  }

  showAuth() {
    this.dashboardComponent.hide();
    this.detailsComponent.hide();
    this.authComponent.show();
  }

  showDashboard() {
    this.detailsComponent.hide();
    this.authComponent.hide();
    this.dashboardComponent.load(this.user);
  }

  showFormDetails(formId) {
    this.dashboardComponent.hide();
    this.authComponent.hide();
    this.detailsComponent.load(this.user, formId);
  }
}

// Initializer
window.addEventListener('DOMContentLoaded', () => {
  new FormForgeApp();
});
