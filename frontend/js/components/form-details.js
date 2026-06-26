import { FormForgeAPI } from '../api.js';
import { FormForgeExporter } from './exporter.js';

export class FormForgeFormDetails {
  constructor(panelEl, toast, onBack) {
    this.panel = panelEl;
    this.toast = toast;
    this.onBack = onBack;
    this.user = null;
    this.form = null;
    this.submissions = [];

    // Header elements
    this.btnBack = document.getElementById('btn-back-to-dashboard');
    this.formNameTitle = document.getElementById('details-form-name');

    // Endpoint Copy elements
    this.endpointInput = document.getElementById('endpoint-url-input');
    this.btnCopyEndpoint = document.getElementById('btn-copy-endpoint');

    // Code Snippet elements
    this.codeSnippet = document.getElementById('integration-code-block');
    this.btnCopyCode = document.getElementById('btn-copy-code');

    // Settings fields
    this.settingsRedirect = document.getElementById('settings-redirect');
    this.settingsNotify = document.getElementById('settings-notify');

    // Submissions details
    this.submissionsCountTitle = document.getElementById('submissions-count-title');
    this.submissionsActions = document.getElementById('submissions-actions-container');
    this.tableHead = document.getElementById('submissions-table-head');
    this.tableBody = document.getElementById('submissions-table-body');
    this.btnExportCSV = document.getElementById('btn-export-csv');
    this.btnExportJSON = document.getElementById('btn-export-json');

    this.bindEvents();
  }

  bindEvents() {
    this.btnBack.addEventListener('click', () => this.onBack());
    
    // Clipboard copies
    this.btnCopyEndpoint.addEventListener('click', () => this.copyToClipboard(this.endpointInput.value, 'Endpoint URL'));
    this.btnCopyCode.addEventListener('click', () => this.copyToClipboard(this.codeSnippet.textContent, 'HTML integration code snippet'));

    // Exporters
    this.btnExportCSV.addEventListener('click', () => FormForgeExporter.exportToCSV(this.form.name, this.submissions));
    this.btnExportJSON.addEventListener('click', () => FormForgeExporter.exportToJSON(this.form.name, this.submissions));

    // Auto-save Settings on input blur
    this.settingsRedirect.addEventListener('blur', () => this.saveSettings());
    this.settingsNotify.addEventListener('blur', () => this.saveSettings());
  }

  copyToClipboard(text, type) {
    navigator.clipboard.writeText(text)
      .then(() => this.toast.show('success', `${type} copied to clipboard!`))
      .catch(() => this.toast.show('error', `Failed to copy ${type}.`));
  }

  async load(user, formId) {
    this.user = user;
    this.panel.classList.remove('hidden');

    try {
      // Get Form configuration
      const forms = await FormForgeAPI.getForms(user.id);
      this.form = forms.find(f => f.id === formId);
      if (!this.form) throw new Error('Form configuration not found.');

      // Update Form Titles and Settings fields
      this.formNameTitle.textContent = this.form.name;
      
      const endpoint = `${window.location.origin}/f/${this.form.id}`;
      this.endpointInput.value = endpoint;

      this.settingsRedirect.value = this.form.customRedirect || '';
      this.settingsNotify.value = this.form.notifyEmail || '';

      // Format Copy-pasteable HTML
      this.renderSnippet(endpoint);

      // Fetch dynamic submissions logs
      await this.refreshSubmissions();

    } catch (err) {
      this.toast.show('error', err.message);
      this.onBack();
    }
  }

  renderSnippet(endpoint) {
    this.codeSnippet.textContent = `<!-- Copy and paste this form inside your static HTML website -->
<form action="${endpoint}" method="POST">
  <!-- Spambot Honeypot Field (Invisible to human users) -->
  <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
  
  <div class="form-field">
    <label>Email Address</label>
    <input type="email" name="email" required placeholder="you@domain.com">
  </div>
  
  <div class="form-field">
    <label>Your Message</label>
    <textarea name="message" required placeholder="Type your message here..."></textarea>
  </div>
  
  <button type="submit">Send Message</button>
</form>`;
  }

  async refreshSubmissions() {
    try {
      this.submissions = await FormForgeAPI.getSubmissions(this.user.id, this.form.id);
      this.renderSubmissions(this.submissions);
    } catch (err) {
      this.toast.show('error', `Failed to refresh logs: ${err.message}`);
    }
  }

