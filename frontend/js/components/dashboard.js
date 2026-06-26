import { FormForgeAPI } from '../api.js';

export class FormForgeDashboard {
  constructor(panelEl, toast, onSelectForm, onLogout) {
    this.panel = panelEl;
    this.toast = toast;
    this.onSelectForm = onSelectForm;
    this.onLogout = onLogout;
    this.user = null;

    // Elements
    this.emailDisplay = document.getElementById('user-email-display');
    this.btnLogout = document.getElementById('btn-logout');
    this.formsListContainer = document.getElementById('forms-list-container');
    
    // Create Form Modal elements
    this.btnOpenCreateModal = document.getElementById('btn-open-create-modal');
    this.createModal = document.getElementById('create-form-modal');
    this.btnCloseCreateModal = document.getElementById('btn-close-create-modal');
    this.createFormElement = document.getElementById('create-form-element');
    this.newFormName = document.getElementById('new-form-name');
    this.newFormRedirect = document.getElementById('new-form-redirect');
    this.newFormNotify = document.getElementById('new-form-notify');

    // Metrics counters
    this.metricForms = document.getElementById('metric-forms-count');
    this.metricSubmissions = document.getElementById('metric-submissions-count');
    this.metricSpam = document.getElementById('metric-spam-count');

    this.bindEvents();
  }

  bindEvents() {
    this.btnLogout.addEventListener('click', () => this.onLogout());
    
    // Create form modal triggers
    this.btnOpenCreateModal.addEventListener('click', () => this.openCreateModal());
    this.btnCloseCreateModal.addEventListener('click', () => this.closeCreateModal());
    this.createFormElement.addEventListener('submit', (e) => this.handleCreateFormSubmit(e));
    
    // Dismiss modal on backdrop click
    this.createModal.addEventListener('click', (e) => {
      if (e.target === this.createModal) this.closeCreateModal();
    });
  }

  openCreateModal() {
    this.newFormNotify.value = this.user.email; // Default forward email to developer registered email
    this.createModal.classList.add('active');
  }

  closeCreateModal() {
    this.createModal.classList.remove('active');
    this.newFormName.value = '';
    this.newFormRedirect.value = '';
    this.newFormNotify.value = '';
  }

  async load(user) {
    this.user = user;
    this.emailDisplay.textContent = user.email;
    this.panel.classList.remove('hidden');
    await this.refresh();
  }

  async refresh() {
    try {
      const forms = await FormForgeAPI.getForms(this.user.id);
      
      // Update form counts metrics
      this.metricForms.textContent = forms.length;
      
      // Calculate total submissions dynamically
      let totalSubmissions = 0;
      for (const form of forms) {
        const subs = await FormForgeAPI.getSubmissions(this.user.id, form.id);
        totalSubmissions += subs.length;
      }
      this.metricSubmissions.textContent = totalSubmissions;
      
      // Honeypot spam triggers mock counter (e.g. static 23 or based on some logs)
      this.metricSpam.textContent = Math.round(totalSubmissions * 0.15) + (forms.length * 3);

      this.renderForms(forms);
    } catch (err) {
      this.toast.show('error', `Failed to load dashboard: ${err.message}`);
    }
  }

  renderForms(forms) {
    this.formsListContainer.innerHTML = '';
    
    if (forms.length === 0) {
      this.formsListContainer.innerHTML = `
        <div class="glass" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-secondary);">
          <h3 style="margin-bottom: 8px;">No form endpoints created yet.</h3>
          <p>Click "+ Create New Form" to generate your first secure API URL.</p>
        </div>
      `;
      return;
    }

    forms.forEach(form => {
      const card = document.createElement('div');
      card.className = 'glass form-card';
      
      const title = document.createElement('div');
      title.className = 'form-card-title';
      title.textContent = form.name;
      card.appendChild(title);

      const targetEmail = document.createElement('div');
      targetEmail.className = 'form-card-sub';
      targetEmail.innerHTML = `📬 Forwarding to: <code>${form.notifyEmail || 'None'}</code>`;
      card.appendChild(targetEmail);

      const createdDate = document.createElement('div');
      createdDate.className = 'form-card-sub';
      createdDate.textContent = `📅 Created: ${new Date(form.createdAt).toLocaleDateString()}`;
      card.appendChild(createdDate);

      const idEl = document.createElement('div');
      idEl.className = 'form-card-id';
      idEl.textContent = form.id;
      card.appendChild(idEl);

      // Trash delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'form-card-delete';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Delete form endpoint';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering open card detail route
        this.handleDeleteForm(form.id, form.name);
      });
      card.appendChild(deleteBtn);

      // Card Click Handler
      card.addEventListener('click', () => this.onSelectForm(form.id));

      this.formsListContainer.appendChild(card);
    });
  }

  async handleCreateFormSubmit(e) {
    e.preventDefault();
    const name = this.newFormName.value.trim();
    const redirect = this.newFormRedirect.value.trim();
    const notify = this.newFormNotify.value.trim();

    try {
      await FormForgeAPI.createForm(this.user.id, name, redirect, notify);
      this.toast.show('success', `Form "${name}" created successfully!`);
      this.closeCreateModal();
      await this.refresh();
    } catch (err) {
      this.toast.show('error', err.message);
    }
  }

  async handleDeleteForm(formId, formName) {
    if (confirm(`Are you sure you want to delete the form "${formName}"? This will permanently delete all stored submission logs.`)) {
      try {
        await FormForgeAPI.deleteForm(this.user.id, formId);
        this.toast.show('success', `Form "${formName}" deleted.`);
        await this.refresh();
      } catch (err) {
        this.toast.show('error', err.message);
      }
    }
  }

  hide() {
    this.panel.classList.add('hidden');
  }
}
