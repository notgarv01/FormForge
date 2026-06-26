import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clipboard,
  Code2,
  Download,
  FileJson,
  Inbox,
  LogOut,
  Mail,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Wrench
} from 'lucide-react';
import { API_BASE_URL, FormForgeAPI } from './api.js';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from './firebase.js';
import { exportSubmissionsToCSV, exportSubmissionsToJSON } from './exporter.js';
import './styles.css';
import LandingPage from './LandingPage.jsx';

const SESSION_KEY = 'formforge_session';

function useToasts() {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  };

  return { toasts, showToast };
}

function Toasts({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div className={`toast ${toast.type}`} key={toast.id}>
          <span className="toast-icon">{toast.type === 'success' ? <Check size={16} /> : toast.type === 'error' ? '!' : 'i'}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function Logo({ label = 'FormForge Console' }) {
  return (
    <div className="logo">
      <span className="logo-icon"><Wrench size={16} /></span>
      <span className="logo-text">{label}</span>
    </div>
  );
}

function LoadingScreen({ label = 'Loading your endpoints...' }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-orb" />
      <Logo />
      <div className="loading-label">{label}</div>
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay active" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="glass modal-content confirm-dialog" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} type="button" autoFocus onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

function AuthPanel({ onAuth, showToast, onBack }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === 'login';

  async function signInWithGoogle() {
    setSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuth(formatFirebaseUser(result.user));
      showToast('success', `Welcome, ${result.user.displayName || result.user.email}.`);
    } catch (error) {
      showToast('error', humanizeAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      let credential;
      if (isLogin) {
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        showToast('success', 'Logged in successfully.');
      } else {
        credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        showToast('success', 'Account created. You are now signed in.');
      }
      onAuth(formatFirebaseUser(credential.user));
    } catch (error) {
      showToast('error', humanizeAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(isLogin ? 'register' : 'login');
    setEmail('');
    setPassword('');
  }

  return (
    <main className="auth-panel">
      <section className="glass auth-card">
        <div style={{ textAlign: 'left', marginBottom: '14px' }}>
          <button className="btn btn-link btn-compact" type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}>
            <ArrowLeft size={14} /> Back to Home
          </button>
        </div>
        <Logo label="FormForge Auth" />
        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="subtitle">
          {isLogin ? 'Login to configure form endpoints and read submissions.' : 'Register to build endpoints and connect headless forms.'}
        </p>

        <button className="btn btn-google" type="button" onClick={signInWithGoogle} disabled={submitting}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.659 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.96H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.04l3.007-2.333z" fill="#FBBC05"/>
            <path d="M9 3.58c1.32 0 2.505.453 3.44 1.35l2.58-2.58C13.463.804 11.426 0 9 0 5.482 0 2.438 2.341.957 5.308l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        <form className="stacked-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email Address</span>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" required minLength={6} />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Working...' : isLogin ? 'Login with Email' : 'Sign Up with Email'}
          </button>
        </form>

        <div className="auth-switch">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button className="btn-link" type="button" onClick={switchMode}>{isLogin ? 'Sign Up' : 'Login'}</button>
        </div>
      </section>
    </main>
  );
}

function formatFirebaseUser(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || ''
  };
}

function humanizeAuthError(error) {
  const code = error?.code || '';
  const map = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Popup was blocked by your browser. Allow popups and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.'
  };
  return map[code] || error.message || 'Authentication failed.';
}

function Dashboard({ user, onLogout, onSelectForm, showToast }) {
  const [forms, setForms] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const nextForms = await FormForgeAPI.getForms();
      setForms(nextForms);
      try {
        const counts = await Promise.all(nextForms.map((form) => FormForgeAPI.getSubmissions(form.id).then((items) => items.length).catch(() => 0)));
        setForms((current) => current.map((f, i) => ({ ...f, _count: counts[i] || 0 })));
        setSubmissionCount(counts.reduce((total, count) => total + count, 0));
      } catch {
        // counts are non-critical
      }
    } catch (error) {
      showToast('error', `Failed to load dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [user.uid]);

  async function deleteForm(form, event) {
    event.stopPropagation();
    setPendingDelete(form);
  }

  async function confirmDelete() {
    const form = pendingDelete;
    if (!form) return;
    setPendingDelete(null);

    // Optimistic update — remove card instantly, no reload needed
    const previousForms = forms;
    const previousCount = submissionCount;
    setForms((current) => current.filter((f) => f.id !== form.id));
    setSubmissionCount(Math.max(0, submissionCount - (form._count || 0)));

    try {
      await FormForgeAPI.deleteForm(form.id);
      showToast('success', `Form "${form.name}" deleted.`);
      FormForgeAPI.getSubmissions(form.id).catch(() => []);
    } catch (error) {
      // Roll back if the server rejected the delete
      setForms(previousForms);
      setSubmissionCount(previousCount);
      showToast('error', error.message);
    }
  }

  // Full-screen loader covers the dashboard until the first form list arrives
  if (loading) {
    return <LoadingScreen label="Loading your endpoints..." />;
  }

  return (
    <main className="console">
      <header className="topbar">
        <Logo />
        <div className="session">
          <span className="session-email">{user.displayName || user.email}</span>
          <button className="btn btn-secondary btn-compact" type="button" onClick={onLogout}><LogOut size={16} />Logout</button>
        </div>
      </header>

      <section className="metrics-grid">
        <Metric label="Active Forms" value={forms.length} sub="Connected endpoints" />
        <Metric label="Total Submissions" value={submissionCount} sub="Stored submission logs" />
        <Metric label="Spam Blocked" value={Math.round(submissionCount * 0.15) + forms.length * 3} sub="Estimated honeypot triggers" />
      </section>

      <section className="dashboard-heading">
        <h2>My Form Endpoints</h2>
        <button className="btn btn-primary" type="button" onClick={() => setCreateOpen(true)}><Plus size={17} />Create New Form</button>
      </section>

      <section className="forms-grid">
        {forms.length === 0 ? (
          <div className="glass empty-state">
            <h3>No form endpoints created yet.</h3>
            <p>Create your first secure API URL to start collecting form submissions.</p>
          </div>
        ) : forms.map((form) => (
          <article className="glass form-card" key={form.id} onClick={() => onSelectForm(form.id)} tabIndex={0}>
            <button className="icon-button danger" type="button" title="Delete form endpoint" onClick={(event) => deleteForm(form, event)}>
              <Trash2 size={17} />
            </button>
            <h3>{form.name}</h3>
            <p><Mail size={15} /> Forwarding to: <code>{form.notifyEmail || 'None'}</code></p>
            <p><CalendarDays size={15} /> Created: {new Date(form.createdAt).toLocaleDateString()}</p>
            <code className="form-id">{form.id}</code>
          </article>
        ))}
      </section>

      {createOpen && <CreateFormModal user={user} onClose={() => setCreateOpen(false)} onCreated={refresh} showToast={showToast} />}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete form endpoint?"
          message={`Are you sure you want to delete "${pendingDelete.name}"? This will permanently delete all stored submission logs and cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div className="glass metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

function CreateFormModal({ user, onClose, onCreated, showToast }) {
  const [name, setName] = useState('');
  const [customRedirect, setCustomRedirect] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(user.email);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await FormForgeAPI.createForm(name.trim(), customRedirect.trim(), notifyEmail.trim());
      showToast('success', `Form "${name.trim()}" created successfully.`);
      onClose();
      await onCreated();
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay active" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="glass modal-content">
        <h2>Create New Form</h2>
        <p>Configure a secure endpoint identifier for your static web project.</p>
        <form className="stacked-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Form Name</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Portfolio Contact Form" required />
          </label>
          <label className="form-field">
            <span>Custom Thank-you Page</span>
            <input className="input" type="url" value={customRedirect} onChange={(event) => setCustomRedirect(event.target.value)} placeholder="https://domain.com/thank-you" />
          </label>
          <label className="form-field">
            <span>Alert Notification Email</span>
            <input className="input" type="email" value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} placeholder="alert@domain.com" />
          </label>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Endpoint'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function FormDetails({ user, formId, onBack, showToast }) {
  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [customRedirect, setCustomRedirect] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const endpoint = form ? `${API_BASE_URL || window.location.origin}/f/${form.id}` : '';
  const snippet = useMemo(() => endpoint ? `<!-- Copy and paste this form inside your static HTML website -->
<form action="${endpoint}" method="POST">
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
</form>` : '', [endpoint]);

  async function load() {
    try {
      const forms = await FormForgeAPI.getForms();
      const selected = forms.find((item) => item.id === formId);
      if (!selected) throw new Error('Form configuration not found.');

      setForm(selected);
      setCustomRedirect(selected.customRedirect || '');
      setNotifyEmail(selected.notifyEmail || '');
      const nextSubmissions = await FormForgeAPI.getSubmissions(selected.id);
      setSubmissions(nextSubmissions);
    } catch (error) {
      showToast('error', error.message);
      onBack();
    }
  }

  useEffect(() => {
    load();
  }, [formId, user.uid]);

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `${label} copied to clipboard.`);
    } catch {
      showToast('error', `Failed to copy ${label}.`);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);

    try {
      const updated = await FormForgeAPI.updateForm(form.id, customRedirect.trim(), notifyEmail.trim());
      setForm(updated);
      showToast('success', 'Endpoint configuration updated.');
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo(() => {
    const keys = new Set();
    submissions.forEach((submission) => Object.keys(submission.payload || {}).forEach((key) => keys.add(key)));
    return Array.from(keys);
  }, [submissions]);

  if (!form) {
    return <main className="console"><div className="glass empty-state">Loading form details...</div></main>;
  }

  return (
    <main className="console">
      <header className="details-header">
        <button className="btn btn-secondary" type="button" onClick={onBack}><ArrowLeft size={17} />Back to Console</button>
        <h2>{form.name}</h2>
      </header>

      <section className="details-grid">
        <div className="panel-stack">
          <section className="glass panel">
            <div className="section-title"><ShieldCheck size={14} />Unique Backend Endpoint</div>
            <div className="endpoint-row">
              <input className="input code-input" value={endpoint} readOnly />
              <button className="btn btn-primary" type="button" onClick={() => copy(endpoint, 'Endpoint URL')}><Clipboard size={16} />Copy URL</button>
            </div>
            <p className="hint">Paste this secure URL inside your static form action attribute.</p>
          </section>

          <section className="glass panel">
            <div className="section-title"><Code2 size={14} />HTML Integration Snippet</div>
            <p className="hint">Includes the hidden honeypot field used by the submission endpoint.</p>
            <div className="code-wrapper">
              <pre><code>{snippet}</code></pre>
              <button className="btn btn-secondary btn-copy" type="button" onClick={() => copy(snippet, 'HTML integration snippet')}><Clipboard size={14} />Copy</button>
            </div>
          </section>
        </div>

        <section className="glass panel">
          <div className="section-title"><Settings size={14} />Endpoint Configuration</div>
          <form className="stacked-form" onSubmit={saveSettings}>
            <label className="form-field">
              <span>Custom Redirect URL</span>
              <input className="input" type="url" value={customRedirect} onChange={(event) => setCustomRedirect(event.target.value)} placeholder="https://yourwebsite.com/thank-you" />
              <small>Redirects users after a successful form submission.</small>
            </label>
            <label className="form-field">
              <span>Forward Email Alerts</span>
              <input className="input" type="email" value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} placeholder="alerts@yourdomain.com" />
              <small>Receives complete JSON payloads inside your developer inbox.</small>
            </label>
            <button className="btn btn-primary" type="submit" disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Save Settings'}</button>
          </form>
        </section>
      </section>

      <section className="glass panel submissions-panel">
        <div className="submissions-header">
          <div>
            <div className="section-title"><Inbox size={14} />Submission Logs</div>
            <h3>{submissions.length === 0 ? 'No submissions collected yet.' : `Collected ${submissions.length} submission entries`}</h3>
          </div>
          {submissions.length > 0 && (
            <div className="actions">
              <button className="btn btn-secondary" type="button" onClick={() => exportSubmissionsToCSV(form.name, submissions)}><Download size={16} />CSV</button>
              <button className="btn btn-secondary" type="button" onClick={() => exportSubmissionsToJSON(form.name, submissions)}><FileJson size={16} />JSON</button>
            </div>
          )}
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              {submissions.length > 0 && (
                <tr>
                  <th>Submitted At</th>
                  {columns.map((column) => <th key={column}>{column}</th>)}
                  <th>Submission ID</th>
                </tr>
              )}
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr><td className="empty-cell">Awaiting form entries. Use the HTML block to trigger your first submit.</td></tr>
              ) : submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{new Date(submission.createdAt).toLocaleString()}</td>
                  {columns.map((column) => {
                    const value = submission.payload?.[column];
                    return <td key={column}>{value === undefined || value === null ? <em>null</em> : Array.isArray(value) ? value.join(', ') : String(value)}</td>;
                  })}
                  <td><code>{submission.id}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function App() {
  const { toasts, showToast } = useToasts();
  const [user, setUser] = useState(null);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const session = formatFirebaseUser(firebaseUser);
        setUser(session);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        setUser(null);
        localStorage.removeItem(SESSION_KEY);
      }
    });

    return () => unsubscribe();
  }, []);

  function handleAuth(nextUser) {
    setUser(nextUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch {
      // Sign-out error handled by onAuthStateChanged listener clearing state
    }
    setUser(null);
    setSelectedFormId(null);
    setShowAuth(false);
    localStorage.removeItem(SESSION_KEY);
    showToast('info', 'Logged out of FormForge Console.');
  }

  return (
    <>
      <div className="background" aria-hidden="true">
        <span className="beam beam-one" />
        <span className="beam beam-two" />
        <span className="grid-glow" />
      </div>
      {!user ? (
        showAuth ? (
          <AuthPanel onAuth={handleAuth} showToast={showToast} onBack={() => setShowAuth(false)} />
        ) : (
          <LandingPage onLaunchConsole={() => setShowAuth(true)} />
        )
      ) : selectedFormId ? (
        <FormDetails user={user} formId={selectedFormId} onBack={() => setSelectedFormId(null)} showToast={showToast} />
      ) : (
        <Dashboard user={user} onLogout={logout} onSelectForm={setSelectedFormId} showToast={showToast} />
      )}
      <Toasts toasts={toasts} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
