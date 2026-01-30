# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed and running (or Docker)

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobportal?schema=public"

# NextAuth Configuration (generate a secret with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudflare R2 Storage (Required for file uploads)
# Get credentials from: https://dash.cloudflare.com → R2 → Manage R2 API Tokens
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""  # Optional: Public URL for R2 bucket (e.g., https://your-bucket.r2.dev)

# Razorpay (Optional for development)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# Email Service - Resend (Optional for development)
# Get your API key from https://resend.com
RESEND_API_KEY=""
RESEND_FROM_EMAIL="KORA <noreply@jobportal.com>"  # Optional: Format as "Name <email@domain.com>"
RESEND_FROM_ADDRESS="noreply@jobportal.com"  # Optional: Fallback if RESEND_FROM_EMAIL not set
MAIL_FROM_NAME="KORA"  # Optional: Sender name (defaults to "KORA")

# Admin User Creation (Optional)
ADMIN_EMAIL="admin@jobportal.com"
ADMIN_PASSWORD="admin123"
```

**Important:** Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Set Up Database

#### Option A: Using Docker (Recommended)
```bash
docker run --name jobportal-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobportal -p 5432:5432 -d postgres:14
```

#### Option B: Local PostgreSQL
Create a database:
```sql
CREATE DATABASE jobportal;
```

### 4. Generate Prisma Client and Push Schema
```bash
npm run db:generate
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## Optional Steps

### Create Admin User
```bash
npm run create-admin
```

### Open Prisma Studio (Database GUI)
```bash
npm run db:studio
```

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Verify DATABASE_URL in `.env` matches your PostgreSQL credentials
- Check if the database exists

### Port Already in Use
If port 3000 is busy, you can change it:
```bash
npm run dev -- -p 3001
```

### Module Not Found
Clear cache and reinstall:
```bash
rm -rf node_modules .next
npm install
```


