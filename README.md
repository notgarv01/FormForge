# FormForge

Headless form backend + React admin console.

## Architecture

- **Frontend** (React 19 + Vite) — hosted on **Vercel**
- **Backend** (Express + MongoDB + Nodemailer) — hosted on **Render**

The two are independent services. The frontend talks to the backend via CORS.

## Local Development

Two terminals:

```bash
# Terminal 1: backend
cd backend
cp .env.example .env   # then fill in real values
npm install
npm start              # http://localhost:8080

# Terminal 2: frontend
cd frontend-react
npm install
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api` and `/f` to `localhost:8080`, so no env var is needed locally.

## Production Deploy

### Frontend → Vercel

1. New Project → import `notgarv01/FormForge`
2. **Root Directory:** `frontend-react`
3. **Build Command:** `npm install && npm run build`
4. **Output Directory:** `dist`
5. **Environment Variable:** `VITE_API_BASE_URL` = your Render backend URL (e.g. `https://formforge-headless-backend.onrender.com`)
6. Deploy

`vercel.json` in repo root provides defaults for steps 2–5; you only need to set the env var (or override the URL in `vercel.json` first).

### Backend → Render

1. New Web Service → connect `notgarv01/FormForge`
2. **Build Command:** `npm run build`
3. **Start Command:** `npm start`
4. **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `MONGODB_URI` | your MongoDB Atlas connection string |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_SECURE` | `true` |
   | `SMTP_USER` | your Gmail address |
   | `SMTP_PASS` | your 16-digit Google App Password |
   | `SMTP_FROM` | `"FormForge System" <your_email@gmail.com>` |
   | `CORS_ORIGIN` | your Vercel frontend URL (no trailing slash) |

   `render.yaml` declares `NODE_ENV` automatically.

5. Deploy

## Note on Email

Render's free tier blocks outbound SMTP (ports 25, 465, 587). Emails will fail to send and fall back to `backend/mail.log`. To send real mail:
- Upgrade Render to a paid instance ($7/mo+), OR
- Switch to an HTTP email API (Resend, SendGrid) that doesn't use SMTP ports

## Submission Endpoint

Once a form is created in the dashboard, the public endpoint is:

```
POST https://<your-render-url>/f/<formId>
```

With a hidden honeypot field `_honey` and any number of arbitrary fields. CORS is open by default; lock it down with `CORS_ORIGIN` on Render.