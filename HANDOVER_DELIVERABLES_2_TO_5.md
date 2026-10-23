# JobDaddy (www.jobdaddy.in) – Handover Deliverables Package
**Milestone:** Items 2 to 5 (Access Management, IP Transfer, Technical Documentation & Credentials)  
**Target Recipient:** Rahul (`rahulme81@gmail.com`)  
**Production Domain:** [https://www.jobdaddy.in](https://www.jobdaddy.in)  
**Hosting Infrastructure:** Vercel (Edge & Serverless)  
**Date of Execution:** October 2026  

---

## Table of Contents
1. [Item 2: Access Management Documentation](#item-2-access-management-documentation)
   - 2.1 Infrastructure Overview & Architecture Topology
   - 2.2 Vercel Project Ownership & Deployment Access
   - 2.3 Custom Domain & DNS Configuration (`jobdaddy.in`)
   - 2.4 Database Access & Administration (PostgreSQL on Neon Tech)
   - 2.5 Cloudflare R2 Storage Bucket Access
   - 2.6 Razorpay Payment Gateway Administration
   - 2.7 Transactional Email Service (SendGrid / Resend)
   - 2.8 Third-Party AI Services (OpenAI API)
2. [Item 3: Intellectual Property (IP) Transfer Agreement](#item-3-intellectual-property-ip-transfer-agreement)
   - 3.1 Formal Deed of Intellectual Property Assignment
   - 3.2 Schedule A: Inventory of Assigned Assets & Work
   - 3.3 Execution & Signature Block
3. [Item 4: Technical Documentation & Runbooks (SOPs)](#item-4-technical-documentation--runbooks-sops)
   - 4.1 System Technology Stack & Version Matrix
   - 4.2 Standard Operating Procedures:
     - SOP-01: Local Environment Setup & Run Procedures
     - SOP-02: Vercel Production Build, Deployment & CI/CD Pipeline
     - SOP-03: Database Migrations & Prisma Management
     - SOP-04: Admin User Creation & Role Management
     - SOP-05: Cloudflare R2 Resume & File Storage Operations
     - SOP-06: Razorpay Payment Integration & Webhook Handling
     - SOP-07: Transactional Email Infrastructure & Failover
     - SOP-08: AI Resume Parsing & ATS Ranking Workflows
     - SOP-09: Incident Management, Error Logging & Rollback Procedures
4. [Item 5: Credentials Handover Matrix & Security Protocol](#item-5-credentials-handover-matrix--security-protocol)
   - 5.1 Complete Master Environment Variables Matrix
   - 5.2 Secure Transmission Protocol
   - 5.3 Post-Handover Key Rotation & Security Checklist

---

# Item 2: Access Management Documentation

This section defines the technical and network infrastructure supporting `https://www.jobdaddy.in` and provides the exact delegation steps to transfer full administrative control to `rahulme81@gmail.com`.

### 2.1 Infrastructure Access Summary Table

| Service / Layer | Provider / Host | Account / Resource Identifier | Transfer Method to Client (`rahulme81@gmail.com`) |
| :--- | :--- | :--- | :--- |
| **Web Application** | Vercel | Project: `jobs-wala` / `jobdaddy` | Vercel Team Admin invite or Direct Project Transfer |
| **Domain & DNS** | Domain Registrar | `jobdaddy.in` & `www.jobdaddy.in` | Registrar Account push or DNS delegation to Vercel |
| **Relational Database** | Neon Tech | `ep-falling-leaf-ahfcb4xb-pooler` (US-East-1) | Neon Console -> Project Settings -> Add Admin Collaborator |
| **Object File Storage** | Cloudflare R2 | Bucket: `jobdaddy`, Account: `163a6778fa01...` | Cloudflare Dashboard -> Members -> Add as Administrator |
| **Payment Gateway** | Razorpay | Merchant ID / JobDaddy Account | Razorpay Settings -> User Access -> Invite Owner/Admin |
| **Transactional Email** | SendGrid / Resend | API Keys & Sender Identities | Invite as Team Member or swap with Client API Key |
| **AI Resume Parser** | OpenAI | Organization API Key | Organization Member invite or swap with Client API Key |

---

### 2.2 Vercel Project Ownership & Deployment Access
The application is hosted on **Vercel** with continuous deployment linked to the production GitHub repository.

#### Step-by-Step Vercel Transfer:
1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **JobDaddy** project.
3. Click on **Settings** > **Members** (or Organization Settings if in a team).
4. Click **Invite Member**, enter `rahulme81@gmail.com`, and select the role **Owner** or **Admin**.
5. Once accepted, navigate to **Settings** > **General** > **Transfer Project** to move the project directly into the client’s Vercel Team/Personal account.
6. Verify that the production branch is locked to `main` and automatic deployment hooks remain active.

---

### 2.3 Custom Domain & DNS Configuration (`jobdaddy.in`)
The production application operates on `https://www.jobdaddy.in`.

#### Active DNS Record Configuration:
| Type | Name / Host | Target / Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (root) | `76.76.21.21` | Auto / 300 | Directs apex `jobdaddy.in` to Vercel Anycast Edge IP |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 300 | Directs `www.jobdaddy.in` to Vercel Edge CDN |

#### Registrar Transfer Procedure:
1. At the current domain registrar (e.g., GoDaddy, Namecheap, BigRock):
   - Disable **Domain Privacy Protection** and **Registrar Lock**.
   - Request the **Auth-Code / EPP Transfer Key**.
2. Have `rahulme81@gmail.com` log into their preferred registrar and initiate a **Domain Inbound Transfer** using the EPP key.
3. Accept the authorization email confirmation.
4. *Important:* DNS records must remain pointing to Vercel during the 5–7 day propagation window to ensure zero service disruption.
5. SSL/TLS is handled automatically via Let's Encrypt managed by Vercel; no manual SSL certificate installation is required.

---

### 2.4 Database Access & Administration (PostgreSQL on Neon Tech)
JobDaddy utilizes a PostgreSQL 16 serverless cluster hosted on **Neon Tech** in the `us-east-1` region.

#### Connection Endpoint:
* **Host:** `ep-falling-leaf-ahfcb4xb-pooler.c-3.us-east-1.aws.neon.tech`
* **Database:** `neondb`
* **Default Port:** `5432`
* **SSL Mode:** `require`
* **Pooling:** Built-in PgBouncer transaction pooling enabled for high concurrency.

#### Transfer Protocol:
1. Log in to [Neon Console](https://console.neon.tech).
2. Select the JobDaddy Project.
3. Go to **Settings** > **Members** > **Invite Member**.
4. Input `rahulme81@gmail.com` and assign **Admin** privileges.
5. Transfer billing responsibility to the client's payment card.
6. Once the client confirms access, rotate the default `neondb_owner` password via the Neon dashboard and update the `DATABASE_URL` environment variable in Vercel.

---

### 2.5 Cloudflare R2 Storage Bucket Access
Candidate resumes (PDF/DOCX), cover letters, company logos, and avatars are stored in an S3-compatible Cloudflare R2 bucket.

#### Resource Parameters:
* **Bucket Name:** `jobdaddy`
* **Account ID:** `163a6778fa01288598cca5554bb1ddf7`
* **Jurisdiction / S3 API Endpoint:** `https://163a6778fa01288598cca5554bb1ddf7.r2.cloudflarestorage.com`
* **Public Domain / Preview URL:** `https://pub-77077181400d4766a0a4b6fdbf5d14cb.r2.dev`

#### Handover Steps:
1. Navigate to [Cloudflare Dashboard](https://dash.cloudflare.com) > **Manage Account** > **Members**.
2. Invite `rahulme81@gmail.com` with the **Administrator** role.
3. Direct the client to **R2** > **Manage R2 API Tokens** > **Create API Token** (Permissions: `Object Read & Write`).
4. Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Vercel Project Settings.

---

### 2.6 Razorpay Payment Gateway Administration
Employer subscriptions and candidate career packages are processed via Razorpay.

#### Handover Steps:
1. Log into [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings** > **User Access & Roles**.
3. Click **Add User**, enter `rahulme81@gmail.com`, and assign the role **Owner** / **Admin**.
4. The client must review and update:
   - Registered Business Information & GSTIN.
   - Bank Account for daily payouts / settlements.
5. In **Settings** > **API Keys**, generate new **Live Key ID** and **Key Secret**.
6. In **Settings** > **Webhooks**, ensure the webhook endpoint is set to:
   `https://www.jobdaddy.in/api/webhooks/razorpay`
   with active events: `payment.captured`, `order.paid`, `subscription.charged`.

---

### 2.7 Transactional Email Service (SendGrid / Resend)
System emails (registration verification, password resets, application confirmations, admin alerts) are routed through SendGrid with an active Resend and SMTP fallback.

#### Handover Steps:
1. Add `rahulme81@gmail.com` as an Administrator in the active email provider.
2. Verify domain authentication (`jobdaddy.in`) by adding SPF (`v=spf1 include:sendgrid.net ~all`) and DKIM CNAME records to DNS.
3. Configure the official sender identity (e.g., `notifications@jobdaddy.in`).

---

### 2.8 Third-Party AI Services (OpenAI API)
Used for automated candidate resume parsing, skill extraction, and candidate-to-job matching.

#### Handover Steps:
1. Log in to [OpenAI Platform](https://platform.openai.com).
2. Go to **Settings** > **Organization** > **Members** and invite `rahulme81@gmail.com` as **Owner**.
3. Instruct the client to attach their corporate billing payment card and generate a dedicated `OPENAI_API_KEY` for JobDaddy production.

---

# Item 3: Intellectual Property (IP) Transfer Agreement

### DEED OF INTELLECTUAL PROPERTY ASSIGNMENT AND TRANSFER OF OWNERSHIP

This **Deed of Intellectual Property Assignment** ("Agreement") is executed on this ______ day of ________________, 2026 ("Effective Date"), by and between:

**THE ASSIGNOR (DEVELOPER / VENDOR):**  
Name / Legal Entity: ________________________________________________  
Address: __________________________________________________________  
Contact Email: _____________________________________________________  
*(hereinafter referred to as the "Assignor", which expression shall include its successors and permitted assigns)*

**AND**

**THE ASSIGNEE (CLIENT / OWNER):**  
Name / Legal Entity: ________________________________________________  
Designated Representative: Rahul  
Contact Email: `rahulme81@gmail.com`  
Address: __________________________________________________________  
*(hereinafter referred to as the "Assignee", which expression shall include its successors and permitted assigns)*

---

#### RECITALS
**WHEREAS**, the Assignor has designed, architected, developed, and deployed the software application known as **"JobDaddy"**, currently operating at the domain **`https://www.jobdaddy.in`**;  
**WHEREAS**, the Assignee has commissioned the development of the said software platform;  
**WHEREAS**, upon satisfaction of agreed commercial consideration, the Assignor agrees to convey, assign, and transfer all intellectual property, rights, titles, and interests in the platform to the Assignee on an absolute and unencumbered basis.

---

#### OPERATIVE CLAUSES

#### 1. Definitions
* **"Assigned IP"** means all intellectual property rights in and to the JobDaddy platform, including without limitation: full source code, backend scripts, database structures, Prisma schemas, API configurations, frontend components, UI/UX designs, wireframes, algorithms, documentation, domain names, and trademarks associated with `jobdaddy.in`.
* **"Software"** means the Next.js 16 full-stack web application, including employer, candidate, and administrative dashboards, payment pipelines, and file storage integrations.

#### 2. Scope of Assignment
In consideration of the full and final payment received by the Assignor, the Assignor hereby irrevocably, unconditionally, and globally sells, assigns, transfers, and conveys to the Assignee, forever and without restriction:
1. All copyrights, trade secrets, proprietary rights, and design rights in the Software and related deliverables.
2. All rights to reproduce, modify, enhance, license, sublicense, sell, or create derivative works of the Software.
3. All registered and unregistered trademarks, trade dress, logos, and domain names (`jobdaddy.in` and associated subdomains).
4. All rights to institute legal proceedings, seek damages, and claim injunctive relief for past, present, or future infringement of the Assigned IP.

#### 3. Waiver of Moral Rights
To the maximum extent permitted by applicable law, the Assignor hereby irrevocably waives all moral rights, rights of paternity, rights of integrity, or similar rights in the Assigned IP in favor of the Assignee.

#### 4. Representations and Warranties
The Assignor represents, warrants, and covenants to the Assignee that:
1. The Assignor is the sole and rightful author/creator of the custom code and has full power and legal authority to execute this Assignment.
2. The Assigned IP is free and clear of all liens, mortgages, charges, security interests, claims, or encumbrances.
3. The custom Software does not infringe upon the patent, copyright, trade secret, or other proprietary rights of any third party.
4. Third-party open-source components utilized in the project (such as Next.js, React, Tailwind CSS, Prisma, Radix UI) are distributed under permissive open-source licenses (MIT, Apache 2.0) that do not encumber or restrict the commercial exploitation or proprietary ownership of the custom codebase.

#### 5. Further Assurances
The Assignor covenants to execute all further deeds, documents, and instruments, and perform all acts reasonably requested by the Assignee (including signing domain transfer authorizations and IP office filings) to perfect the Assignee's absolute title in the Assigned IP.

#### 6. Governing Law & Dispute Resolution
This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the competent courts in [City/State, e.g., Kolkata / New Delhi], India.

---

### SIGNATURES AND EXECUTION

**FOR AND ON BEHALF OF THE ASSIGNOR (DEVELOPER):**

Signature: ____________________________________  
Printed Name: _________________________________  
Title / Designation: ____________________________  
Date: ________________________________________  

*In the presence of Witness 1:*  
Signature: ____________________________________  
Name & Address: ______________________________  

---

**FOR AND ON BEHALF OF THE ASSIGNEE (CLIENT):**

Signature: ____________________________________  
Printed Name: Rahul / Authorized Signatory  
Title / Designation: ____________________________  
Date: ________________________________________  

*In the presence of Witness 2:*  
Signature: ____________________________________  
Name & Address: ______________________________  

---

# Item 4: Technical Documentation & Runbooks (SOPs)

### 4.1 Technology Stack & Runtime Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                    JobDaddy Architecture                    │
├─────────────────────────────────────────────────────────────┤
│ Frontend:       Next.js 16 (App Router) + React 19          │
│ Styling:        Tailwind CSS + Radix UI (shadcn)            │
│ Language:       TypeScript (Node.js runtime v20+)           │
│ Database:       PostgreSQL 16 (Neon Serverless Pooler)      │
│ ORM:            Prisma ORM v6                               │
│ File Storage:   Cloudflare R2 (S3-Compatible Object Store)  │
│ Authentication: NextAuth.js v5 (JWT Session Strategy)       │
│ Payments:       Razorpay API & Webhook Infrastructure       │
│ Email Engine:   SendGrid & Resend (Dual Provider Fallback)  │
│ AI Intelligence:OpenAI API (Resume Parsing & ATS Analyzer)  │
│ Hosting / CDN:  Vercel Edge & Serverless Functions          │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.2 Standard Operating Procedures (SOPs)

#### SOP-01: Local Development Setup & Execution
* **Purpose:** Guide technical personnel on how to spin up a fully functional local development instance.
* **Prerequisites:** Node.js v18+, Git, npm/yarn.
* **Procedure:**
  1. Clone repository:
     ```bash
     git clone https://github.com/matheletes111-afk/jobs-wala.git
     cd jobs-wala
     ```
  2. Install all dependencies:
     ```bash
     npm install
     ```
  3. Prepare `.env` file (refer to Section 5 for keys):
     ```bash
     cp .env.example .env
     ```
  4. Generate the Prisma database client:
     ```bash
     npm run db:generate
     ```
  5. Run the local development server:
     ```bash
     npm run dev
     ```
  6. Access application in browser at `http://localhost:3000`.

---

#### SOP-02: Vercel Production Build, Deployment & CI/CD
* **Purpose:** Standardize the deployment pipeline to `https://www.jobdaddy.in`.
* **CI/CD Workflow:**
  1. The production environment is bound to the `main` branch of the GitHub repository.
  2. Pushing code to `main` triggers automated Vercel webhooks:
     - Step 1: `git clone` & cache restoration.
     - Step 2: `npm install`
     - Step 3: `prisma generate` (triggered via `postinstall` script).
     - Step 4: `npm run build` (`next build --webpack`).
     - Step 5: Edge function deployment and CDN cache propagation.
* **Manual Emergency Redeployment:**
  1. Open [Vercel Dashboard](https://vercel.com).
  2. Select **jobdaddy** > **Deployments**.
  3. Select the three dots `...` next to the latest successful deployment.
  4. Click **Redeploy**.

---

#### SOP-03: Database Migrations & Prisma Management
* **Purpose:** Safely update database schemas without data loss.
* **Procedures:**
  * **To apply schema changes in development:**
    ```bash
    npm run db:migrate
    # Executes prisma migrate dev, generates SQL migration scripts
    ```
  * **To synchronize schema directly with a target database:**
    ```bash
    npm run db:push
    # Pushes schema state without generating migration files
    ```
  * **To view and edit database records via graphical interface:**
    ```bash
    npm run db:studio
    # Opens Prisma Studio in browser at http://localhost:5555
    ```

---

#### SOP-04: Admin User Creation & Role Management
* **Purpose:** Create administrative users with unrestricted access to the Admin Dashboard (`/admin`).
* **Available User Roles:**
  - `JOB_SEEKER`: Candidates browsing jobs, uploading resumes, tracking applications.
  - `EMPLOYER`: Companies posting jobs, purchasing subscriptions, reviewing applicants.
  - `ADMIN`: Platform operators with access to analytics, user moderation, and plan management.
* **Admin Provisioning Procedure:**
  1. Set target credentials in terminal or `.env`:
     ```bash
     ADMIN_EMAIL="admin@jobdaddy.in"
     ADMIN_PASSWORD="SecureComplexPassword123!"
     ```
  2. Run the automated seed script:
     ```bash
     npm run create-admin
     ```
  3. Verify login at `https://www.jobdaddy.in/login` with the admin credentials; access `https://www.jobdaddy.in/admin`.

---

#### SOP-05: Cloudflare R2 Resume & File Storage Operations
* **Purpose:** Manage file uploads, resumes, candidate attachments, and company branding logos.
* **Architecture:**
  - Files are uploaded through presigned URLs generated in `lib/s3.ts`.
  - Stored files are addressed by UUID or timestamped keys inside bucket `jobdaddy`.
* **Troubleshooting Upload Failures:**
  1. If upload gives `CORS Error` in browser:
     - Go to Cloudflare Dashboard > R2 > `jobdaddy` > **Settings** > **CORS Policy**.
     - Verify allowed origins include:
       ```json
       [
         {
           "AllowedOrigins": ["https://www.jobdaddy.in", "https://jobdaddy.in", "http://localhost:3000"],
           "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
           "AllowedHeaders": ["*"],
           "MaxAgeSeconds": 3600
         }
       ]
       ```
  2. If resume downloads fail, confirm `R2_PUBLIC_URL` points to the active Cloudflare custom domain or public bucket URL (`https://pub-77077181400d4766a0a4b6fdbf5d14cb.r2.dev`).

---

#### SOP-06: Razorpay Payment Integration & Webhook Handling
* **Purpose:** Ensure seamless processing of employer subscriptions and candidate career services.
* **Code Implementation:** `lib/razorpay.ts` and `app/api/webhooks/razorpay/route.ts`.
* **Workflow:**
  1. Frontend initiates checkout request to `/api/employer/subscribe` or `/api/career/checkout`.
  2. Backend initializes a Razorpay Order ID.
  3. Client completes payment via Razorpay modal popup.
  4. Server receives asynchronous webhook at `/api/webhooks/razorpay`:
     - Verifies HMAC signature using `RAZORPAY_WEBHOOK_SECRET`.
     - Updates `Subscription` or `Payment` record in PostgreSQL to `ACTIVE`.
     - Extends employer posting quota or unlocks career features.
* **Switching from Test to Production:**
  1. Replace `rzp_test_...` with live `rzp_live_...` in Vercel Environment Variables.
  2. Update Razorpay Webhook URL in Razorpay Dashboard to point to `https://www.jobdaddy.in/api/webhooks/razorpay`.

---

#### SOP-07: Transactional Email Infrastructure & Failover
* **Purpose:** Monitor and maintain notification delivery.
* **Implementation:** `lib/email.ts`.
* **Failover Mechanism:**
  - Primary Provider: SendGrid (`SENDGRID_API_KEY`).
  - Secondary Provider: Resend (`RESEND_API_KEY`).
  - Fallback Provider: NodeMailer SMTP (configured with custom Gmail/Corporate SMTP).
* **Delivery Verification:**
  - If emails land in spam, verify that domain DNS includes:
    - SPF: `v=spf1 include:sendgrid.net ~all`
    - DKIM: 3 CNAME records generated by SendGrid.

---

#### SOP-08: AI Resume Parsing & ATS Ranking Workflows
* **Purpose:** Automated parsing of candidate resumes into structured skills, experience, and education.
* **Implementation:** `lib/openai-resume-parser.ts`.
* **Workflow:**
  1. Candidate uploads resume (PDF/DOCX) -> Stored in R2.
  2. Text extracted using `mammoth` (DOCX) or PDF buffer parser.
  3. OpenAI `gpt-4o-mini` extracts JSON schema: candidate name, email, phone, skills, total experience, and education.
  4. Parsed data auto-populates candidate profile and indexes for Employer X-Ray search.
* **Rate Limits & Failures:**
  - If parsing fails due to OpenAI rate limits or insufficient credit, the system falls back gracefully, preserving the raw uploaded file so the candidate can still apply.

---

#### SOP-09: Incident Management, Error Logging & Rollback
* **Purpose:** Standard procedure during an unexpected outage or production error.
* **Incident Protocol:**
  1. **Identify Error:** Go to [Vercel Dashboard](https://vercel.com) > **jobdaddy** > **Logs**. Filter by status `500` or higher.
  2. **Database Health Check:** Check Neon dashboard metrics for connection pool exhaustion. Ensure `max_connections` limit is not reached.
  3. **Immediate 1-Click Rollback:**
     - In Vercel > **Deployments**, locate the previous stable deployment.
     - Click `...` > **Promote to Production**.
     - Vercel instantly routes 100% of traffic to the previous build in under 5 seconds without requiring code changes.

---

# Item 5: Credentials Handover Matrix & Security Protocol

### 5.1 Master Environment Variables Matrix

The table below lists every environment variable utilized by `https://www.jobdaddy.in`, its purpose, current configuration, and destination.

| Variable Name | Required By | Description / Purpose | Current Setup Location | Rotation Action for Client |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Prisma / DB | PostgreSQL connection string with SSL | Vercel & `.env` | Rotate Neon DB password; update in Vercel. |
| `NEXTAUTH_SECRET` | NextAuth v5 | 32-byte secret for JWT signing & session hashing | Vercel & `.env` | Keep secure; generate new random base64 secret if compromised. |
| `AUTH_SECRET` | NextAuth v5 | Duplicate secret for Auth.js compatibility | Vercel & `.env` | Match with `NEXTAUTH_SECRET`. |
| `NEXTAUTH_URL` | NextAuth v5 | Base application canonical URL | Vercel & `.env` | Set to `https://www.jobdaddy.in`. |
| `NEXT_PUBLIC_APP_URL`| Frontend | Public canonical application URL | Vercel & `.env` | Set to `https://www.jobdaddy.in`. |
| `R2_ACCOUNT_ID` | Storage | Cloudflare Account ID for R2 storage | Vercel & `.env` | Retain or update to client Cloudflare account. |
| `R2_ACCESS_KEY_ID` | Storage | Cloudflare R2 API token access key | Vercel & `.env` | Client creates new API token in Cloudflare. |
| `R2_SECRET_ACCESS_KEY`| Storage | Cloudflare R2 API token secret key | Vercel & `.env` | Client creates new API token in Cloudflare. |
| `R2_BUCKET_NAME` | Storage | R2 bucket identifier (`jobdaddy`) | Vercel & `.env` | Set to `jobdaddy`. |
| `R2_PUBLIC_URL` | Storage | Public CDN URL for serving uploads | Vercel & `.env` | Point to custom domain or public R2 bucket. |
| `RAZORPAY_KEY_ID` | Payments | Razorpay API Key ID | Vercel & `.env` | Switch from test key (`rzp_test_...`) to live key (`rzp_live_...`). |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay Secret Key | Vercel & `.env` | Switch from test secret to live secret. |
| `RAZORPAY_WEBHOOK_SECRET`| Payments | HMAC secret for verifying Razorpay webhooks | Vercel & `.env` | Set matching secret configured in Razorpay Webhooks. |
| `SENDGRID_API_KEY` | Email | SendGrid API key for transactional email | Vercel & `.env` | Retain or create new key under client account. |
| `SENDGRID_FROM_EMAIL` | Email | Verified sender address (e.g. `info@jobdaddy.in`)| Vercel & `.env` | Update to client's verified domain address. |
| `RESEND_API_KEY` | Email (Backup) | Secondary email provider API key | Vercel & `.env` | Optional backup key. |
| `OPENAI_API_KEY` | AI / ATS | OpenAI API key for resume parsing | Vercel & `.env` | Generate dedicated production key in OpenAI dashboard. |
| `ADMIN_EMAIL` | Admin Script | Initial administrator email address | Server / Script | Used for running `npm run create-admin`. |
| `ADMIN_PASSWORD` | Admin Script | Initial administrator password | Server / Script | Used for running `npm run create-admin`. |

---

### 5.2 Secure Transmission Protocol
To ensure credentials are never leaked, follow this strict handover procedure:
1. **Never send production passwords or API secrets in plain text over email, WhatsApp, or public chat.**
2. **Recommended Vault Delivery:**
   - Create a secure digital vault item via **1Password**, **Bitwarden**, or a password-protected encrypted archive (`.zip` / `.7z`).
   - Share the encrypted vault link with `rahulme81@gmail.com`.
   - Transmit the master decryption passphrase through a separate, out-of-band communication channel (e.g., direct SMS or encrypted voice call).
3. **Direct Dashboard Transfer (Best Practice):**
   - The safest method is for the client to generate their own credentials directly within their respective accounts (Razorpay, Cloudflare, OpenAI) and input them into **Vercel Project Settings > Environment Variables**, minimizing any third-party exposure.

---

### 5.3 Post-Handover Security & Key Rotation Checklist
Upon receiving full system ownership, the client’s technical team should execute the following 7-step rotation:

- [ ] **Step 1:** Log into Neon Console -> Change password for `neondb_owner` -> Update `DATABASE_URL` in Vercel.
- [ ] **Step 2:** Generate a new 32-byte secret using `openssl rand -base64 32` -> Update `NEXTAUTH_SECRET` and `AUTH_SECRET` in Vercel.
- [ ] **Step 3:** In Cloudflare Dashboard -> Create a dedicated R2 API Token for the client -> Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in Vercel.
- [ ] **Step 4:** In Razorpay Dashboard -> Switch account to Live Mode -> Generate Live API Keys -> Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel.
- [ ] **Step 5:** In Razorpay Webhook Settings -> Confirm endpoint is `https://www.jobdaddy.in/api/webhooks/razorpay` and secret matches `RAZORPAY_WEBHOOK_SECRET`.
- [ ] **Step 6:** In OpenAI Dashboard -> Generate new production API Key -> Update `OPENAI_API_KEY` in Vercel.
- [ ] **Step 7:** Go to Vercel Dashboard -> Deployments -> Click **Redeploy** to ensure all edge functions inherit the rotated production variables.

---

*End of Handover Deliverables Document (Items 2 to 5)*
