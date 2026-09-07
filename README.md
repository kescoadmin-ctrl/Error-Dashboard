# KESCO Error Dashboard - Multi-Role Supabase Version

A modern, role-based web application for tracking and managing electricity complaints. Built with React + Vite + Supabase.

## Features

- **Two-Role System**: Administrator (read-only) and Coordinator (read/write)
- **Real-Time Sync**: Live updates when coordinators upload or modify data
- **Data Upload**: Support for `.xlsx`, `.xls`, and `.csv` files
- **Rich Analytics**: 5 different chart types showing complaint data
- **Comparison Tools**: Track changes between two dates
- **Export Options**: CSV, PNG, and PDF exports
- **Data Backup/Restore**: Export and import JSON backups
- **Dark Mode**: Switchable light/dark theme
- **Responsive Design**: Government-style themed UI with Indian tricolour band

## Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Charts**: Chart.js + chartjs-plugin-datalabels
- **File Processing**: SheetJS (xlsx)
- **Export**: html2canvas + jsPDF
- **Styling**: CSS Variables for theming

## Prerequisites

- Node.js 16+ and npm
- Supabase Account (free tier available at supabase.com)

## Supabase Project Setup

For detailed setup instructions, see [SETUP.md](./SETUP.md)

### Quick Steps

1. Create project at [supabase.com](https://supabase.com)
2. Create `users` and `snapshots` tables (see SETUP.md for SQL)
3. Create `snapshots` storage bucket
4. Get Project URL and Anon Key from **Settings** → **API**
5. Create users via **Authentication** → **Users**
6. Add user profiles to `users` table

### Get Environment Variables

1. Go to **Settings** → **API** in your Supabase project
2. Copy **Project URL** and **anon public** key
3. Create `.env` file (see below)

## Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd kesco-dashboard
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Create First Users

In Supabase Console:

**For Administrator:**
1. Go to **Authentication** → **Users** → **Invite**
2. Email: `admin@example.com`
3. Once user confirms, run in SQL Editor:
   ```sql
   insert into public.users (id, email, role)
   select id, email, 'administrator'
   from auth.users
   where email = 'admin@example.com';
   ```

**For Coordinator:**
1. Invite user with email: `coordinator@example.com`
2. Run in SQL Editor:
   ```sql
   insert into public.users (id, email, role)
   select id, email, 'coordinator'
   from auth.users
   where email = 'coordinator@example.com';
   ```

### 4. Run Locally

```bash
npm run dev
```

The app opens at `http://localhost:5173`

### 5. Login

- Choose role (Administrator or Coordinator)
- Use the credentials you created (email will have received confirmation link)

## Deployment

Deploy to Vercel, Netlify, or any static host:

### 1. Build

```bash
npm run build
```

### 2. Set Environment Variables

In your hosting platform, add:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 3. Deploy

Deploy the `dist` folder to your hosting platform.

**Vercel Example:**
```bash
npm install -g vercel
vercel
```

**Netlify Example:**
- Connect GitHub repo
- Set Build: `npm run build`
- Set Publish: `dist`
- Add environment variables in Netlify dashboard

## Data Model

### Database Structure (PostgreSQL)

**users table:**
```
id (UUID)          → Links to Supabase Auth
email (TEXT)       → User's email
role (TEXT)        → 'administrator' or 'coordinator'
settings (JSONB)   → User settings { topN: 10, ... }
created_at         → Account creation timestamp
updated_at         → Last update timestamp
```

**snapshots table:**
```
id (BIGINT)              → Primary key
user_id (UUID)           → Owner of snapshot
date_str (TEXT)          → Date identifier (YYYY-MM-DD)
filename (TEXT)          → Original file name
timestamp (TEXT)         → Upload timestamp
selected_columns (TEXT[])→ Selected columns from file
has_source (BOOLEAN)     → Whether SOURCE column exists
flagged (JSONB[])        → Array of flagged records
record_count (INTEGER)   → Number of records
flag_count (INTEGER)     → Number of flagged items
created_at               → Creation timestamp
updated_at               → Last modification timestamp
```

### Storage Structure

```
snapshots/
└─ {user_id}/
    └─ snapshots/
        └─ {date_str}/
            └─ records.json  (full records + flagged rows)
```

**Why this design?**

- PostgreSQL text fields can exceed Firestore's 1 MiB limit
- Metadata stays in database for instant queries and real-time listeners
- Full records stored in Storage as JSON blobs
- Administrators see metadata in real-time and fetch records on-demand

## Security

- **Authentication**: Email/password via Supabase Auth
- **Row Level Security (RLS)**: 
  - Users can only access their own data
  - Coordinators can write to snapshots; administrators cannot (read-only)
  - Enforced at the database level with PostgreSQL policies
- **Storage Policies**:
  - Coordinators can upload/update/delete their own snapshot files
  - Administrators can only download coordinator snapshots
  - Files are private (not publicly accessible)

## Features by Role

### Coordinator Access
- ✅ Dashboard (view all analytics)
- ✅ Flagged Rows
- ✅ Trend & History
- ✅ **Upload Data** (drag-drop, column picker, validation)
- ✅ Uploaded Data Files (with **Delete** button)
- ✅ Compare Two Dates
- ✅ Errors & Conflicts
- ✅ Search Complaint No.
- ✅ Download Output (CSV/PNG/PDF)
- ✅ **Backup/Restore** (Export & Import JSON)
- ✅ **Display Settings** (Top-N, **Wipe All Data**)

### Administrator Access
- ✅ Dashboard (view all analytics, read-only)
- ✅ Flagged Rows (read-only)
- ✅ Trend & History (read-only)
- ✅ Uploaded Data Files (read-only, no delete)
- ✅ Compare Two Dates (read-only)
- ✅ Errors & Conflicts (read-only)
- ✅ Search Complaint No. (read-only)
- ✅ Download Output (read-only)
- ❌ Upload Data (hidden)
- ❌ Backup/Restore (hidden)
- ❌ Display Settings (hidden)

## Real-Time Updates

When a Coordinator uploads or modifies data, an Administrator's dashboard updates using Supabase real-time subscriptions. Changes appear instantly without manual refresh.

## Troubleshooting

### "User profile not found"
- Ensure the user exists in Supabase `auth.users` table
- Ensure a record exists in `public.users` table with the user's ID
- Role must be exactly `"administrator"` or `"coordinator"` (case-sensitive)

### Charts not rendering
- Ensure Chart.js CDN in `index.html` is accessible
- Check browser console for errors

### File upload fails
- Check Supabase storage bucket `snapshots` exists and is private
- Verify storage policies are created
- Check user has appropriate permissions

### Login fails or redirects
- Verify `.env` variables are correct (SUPABASE_URL and SUPABASE_ANON_KEY)
- Check email confirmation is complete (if required)
- Check Firebase project authentication is enabled
- Ensure user exists in Firebase Auth

## File Structure

```
kesco-dashboard/
├─ src/
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ Sidebar.jsx
│  │  └─ PrivateRoute.jsx
│  ├─ pages/
│  │  ├─ RoleSelector.jsx
│  │  ├─ LoginPage.jsx
│  │  ├─ CoordinatorLayout.jsx
│  │  ├─ AdminLayout.jsx
│  │  └─ sections/
│  │      ├─ Dashboard.jsx
│  │      ├─ Flagged.jsx
│  │      ├─ Trend.jsx
│  │      ├─ Upload.jsx
│  │      ├─ Snapshots.jsx
│  │      ├─ SnapshotsReadOnly.jsx
│  │      ├─ Compare.jsx
│  │      ├─ Errors.jsx
│  │      ├─ Search.jsx
│  │      ├─ Download.jsx
│  │      ├─ Backup.jsx
│  │      └─ Settings.jsx
│  ├─ utils/
│  │  ├─ db.js (Firestore operations)
│  │  └─ export.js (Charts & exports)
│  ├─ firebase.js
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ index.css
├─ public/
├─ index.html
├─ vite.config.js
├─ firebase.json
├─ firestore.rules
├─ firestore.indexes.json
├─ storage.rules
├─ .env.example
├─ .gitignore
├─ package.json
└─ README.md
```

## Styling

The app uses CSS Variables for theming. Light and dark modes are supported:

```css
:root {
  --navy: #0B3866;
  --saffron: #FF9933;
  --green: #138808;
  --bg-color: #F4F6F8;
  /* ... more variables */
}

[data-theme="dark"] {
  --bg-color: #121212;
  /* ... dark mode colors */
}
```

Toggle theme in the header controls.

## Performance Considerations

- Lazy-load charts only when section is active
- Use Firestore indexes for efficient queries
- Paginate large tables if needed (future enhancement)
- Cache snapshot metadata locally (optional)

## Future Enhancements

- [ ] Multi-user coordinator accounts
- [ ] Notification system for updates
- [ ] Audit logs
- [ ] Bulk operations (delete multiple files)
- [ ] Advanced filtering and search
- [ ] Data validation rules customization
- [ ] API for external integrations

## Support & Maintenance

- Review Firebase usage and costs monthly
- Monitor Firestore quota and upgrade if needed
- Keep dependencies updated (`npm audit`, `npm update`)
- Test changes in local dev before deploying

## License

Internal use only - KESCO Project.

---

**For questions or issues, contact the development team or your system administrator.**
