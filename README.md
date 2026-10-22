# 🌾 PaDi Design Notion Database (Q4 2026)

A lightweight, super-fast Notion-like web app hosted on **Vercel** with **Supabase** (PostgreSQL) backend, built specifically for the [PaDi Design Notion Database](https://app.notion.com/p/3ec30a0f80918060b6ace35432418190?v=12a30a0f809183149a5808b855188683).

---

## ✨ Features

- **Exact Notion Database Structure**: Pre-loaded with all **32 tasks**, statuses, priorities, squads, assignees (Widy, Sigit, Banu, Frans, Dian), timeline dates, and direct links to Figma, PRD, Taiga, and Docs.
- **Multiple Notion Views**:
  - **Table View**: Compact, clean Notion-style grid with status badges, squad tags, assignees, dates, and quick link icons.
  - **Status Board (Kanban)**: Columns grouped by status (*Not started, In progress design, In PM review, In review, Need revision, On hold, Done*).
  - **Team Filter Tabs**: One-click filters matching Notion views (*Tasks Widy, Task Sigit, Task Banu, Task Frans, Task Dian*).
- **Fast Search & Multi-Filters**: Instant search by task name, WBS code, squad, or assignee.
- **Task Detail Drawer / Modal**: Click any row or card to inspect all properties, open external docs, edit fields, or delete.
- **Dual Mode (Instant Preview + Supabase)**: Runs instantly out-of-the-box using the local JSON cache. Once you plug in Supabase credentials, it automatically switches to live database persistence.
- **1-Command Notion Sync**: Includes a sync script (`npm run sync`) to re-sync data directly from Notion into Supabase anytime.

---

## 🚀 Quick Setup Guide

### 1. Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the left navigation, click on **SQL Editor**.
3. Run the schema script:
   - Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste it into the SQL Editor, then click **Run**.
4. Seed the database with the 32 tasks from Notion:
   - Copy the contents of [`supabase/seed.sql`](./supabase/seed.sql) and paste it into the SQL Editor, then click **Run**.
5. Get your API credentials:
   - Go to **Project Settings** -> **API**.
   - Copy the **Project URL** and the `anon` / `public` **API Key**.

---

### 2. Configure Local Environment

Create `.env.local` in the root folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional (for automated sync scripts):
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Run locally:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 3. Deploy to Vercel (Hosting)

1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Notion-like website for PaDi tasks"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `your-anon-key`
4. Click **Deploy**. Vercel will build and publish your lightweight Notion site in seconds with global edge acceleration!

---

### 4. Syncing Updates from Notion

If anyone updates tasks in Notion and you want to pull the latest changes into Supabase:
```bash
npm run sync
```
This fetches the Notion database records via API and upserts them into your Supabase `tasks` table.
