# 🚀 TrizenAI API — Postman Testing Guide

This directory contains the ready-to-import **Postman Collection** and **Environment Files** covering all 11 API endpoints of TrizenAI.

---

## 📂 Included Files

1. `TrizenAI_API.postman_collection.json` — All 11 API endpoints organized in logical folders with pre-configured headers, JSON request payloads, and test scripts.
2. `TrizenAI_Local.postman_environment.json` — Environment config pointing to `http://localhost:3000`.
3. `TrizenAI_Production.postman_environment.json` — Environment config pointing to production URL.

---

## ⚡ Quick Start: How to Import into Postman

### Step 1: Import Files
1. Open **Postman** (Desktop App or Web).
2. Click the **Import** button in the top left.
3. Drag and drop both:
   - `TrizenAI_API.postman_collection.json`
   - `TrizenAI_Local.postman_environment.json`
4. In the top right environment dropdown, select **TrizenAI - Local Environment**.

---

### Step 2: Set Your Supabase Credentials & Authenticate

1. In Postman, open the environment variables (`TrizenAI - Local Environment`) or edit collection variables.
2. Set:
   - `supabase_url`: `https://<YOUR_SUPABASE_PROJECT>.supabase.co`
   - `supabase_anon_key`: `<YOUR_NEXT_PUBLIC_SUPABASE_ANON_KEY>`
   - `admin_email`: Your Admin email (e.g., `admin@example.com`)
   - `admin_password`: Your Admin password
3. Run the first request:
   - `0. Authentication & Tokens` ➔ **`Supabase Login (Get Bearer Token)`**
4. Click **Send**.
   - ✨ *The test script will automatically extract the `access_token` and save it to `{{auth_token}}`.*
   - All other requests in the collection inherit this Bearer token automatically!

---

## 📋 Endpoints Covered in the Collection

### `0. Authentication & Tokens`
- `POST {{supabase_url}}/auth/v1/token?grant_type=password` — Direct Supabase sign-in, auto-saves `auth_token`.
- `POST /api/auth/register` — Creates a user account directly in Supabase Auth & PostgreSQL `public.users`.
- `POST /api/auth/sync` — Synchronizes authenticated OAuth/Supabase user into `public.users`.

### `1. Team Management` (Admin Only)
- `GET /api/team` — List all photographers and team members with photo counts and assigned event stats.
- `POST /api/team` — Add new team member or update existing account (generates secure temporary password). Auto-saves `target_user_id`.
- `DELETE /api/team?userId={{target_user_id}}` — Delete a team member and cleanup event assignments.

### `2. Events Management`
- `GET /api/events` — List events (Admins see all; Team members see assigned events).
- `POST /api/events` — Create a new event. Auto-saves `event_id`.
- `GET /api/events/{{event_id}}` — Get full event details, uploaded photos, and gallery status.
- `PATCH /api/events/{{event_id}}` — Update event details (title, location, date, cover).
- `DELETE /api/events/{{event_id}}` — Delete event and cascade delete all photos, members, and galleries.

### `3. Event Team Assignments`
- `GET /api/events/{{event_id}}/team` — List all members and their assignment status for the event.
- `POST /api/events/{{event_id}}/team` — Assign photographer / team member to the event.
- `DELETE /api/events/{{event_id}}/team?userId={{target_user_id}}` — Unassign user from event.

### `4. Photos & Curation`
- `GET /api/events/{{event_id}}/photos` — List all event photos.
- `GET /api/events/{{event_id}}/photos?selected=true` — List only curated/selected photos.
- `POST /api/events/{{event_id}}/photos` — Save photo metadata (Cloudinary publicId, secureUrl, dimensions, tags). Auto-saves `photo_id`.
- `PATCH /api/events/{{event_id}}/photos` — Curate/select specific photos or toggle `selectAll: true` / `deselectAll: true`.
- `DELETE /api/events/{{event_id}}/photos` — Delete photos from event and trigger Cloudinary cleanup.

### `5. Customer Galleries & PIN Access`
- `GET /api/galleries` — List all customer galleries for admin dashboard.
- `GET /api/events/{{event_id}}/gallery` — Get gallery configuration and decrypted PIN (Admin only).
- `POST /api/events/{{event_id}}/gallery` — Publish or update customer gallery with 4-6 digit PIN. Auto-saves `gallery_slug`.
- `POST /api/gallery/{{gallery_slug}}/access` — **Public Client Endpoint**: Customer unlocks curated photos by entering PIN.

### `6. Direct Media Upload`
- `POST /api/upload` — Direct multipart/form-data upload of photo buffer to Cloudinary storage.

---

## 🧪 Automated Testing via Postman Runner or Newman (CLI)

You can run the entire collection automatically using **Postman Collection Runner** or **Newman CLI**:

```bash
# Run with npx newman
npx newman run postman/TrizenAI_API.postman_collection.json -e postman/TrizenAI_Local.postman_environment.json
```
