# Quick Start Guide

Get the KESCO Dashboard running in 5 minutes!

## Prerequisites
- Node.js 16+
- Supabase account (free at supabase.com)
- Email address for test accounts

## 1. Clone & Install (1 min)

```bash
cd /Users/abhi/Desktop/kesco-dashboard
npm install
```

## 2. Supabase Setup (2 min)

Follow [SETUP.md](./SETUP.md) to:
- Create Supabase project
- Create `users` and `snapshots` tables
- Create `snapshots` storage bucket
- Create two test users (coordinator & administrator)
- Copy Project URL and API key

## 3. Configure Environment (30 sec)

```bash
cp .env.example .env
# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=your_project_url
# VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Run Locally (1 min)

```bash
npm run dev
```

Visit `http://localhost:5173` and login!

## 5. Deploy (when ready)

```bash
npm run build
# Deploy `dist` folder to Vercel, Netlify, or any static host
```

Your app is live!

---

## Login Credentials (from Setup)

- **Administrator**: admin@yourdomain.com / [your password]
- **Coordinator**: coordinator@yourdomain.com / [your password]

## What Each Role Can Do

### Coordinator ✍️
- Upload `.xlsx`, `.xls`, `.csv` files
- Delete uploaded files
- View all analytics
- Export as CSV/PNG/PDF
- Backup & Restore data
- Configure display settings

### Administrator 👁️
- View all analytics (read-only)
- Compare data between dates
- Search complaints
- Export data
- ❌ Cannot upload, modify, or delete data

## File Upload Format

The app expects these columns in your file:
- **COMPLAINT_NO** (required) - Unique complaint identifier
- **COMPLAINT_TYPE** (required) - Category of complaint
- **VERTICAL** (required) - Division/Department
- **AGING** (required) - One of: 0-24hrs, 24 hrs to 3 Days, 3 to 7 Days, 7 to 15 Days, 15 to 30 Days, 30 to 90 Days, 90+ Days
- **SUBSTATION** (recommended) - Substation/Location
- **SOURCE** (optional) - Channel through which complaint came
- Any other columns (PII like names, addresses can be excluded during upload)

## Real-Time Updates

When a Coordinator uploads data, an Administrator's dashboard updates **instantly** without refresh.

## Need Help?

- Check [README.md](./README.md) for full documentation
- Review [SETUP.md](./SETUP.md) for Firebase configuration
- Check browser console for error messages
- Ensure `.env` has correct Firebase credentials

---

**You're all set! 🚀**

Next: Upload your first data file as Coordinator and see it appear instantly in Administrator view.
