import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';
import { queue } from './queue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Simple In-Memory Rate Limiter Middleware ---
const ipRequests = new Map();
const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  
  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, []);
  }
  
  const requests = ipRequests.get(ip).filter(timestamp => now - timestamp < 60000);
  
  if (requests.length >= 50) {
    return res.status(429).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>FormForge — Limit Reached</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background: #0b071e; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
          .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(20px); max-width: 420px; }
          h2 { color: #fca5a5; margin-top: 0; }
          p { color: rgba(255,255,255,0.6); line-height: 1.6; }
          .btn { background: linear-gradient(135deg, #8b5cf6, #3b82f6); border: none; padding: 12px 24px; color: #fff; border-radius: 8px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Rate Limit Exceeded</h2>
          <p>Too many requests sent from your IP address. Please wait a minute before submitting again.</p>
          <a href="javascript:history.back()" class="btn">Go Back</a>
        </div>
      </body>
      </html>
    `);
  }
  
  requests.push(now);
  ipRequests.set(ip, requests);
  next();
};

// --- PUBLIC ROUTER: Incoming Form Subsubmissions ---
app.post('/f/:formId', rateLimiter, async (req, res) => {
  const { formId } = req.params;
  const payload = { ...req.body };
  
  // 1. Spambot Honeypot Detection Check
  if (payload._honey && payload._honey.trim() !== '') {
    console.warn(`[Spam Guard] Honeybot detection triggered for form ID: ${formId}. Dropping submission silently.`);
    // Return standard success response to confuse the spam bot without saving it
    return renderSuccessResponse(res, null, 'https://formforge.com');
  }

  try {
    const form = await db.getForm(formId);
    if (!form) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>FormForge — Form Not Found</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background: #0b071e; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
            .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(20px); }
            h2 { color: #ef4444; margin-top: 0; }
            p { color: rgba(255,255,255,0.6); }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Error 404: Form Not Found</h2>
            <p>The form endpoint you are trying to hit does not exist or has been deleted.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Sanitize payload (strip honey fields)
    delete payload._honey;

    // 2. Add submission to DB
    const submission = await db.addSubmission(formId, payload);

    // 3. Queue email notifications Alert Job in background
    queue.addJob(form, submission);

    // 4. Handles Redirect logic
    if (form.customRedirect && form.customRedirect.trim() !== '') {
      return res.redirect(form.customRedirect);
    }

    // Default Success Screen
    return renderSuccessResponse(res, form, req.get('referrer'));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper to render beautiful thank-you page
function renderSuccessResponse(res, form, referrer) {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Submission Received — FormForge</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #090514, #12092b, #1b0a3a); color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .bg-orbs { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
        .orb1 { width: 300px; height: 300px; background: #7c3aed; top: -100px; left: -100px; }
        .orb2 { width: 250px; height: 250px; background: #2563eb; bottom: -50px; right: -50px; }
        .card { position: relative; z-index: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); padding: 40px; border-radius: 20px; text-align: center; backdrop-filter: blur(20px); max-width: 480px; width: 90%; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.37); }
        .checkmark { width: 64px; height: 64px; border-radius: 50%; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; color: #10b981; font-size: 28px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
        h2 { font-size: 24px; font-weight: 700; margin-bottom: 10px; }
        p { color: rgba(255, 255, 255, 0.6); line-height: 1.6; margin-bottom: 25px; font-size: 14.5px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5); }
      </style>
    </head>
    <body>
      <div class="bg-orbs">
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>
      </div>
      <div class="card">
        <div class="checkmark">✓</div>
        <h2>Submission Sent!</h2>
        <p>Thank you. Your submission for form <strong>"${form ? form.name : 'Platform Link'}"</strong> was securely stored and forwarded to the administrator.</p>
        <a href="${referrer || 'javascript:history.back()'}" class="btn">Return to Website</a>
      </div>
    </body>
    </html>
  `);
}

// --- DEVELOPER API ROUTERS ---

// 1. Authenticate Developer APIs
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }
  try {
    const user = await db.createUser(email, password);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }
  try {
    const user = await db.authenticateUser(email, password);
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// 2. Forms Dashboard CRUD APIs
app.post('/api/forms', async (req, res) => {
  const { userId, name, customRedirect, notifyEmail } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: 'User ID and form name are required.' });
  }
  try {
    const newForm = await db.createForm(userId, name, customRedirect, notifyEmail);
    res.status(201).json(newForm);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/forms', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }
  try {
    const forms = await db.getForms(userId);
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/forms/:formId', async (req, res) => {
  const { formId } = req.params;
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }
  try {
    const deleted = await db.deleteForm(userId, formId);
    if (deleted) {
      res.json({ success: true, message: 'Form deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Form not found or unauthorized.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/forms/:formId', async (req, res) => {
  const { formId } = req.params;
  const { userId } = req.query;
  const { customRedirect, notifyEmail } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }
  try {
    const updated = await db.updateForm(userId, formId, customRedirect, notifyEmail);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Submissions API
app.get('/api/forms/:formId/submissions', async (req, res) => {
  const { formId } = req.params;
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }
  
  try {
    // Verify access authorization
    const form = await db.getForm(formId);
    if (!form || form.userId !== userId) {
      return res.status(403).json({ error: 'Access unauthorized.' });
    }

    const submissions = await db.getSubmissions(formId);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve React frontend assets
const frontendPath = path.join(__dirname, '../frontend-react/dist');
app.use(express.static(frontendPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/f/')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start backend
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` FormForge (Headless Backend) server running on port: ${PORT}`);
  console.log(` Developer Admin Panel: http://localhost:${PORT}`);
  console.log(`==================================================`);

  // Non-fatal startup healthchecks so demo failures are obvious in console
  queue.transporter.verify()
    .then(() => console.log('[SMTP] Connection verified — real mail will send.'))
    .catch((err) => console.warn('[SMTP] Verify failed (mail will NOT send):', err.message));
});