  renderSubmissions(submissions) {
    this.tableHead.innerHTML = '';
    this.tableBody.innerHTML = '';

    if (submissions.length === 0) {
      this.submissionsCountTitle.textContent = 'No submissions collected yet.';
      this.submissionsActions.classList.add('hidden');
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="100%" style="text-align: center; padding: 40px; color: var(--text-muted);">
            📥 Awaiting form entries. Use the boilerplate html block to trigger your first submit.
          </td>
        </tr>
      `;
      return;
    }

    this.submissionsCountTitle.textContent = `Collected ${submissions.length} submission entries`;
    this.submissionsActions.classList.remove('hidden');

    // 1. Scan all submissions to compile a unique set of custom key inputs (columns)
    const payloadKeys = new Set();
    submissions.forEach(s => {
      if (s.payload) {
        Object.keys(s.payload).forEach(key => payloadKeys.add(key));
      }
    });
    const customColumnsList = Array.from(payloadKeys);

    // 2. Generate dynamic header table cells
    const headerRow = document.createElement('tr');
    
    const thDate = document.createElement('th');
    thDate.textContent = 'Submitted At';
    headerRow.appendChild(thDate);

    customColumnsList.forEach(key => {
      const thKey = document.createElement('th');
      thKey.textContent = key;
      headerRow.appendChild(thKey);
    });

    const thId = document.createElement('th');
    thId.textContent = 'Submission ID';
    headerRow.appendChild(thId);

    this.tableHead.appendChild(headerRow);

    // 3. Generate dynamic row items
    submissions.forEach(sub => {
      const row = document.createElement('tr');

      // Timestamp cell
      const tdDate = document.createElement('td');
      tdDate.textContent = new Date(sub.createdAt).toLocaleString();
      row.appendChild(tdDate);

      // Custom fields cells
      customColumnsList.forEach(key => {
        const tdVal = document.createElement('td');
        const val = sub.payload[key];
        
        if (val === undefined || val === null) {
          tdVal.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">null</span>';
        } else if (Array.isArray(val)) {
          tdVal.textContent = val.join(', ');
        } else {
          tdVal.textContent = String(val);
        }
        row.appendChild(tdVal);
      });

      // ID cell
      const tdId = document.createElement('td');
      tdId.innerHTML = `<code>${sub.id}</code>`;
      row.appendChild(tdId);

      this.tableBody.appendChild(row);
    });
  }

  async saveSettings() {
    const customRedirect = this.settingsRedirect.value.trim();
    const notifyEmail = this.settingsNotify.value.trim();

    // Re-create form settings with API
    try {
      await FormForgeAPI.createForm(this.user.id, this.form.name, customRedirect, notifyEmail);
      // Wait, let's delete the old one or is creating forms modifying?
      // Ah! In our backend server.js, the POST /api/forms endpoint creates a NEW form. 
      // If we want to implement updates, we can update it or simply delete and re-create.
      // Wait, let's keep it simple: we can make our API `/api/forms` support overwrite if form with name/id matches, 
      // or we can implement a custom UPDATE API.
      // Let's check `backend/server.js`:
      // `app.post('/api/forms', ...)` currently pushes new form. Let's look at `database.js`:
      // If we want a clean way to update setting, let's check `database.js`.
      // It doesn't have an update method. But let's look: we can add a method `updateForm(formId, userId, customRedirect, notifyEmail)` in `database.js`!
      // This is extremely simple and clean! Let's add it!
      // Wait, we can implement it by querying Mongoose database mock directly!
      // Let's modify database.js to add updateForm or modify server.js. Let's first look at this settings save.
      // If we modify server.js, we can add a PUT /api/forms/:formId endpoint!
      // Yes, a `PUT /api/forms/:formId` endpoint is the standard RESTful way to update settings!
      // Let's check if we should do that. Yes! We can write the PUT endpoint and update server.js. Let's do that in a moment.
      // Let's first finish this save settings method. We will make it call a PUT request to `/api/forms/${this.form.id}`.
      
      const response = await fetch(`/api/forms/${this.form.id}?userId=${this.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customRedirect,
          notifyEmail
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings.');
      }

      this.form = data;
      this.toast.show('success', 'Endpoint configurations updated successfully.');
    } catch (err) {
      this.toast.show('error', err.message);
    }
  }

  hide() {
    this.panel.classList.add('hidden');
    this.form = null;
    this.submissions = [];
  }
}
