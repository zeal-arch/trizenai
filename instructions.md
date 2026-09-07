================================================================================
TRIZENAI PHOTO SHARING PLATFORM - LOCAL SETUP & USAGE INSTRUCTIONS
================================================================================

Project: Full-Stack Collaborative Photo Sharing & Proofing Application
Challenge: TrizenAI Full-Stack Internship Challenge
Framework: Next.js 16 (React 19) + Supabase (PostgreSQL) + Cloudinary Storage


--------------------------------------------------------------------------------
TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. Quick Start / Running Locally
2. Demo Login Credentials
3. Step-by-Step User Workflows
   - Workflow A: Team Admin (Event Creation, Assignment, Curation & Publishing)
   - Workflow B: Team Member (Viewing Assigned Events & Uploading Photos)
   - Workflow C: Customer / Client (PIN-Protected Gallery Access)
4. Environment Variables Configuration (.env.local)
5. Available Terminal Commands
6. Automated Tests Execution
7. System Architecture & Permissions Matrix
8. Troubleshooting & Common Questions


================================================================================
1. QUICK START / RUNNING LOCALLY
================================================================================

PREREQUISITES:
- Node.js 18.x or higher installed on your computer
- npm (installed automatically with Node.js)

STEP 1: Install Dependencies
Open your terminal in the project folder and run:
   npm install

STEP 2: Configure Environment Variables
Ensure the `.env.local` file exists in the root folder with valid credentials
for Supabase and Cloudinary (see Section 4 below).

STEP 3: Start Development Server
Run the following command in your terminal:
   npm run dev

STEP 4: Open in Your Browser
Visit the following local URLs:
- Main Landing Page:  http://localhost:3000
- Admin / Staff Portal: http://localhost:3000/admin/login
- Customer Gallery Demo: http://localhost:3000/gallery/gala-2026


================================================================================
2. DEMO LOGIN CREDENTIALS
================================================================================

The database includes ready-to-use seed accounts:

[1] TEAM ADMIN (Full Access)
--------------------------------------------------------------------------------
Email:     admin@trizen-ai.com
Password:  AdminPass@2026
Role:      ADMIN
Access:    Create events, assign team members, curate all photos, publish
           galleries, generate shareable links, set PINs.

