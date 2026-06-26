import React, { useState } from 'react';
import {
  Code2,
  ShieldCheck,
  Mail,
  Download,
  Wrench,
  Inbox,
  Github,
  Linkedin,
  ExternalLink,
  Play,
  Check,
  Sparkles,
  Terminal,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage({ onLaunchConsole }) {
  // Live Simulator States
  const [simName, setSimName] = useState('Jane Doe');
  const [simEmail, setSimEmail] = useState('jane@example.com');
  const [simMessage, setSimMessage] = useState('Hello, this is a real-time submission demo!');
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('payload'); // 'payload' | 'response'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // HTML Code Snippet state
  const [copiedCode, setCopiedCode] = useState(false);

  const htmlSnippet = `<form action="https://formforge-backend.onrender.com/f/your-form-id" method="POST">
  <!-- Spambot Honeypot Field -->
  <input type="text" name="_honey" style="display:none" tabIndex="-1" autocomplete="off" />

  <label>Email Address</label>
  <input type="email" name="email" required />

  <label>Message</label>
  <textarea name="message" required></textarea>

  <button type="submit">Submit Form</button>
</form>`;

  const copyHTMLCode = () => {
    navigator.clipboard.writeText(htmlSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSimSubmit = (e) => {
    e.preventDefault();
    if (simSubmitting) return;

    setSimSubmitting(true);
    setActiveTab('payload');

    // Simulate network latency
    setTimeout(() => {
      setSimSubmitting(false);
      setSimSubmitted(true);
      setActiveTab('response');
      // Reset back after 5 seconds
      setTimeout(() => {
        setSimSubmitted(false);
        setActiveTab('payload');
      }, 6000);
    }, 1500);
  };

  return (
    <div className="landing-layout">
      {/* Navigation Header */}
      <nav className="landing-nav glass">
        <div className="nav-container">
          <div className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="logo-icon"><Wrench size={16} /></span>
            <span className="logo-text">FormForge</span>
          </div>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#docs">HTML Snippet</a>
            <a href="#creator">Creator</a>
          </div>

          <button className="btn btn-primary nav-cta" onClick={onLaunchConsole}>
            Launch Console <ArrowRight size={14} />
          </button>

          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#docs" onClick={() => setMobileMenuOpen(false)}>HTML Snippet</a>
            <a href="#creator" onClick={() => setMobileMenuOpen(false)}>Creator</a>
            <button className="btn btn-primary nav-cta" onClick={() => { setMobileMenuOpen(false); onLaunchConsole(); }}>
              Launch Console <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="badge-wrapper">
            <span className="hero-badge">
              <Sparkles size={12} className="text-accent" /> Introducing FormForge 1.0
            </span>
          </div>
          <h1>
            Connect Your Forms.<br />
            Collect Submissions.<br />
            <span className="text-gradient">Zero Backend Code.</span>
          </h1>
          <p className="hero-description">
            The premium headless form backend engineered for developers. Drop our action endpoint into any HTML form, and instantly receive submissions, block spam bots, and forward email alerts. 
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={onLaunchConsole}>
              Get Started Free <Play size={14} fill="currentColor" />
            </button>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              Learn More
            </a>
          </div>
        </div>

        {/* Live Simulator Showcase */}
        <div className="hero-showcase">
          <div className="simulator-container glass">
            <div className="simulator-header">
              <div className="dot red"></div>
              <div className="dot yellow"></div>
              <div className="dot green"></div>
              <span className="window-title">FormForge Live Sandbox Simulator</span>
            </div>

            <div className="simulator-body">
              {/* Form Input Side */}
              <div className="simulator-form-side">
                <h4>Static HTML Form View</h4>
                <form onSubmit={handleSimSubmit} className="stacked-form">
                  <div className="form-field">
                    <span>Full Name</span>
                    <input
                      type="text"
                      className="input"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      placeholder="Jane Doe"
                      disabled={simSubmitting || simSubmitted}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <span>Email Address</span>
                    <input
                      type="email"
                      className="input"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      placeholder="jane@example.com"
                      disabled={simSubmitting || simSubmitted}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <span>Message</span>
                    <textarea
                      className="input"
                      rows="3"
                      value={simMessage}
                      onChange={(e) => setSimMessage(e.target.value)}
                      placeholder="Your message..."
                      disabled={simSubmitting || simSubmitted}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={simSubmitting || simSubmitted}
                  >
                    {simSubmitting ? (
                      'POSTing data...'
                    ) : simSubmitted ? (
                      <span className="flex-center gap-1"><Check size={16} /> Submission Sent!</span>
                    ) : (
                      'Test Submission'
                    )}
                  </button>
                </form>
              </div>

              {/* JSON Live Terminal Side */}
              <div className="simulator-terminal-side">
                <div className="terminal-tabs">
                  <button
                    className={`terminal-tab ${activeTab === 'payload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payload')}
                  >
                    <Terminal size={12} /> HTTP Request Payload
                  </button>
                  <button
                    className={`terminal-tab ${activeTab === 'response' ? 'active' : ''}`}
                    onClick={() => setActiveTab('response')}
                  >
                    <Inbox size={12} /> Server Response
                  </button>
                </div>

                <div className="terminal-content">
                  {activeTab === 'payload' ? (
                    <pre className="code-block">
                      <span className="text-muted">// Outgoing HTTP POST request</span>
                      <br />
                      <span className="text-accent">POST</span> /f/demo-endpoint-id HTTP/1.1
                      <br />
                      <span className="text-soft">Host:</span> formforge.onrender.com
                      <br />
                      <span className="text-soft">Content-Type:</span> application/json
                      <br />
                      <br />
                      {JSON.stringify(
                        {
                          name: simName,
                          email: simEmail,
                          message: simMessage,
                          _honey: ''
                        },
                        null,
                        2
                      )}
                    </pre>
                  ) : (
                    <pre className="code-block">
                      <span className="text-muted">// HTTP Response status</span>
                      <br />
                      HTTP/1.1 <span className="text-success">200 OK</span>
                      <br />
                      <span className="text-soft">Content-Type:</span> application/json
                      <br />
                      <br />
                      {JSON.stringify(
                        {
                          success: true,
                          message: 'Submission successfully received and logged.',
                          data: {
                            id: 'sub_demo_' + Math.random().toString(36).substring(2, 8),
                            createdAt: new Date().toISOString(),
                            payload: {
                              name: simName,
                              email: simEmail,
                              message: simMessage
                            }
                          },
                          spamGuard: {
                            triggered: false,
                            reason: 'Honeypot clean'
                          },
                          emailAlerts: {
                            sent: true,
                            recipient: 'alerts@yourdomain.com'
                          }
                        },
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Core Features Grid */}
      <section id="features" className="section-container">
        <div className="section-header-center">
          <h2>Supercharged Form Endpoints</h2>
          <p className="section-subtitle">
            All the features required to collect, manage, and process submissions cleanly.
          </p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card glass">
            <span className="feature-icon bg-cyan"><ShieldCheck size={20} /></span>
            <h3>Spam Bot Guard</h3>
            <p>
              Integrated Honeypot check filters out robotic submission bots silently without annoying your human visitors with CAPTCHAs.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card glass">
            <span className="feature-icon bg-violet"><Mail size={20} /></span>
            <h3>Instant Email Alerts</h3>
            <p>
              Receive form submissions inside your developer mailbox. Configurable forwarding email alerts notify you when new logs arrive.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card glass">
            <span className="feature-icon bg-green"><Download size={20} /></span>
            <h3>Data Export Console</h3>
            <p>
              Export all accumulated submission entries to CSV or JSON formats at any time. Ideal for importing data into analysis tools.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card glass">
            <span className="feature-icon bg-amber"><Wrench size={20} /></span>
            <h3>Custom Redirects</h3>
            <p>
              Send form submitters to your custom thank-you or confirmation page. If none is set, we provide a beautiful default success layout.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="feature-card glass">
            <span className="feature-icon bg-emerald"><Inbox size={20} /></span>
            <h3>Submission Console</h3>
            <p>
              Track and delete submissions in a unified dashboard. Supports column auto-detection based on the submitted form fields.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="feature-card glass">
            <span className="feature-icon bg-pink"><Code2 size={20} /></span>
            <h3>Fully Framework Agnostic</h3>
            <p>
              Works with standard HTML forms on Webflow, Framer, static HTML files, React apps, Vue apps, or any environment.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works / Integration Section */}
      <section id="how-it-works" className="section-container how-it-works-section">
        <div className="section-header-center">
          <h2>Setup in 3 Simple Steps</h2>
          <p className="section-subtitle">
            Integrate FormForge in minutes. No complex configuration or servers needed.
          </p>
        </div>

        <div className="steps-flow">
          <div className="step-item">
            <div className="step-number">1</div>
            <h4>Generate Endpoint</h4>
            <p>Create a FormForge account and set up a new form workspace to generate your unique endpoint ID.</p>
          </div>
          <div className="step-arrow"><ArrowRight size={24} className="arrow-icon" /></div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h4>Paste HTML Block</h4>
            <p>Set your form's <code>action</code> URL to your unique endpoint and insert fields with matching names.</p>
          </div>
          <div className="step-arrow"><ArrowRight size={24} className="arrow-icon" /></div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h4>Collect Entries</h4>
            <p>Watch incoming submissions get logged in real time. Get notified by email and download logs in CSV or JSON.</p>
          </div>
        </div>

        {/* Live Code Snippet Display */}
        <div id="docs" className="glass code-sandbox-container">
          <div className="sandbox-header">
            <div className="flex-center gap-2">
              <Code2 size={16} className="text-accent" />
              <span>Standard HTML Integration Block</span>
            </div>
            <button className="btn btn-secondary btn-compact" onClick={copyHTMLCode}>
              {copiedCode ? <span className="text-success flex-center gap-1"><Check size={14} /> Copied!</span> : 'Copy Snippet'}
            </button>
          </div>
          <div className="sandbox-code">
            <pre><code>{htmlSnippet}</code></pre>
          </div>
        </div>
      </section>

      {/* Creator Spotlight Section */}
      <section id="creator" className="section-container creator-section">
        <div className="glass creator-card">
          <div className="creator-glow"></div>
          <div className="creator-details">
            <div className="creator-avatar-placeholder">GG</div>
            <div className="creator-info">
              <span className="creator-badge">Project Creator & Maintainer</span>
              <h3>Garv Gupta</h3>
              <p className="creator-bio">
                Garv Gupta built FormForge to help developers streamline form management on static websites. By eliminating the necessity of spinning up databases, SMTP clients, and anti-spam systems for every simple website, FormForge provides an instant headless solution.
              </p>
              <div className="creator-socials">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-compact">
                  <Github size={14} /> GitHub <ExternalLink size={10} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-compact">
                  <Linkedin size={14} /> LinkedIn <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="landing-logo">
              <span className="logo-icon"><Wrench size={12} /></span>
              <span className="logo-text">FormForge</span>
            </div>
            <p>The developer's headless form engine.</p>
          </div>
          <div className="footer-links">
            <span className="copyright">© 2026 FormForge. Created by Garv Gupta. All rights reserved.</span>
            <div className="tech-badges">
              <span className="tech-badge">React</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">Firebase</span>
              <span className="tech-badge">MongoDB</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
