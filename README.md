# TrizenAI Photo Sharing Platform

A full-stack collaborative photo-sharing application built for the TrizenAI Full Stack Internship Challenge.

## Live Application

Deploy URL: https://trizenai.vercel.app (update after deployment)

**Demo Credentials**

| Role | Email | Password |
|---|---|---|
| Admin / Lead | admin@trizen-ai.com | AdminPass@2026 |
| Team Member | photographer@trizen-ai.com | TeamPass@2026 |

Demo Gallery URL and PIN are generated when Admin publishes a gallery from the Events page.

---

## Project Overview

TrizenAI Photo Platform enables photography teams to collaboratively manage event coverage:

1. **Admin** creates events, assigns photographers, curates photos, and publishes PIN-protected galleries.
2. **Team Members** log in, upload event photos, and review their own submissions.
3. **Customers** access published galleries via a shareable link + 6-digit PIN. No account needed.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password) |
| Database access | Supabase server client; Prisma schema/seed utilities |
| File Storage | Cloudinary |
| Styling | Vanilla CSS + custom design tokens |
| Deployment | Vercel |

---

## System Architecture

```mermaid
graph TD
    subgraph Clients
        Admin["Admin / Lead (Browser)"]
        Member["Team Member (Browser)"]
        Customer["Customer (Mobile / Web)"]
    end

    subgraph "Next.js 16 Application"
        AdminUI["/admin/* Dashboard & Management"]
        CustomerUI["/gallery/[slug] Client Viewer"]
        API["/api/* Route Handlers & RBAC Guard"]
    end

    subgraph "Cloud & Backend Infrastructure"
        SupabaseAuth["Supabase Auth (JWT / Sessions)"]
        SupabaseDB[("Supabase PostgreSQL DB\n(events, photos, galleries, users)")]
        Cloudinary["Cloudinary Object Storage & CDN"]
    end

    Admin -->|Manages Events, Curates, Publishes| AdminUI
    Member -->|Uploads Event Photos| AdminUI
    Customer -->|Accesses with 6-Digit PIN| CustomerUI

    AdminUI --> API
    CustomerUI --> API

    API -->|Authenticate & Enforce Roles| SupabaseAuth
    API -->|Store & Query Metadata| SupabaseDB
    AdminUI -->|Direct Signed Photo Upload| Cloudinary
    CustomerUI -->|Fetch & Display Optimized Assets| Cloudinary
```

### Browser Routes
- `/admin/login` - Supabase Auth, role lookup, redirect to dashboard or events
- `/admin/dashboard` - Admin only: live statistics, recent events overview
- `/admin/events` - Events list (filtered by role)
- `/admin/events/[id]/photos` - Upload photos, curate for gallery
- `/admin/team` - Admin only: provision and manage team members
- `/admin/galleries` - Admin only: view published galleries and links
- `/gallery/[slug]` - Public: PIN entry unlock & high-res photo viewer

### API Routes & RBAC
- `/api/events` - CRUD events (`POST` admin-only)
- `/api/events/[id]/photos` - Upload, curate, delete photos (Team members can delete own uploads only)
- `/api/events/[id]/gallery` - Publish gallery with SHA-256 PIN (`POST` admin-only)
- `/api/events/[id]/team` - Assign/unassign team members (`POST`/`DELETE` admin-only)
- `/api/team` - List/provision/delete users (`POST`/`DELETE` admin-only)
- `/api/galleries` - List galleries (`GET` admin-only)
- `/api/gallery/[id]/access` - Customer PIN verification (Public)
- `/api/upload` - Cloudinary file upload signature & processing

### Storage & External Services
- **Supabase (PostgreSQL + Auth)**: `auth.users`, `events`, `photos`, `galleries`, `gallery_photos`, `event_members`, `users`
- **Cloudinary**: Stores all uploaded photos, generates auto-optimized responsive thumbnails & full-resolution downloads

## Database Schema

- users: id, email, fullName, role (ADMIN|TEAM_MEMBER), avatarUrl
- events: id, title, description, date, location, coverImage, createdBy
- event_members: eventId, userId, role (project-scoped role: LEAD or TEAM_MEMBER)
- photos: id, eventId, uploadedBy, publicId, url, thumbnailUrl, filename, fileSize, isSelected
- galleries: id, eventId, slug, title, pinHash, isPublished, publishedAt, viewCount
- gallery_photos: galleryId, photoId, displayOrder

---

## Local Setup

### Prerequisites

- Node.js 18+
- Supabase project
- Cloudinary account

### Environment Variables

Create .env.local at the project root:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
GALLERY_PIN_ENCRYPTION_KEY=generate-a-long-random-server-secret

### Installation

    npm install
    npm run dev

Open http://localhost:3000 — Admin panel at http://localhost:3000/admin/login

### Database Setup

    npx prisma db push

---

## Deployment (Vercel)

1. Push to GitHub.
2. Import the repository in Vercel.
3. Add all environment variables.
4. Deploy.

---

## Security

- RBAC: All API routes enforce role-based access via requireRole() middleware
- Server-side RBAC: API routes verify the Supabase session and event membership before using the service-role client
- PIN Security: Gallery PIN hashes are stored for verification and the recoverable PIN is encrypted at rest
- No Secrets in Git: All credentials are environment variables

---

## Testing

    npm test

Tests cover role rules, gallery PIN verification, photo validation, and the customer gallery flow. Production verification should also include authenticated API integration tests against a test Supabase project.

---

## Known Limitations

- Team members must be provisioned by an Admin (no self-registration)
- Gallery expiration is not yet implemented (optional bonus feature)
- Email invitations are not sent - admin shares credentials manually after provisioning
- Existing galleries created before encrypted PIN storage may need their PIN rotated from the event page
- Apply the SQL in `supabase/migrations/202609090001_project_scoped_event_roles.sql` before using project-scoped lead/member assignments.

---

## Submission

Submitted to: talent@trizen-ai.com | Deadline: September 20, 2026