[2] TEAM MEMBER (Photographer)
--------------------------------------------------------------------------------
Email:     member@trizen-ai.com
Password:  MemberPass@2026
Role:      TEAM_MEMBER
Access:    View assigned events, upload photos, view own uploads.
           (Forbidden from publishing galleries or managing other users' photos).

[3] CUSTOMER / CLIENT (No Account Required)
--------------------------------------------------------------------------------
Gallery URL: http://localhost:3000/gallery/gala-2026
Access PIN:  489210  (or 123456)
Access:      Enter PIN, view curated event photos, browse in lightbox, download.


================================================================================
3. STEP-BY-STEP USER WORKFLOWS
================================================================================

--------------------------------------------------------------------------------
WORKFLOW A: TEAM ADMIN (Full Event Lifecycle)
--------------------------------------------------------------------------------
1. Login:
   - Go to http://localhost:3000/admin/login
   - Click the "Team Admin" toggle button (pre-fills admin credentials)
   - Click "Sign In" -> Redirects to Admin Dashboard.

2. Create a New Event:
   - Click "Events" in the sidebar, then click "+ Create Event".
   - Enter Event Title (e.g. "Arjun & Priya Wedding"), Date, Venue Location,
     and optional photographer notes.
   - Click "Create Event".

3. Assign Team Members / Photographers to the Event:
   - On the Events page, locate your event card.
   - Click the "Team" icon button (or open the event and click "Event Team").
   - You will see the list of registered team members.
   - Click "Assign to Event" next to any member (e.g. member@trizen-ai.com).
   - The member is immediately assigned to the event.

4. Review & Curate Uploaded Photos:
   - On the Events page, click "Manage Photos" on the event card.
   - You can see all photos uploaded by yourself and assigned team members.
   - Click the checkmark checkbox on top-left of any photo to select/curate
     it for the customer gallery.

5. Publish Gallery & Set PIN:
   - Click the "Publish Gallery" button in the top right.
   - Enter a Gallery Title, custom URL Slug (e.g. "arjun-priya-wedding"),
     and a 6-digit access PIN (e.g. "482917").
   - Click "Confirm & Publish Gallery".
   - Copy the shareable link and PIN to send to the client.


--------------------------------------------------------------------------------
WORKFLOW B: TEAM MEMBER / PHOTOGRAPHER
--------------------------------------------------------------------------------
1. Login:
   - Go to http://localhost:3000/admin/login
   - Click the "Team Member" toggle button (pre-fills member credentials)
   - Click "Sign In" -> Redirects directly to "Assigned Events".

2. View Assigned Events:
   - The team member only sees events they have been assigned to by an admin.
   - Admin-only navigation menus (Dashboard metrics, Create Event, Customer
     Galleries, Team Management) are automatically hidden.

3. Upload Photos to Assigned Event:
   - Click "Upload & View Photos" on the assigned event card.
   - Click "Upload Photos" button.
   - Drag and drop or browse high-resolution JPEG/PNG/WebP photos.
   - Click "Start Upload" -> Photos are securely uploaded to Cloudinary CDN
     and registered in the database with the member's user ID.

4. Review Personal Uploads:
   - On the photo workspace, click the "My Uploads" tab to filter and see
     only the photos uploaded by the logged-in team member.
   - Team members can delete their own uploaded photos if needed, but cannot
     delete other photographers' photos or publish galleries.


--------------------------------------------------------------------------------
WORKFLOW C: CUSTOMER / CLIENT (Public Access)
--------------------------------------------------------------------------------
1. Open the Shareable Link:
   - The customer receives a link (e.g. http://localhost:3000/gallery/gala-2026).
   - No registration or login is required.

2. Enter Security PIN:
   - A PIN prompt appears with an interactive 6-digit PIN pad.
   - Enter the 6-digit PIN provided by the photographer (e.g. 489210).
   - An incorrect PIN triggers a shake animation and error message.

3. Browse Published Gallery:
   - Once verified, the customer gains instant access to all curated photos.
   - Customers can click any photo to open full-screen lightbox view or
     download high-resolution originals.


================================================================================
4. ENVIRONMENT VARIABLES CONFIGURATION (.env.local)
================================================================================

The `.env.local` file in your root folder contains the required connection keys:

--------------------------------------------------------------------------------
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Database Connections (Direct & Pooled)
DATABASE_URL=postgresql://postgres:<password>@db.<project-id>.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:<password>@db.<project-id>.supabase.co:5432/postgres

# Cloudinary Cloud Storage Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
--------------------------------------------------------------------------------


================================================================================
5. AVAILABLE TERMINAL COMMANDS
================================================================================

- npm run dev
  Starts the local Next.js development server at http://localhost:3000.

- npm run build
  Compiles the production build, runs TypeScript typechecks, and verifies
  all static/dynamic routes for 0 errors.

- npm run start
  Runs the production-optimized build locally.

- npm run test
  Executes the automated test suite using Vitest (14 tests in 4 suites).

- npm run knip
  Analyzes unused files, dead code, and unused dependencies.

- npx prisma db push
  Pushes Prisma schema changes directly to Supabase PostgreSQL.


================================================================================
6. AUTOMATED TESTS EXECUTION
================================================================================

To run all unit and integration tests, run:
   npm run test

Test Suites Included:
1. tests/unit/pin-security.test.ts
   - SHA-256 PIN hashing
   - Timing-safe PIN verification
   - Rejection of incorrect or malformed PINs

2. tests/unit/rbac-permissions.test.ts
   - Admin full permissions validation
   - Team Member restrictions (publishing blocked, cross-user deletion blocked)
   - Photo ownership delete verification

3. tests/unit/photo-validation.test.ts
   - File format validation (JPEG, PNG, WebP)
   - Rejection of unsupported MIME types
   - File size calculation and formatting

4. tests/integration/gallery-flow.test.ts
   - End-to-end guest access simulation
   - PIN verification token verification
   - Isolation of unpublished / draft photos from clients


================================================================================
7. SYSTEM ARCHITECTURE & PERMISSIONS MATRIX
================================================================================

FEATURE / ACTION               | TEAM ADMIN | TEAM MEMBER | GUEST CLIENT
-------------------------------+------------+-------------+--------------
Sign Up / Login with Email     | Yes        | Yes         | No Account
View All Events in Studio      | Yes        | No          | No
View Assigned Events           | Yes        | Yes         | No
Create New Events              | Yes        | No (403)    | No
Assign Team Members to Event   | Yes        | No (403)    | No
Upload Photos to Events        | Yes        | Yes         | No
View "My Uploads" Tab          | Yes        | Yes         | No
Select / Curate for Gallery    | Yes        | No (403)    | No
Publish Gallery & Set PIN      | Yes        | No (403)    | No
Delete Any Photo               | Yes        | No (403)    | No
Delete Own Uploaded Photo      | Yes        | Yes         | No
Manage Team Directory          | Yes        | No (403)    | No
Access Gallery via Link + PIN  | Yes        | Yes         | Yes


================================================================================
8. TROUBLESHOOTING & COMMON QUESTIONS
================================================================================

Q: When I log in as Team Member, why do I not see "Create Event" or "Galleries"?
A: This is the intended security design according to the challenge requirements.
   Team Members are restricted to viewing only assigned events and uploading
   photos.

Q: How do I assign a new event to member@trizen-ai.com?
A: Log in as admin@trizen-ai.com, go to Events, click the "Team" icon on the
   event card, and click "Assign to Event" next to the member.

Q: Are images stored directly in the database?
A: No. Per requirement 4, all image binaries are stored in Cloudinary object
   storage CDN. Only photo metadata (URL, file size, uploader ID, timestamps)
   is stored in the PostgreSQL database.

Q: How do I add a new team member?
A: Either register them via http://localhost:3000/admin/register with the
   "Team Member" pill selected, or use the "Team Members" directory page as
   an Admin.

================================================================================
TrizenAI Full-Stack Internship Challenge | Talent Acquisition: talent@trizen-ai.com
================================================================================
