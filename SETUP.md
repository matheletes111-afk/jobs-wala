# Job Portal - Local Setup Guide

## Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher) - [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git** (optional, for version control)

## Step-by-Step Setup Instructions

### 1. Install Dependencies

If you haven't already, install all project dependencies:

```bash
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL Installation

1. Install PostgreSQL on your machine if not already installed
2. Create a new database for the project:

```sql
CREATE DATABASE jobportal;
```

#### Option B: Use Docker (Recommended for Quick Setup)

```bash
docker run --name jobportal-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobportal -p 5432:5432 -d postgres:14
```

### 3. Configure Environment Variables

1. Copy the example environment file:

```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Linux/Mac
cp .env.example .env
```

2. Open `.env` file and update the following variables:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jobportal?schema=public"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (Optional for now - can use local storage for development)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_REGION="us-east-1"

# Razorpay (Optional for now - needed for payment features)
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

# Email Service - Resend (Optional for now - needed for email notifications)
# Get your API key from https://resend.com
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="KORA <noreply@yourdomain.com>"  # Optional: Format as "Name <email@domain.com>"
RESEND_FROM_ADDRESS="noreply@yourdomain.com"  # Optional: Fallback if RESEND_FROM_EMAIL not set
MAIL_FROM_NAME="KORA"  # Optional: Sender name (defaults to "KORA")
```

**Important:** Generate a secure `NEXTAUTH_SECRET`:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 4. Run Database Migrations

Set up your database schema:

```bash
# Generate Prisma Client (if not already done)
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# OR use migrations (recommended for production)
npm run db:migrate
```

### 5. Start the Development Server

Run the Next.js development server:

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### 6. (Optional) Open Prisma Studio

To view and manage your database data visually:

```bash
npm run db:studio
```

This opens Prisma Studio at: **http://localhost:5555**

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # Check if PostgreSQL service is running
   # Windows: Check Services
   # Linux: sudo systemctl status postgresql
   # Mac: brew services list
   ```

2. Verify your `DATABASE_URL` in `.env` is correct
3. Check if the database exists:
   ```sql
   \l  -- List all databases
   ```

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

Or change the port in `package.json`:
```json
"dev": "next dev -p 3001"
```

### Prisma Client Not Generated

If you see "PrismaClient is not generated" errors:

```bash
npm run db:generate
```

### Module Not Found Errors

Clear cache and reinstall:

```bash
rm -rf node_modules .next
npm install
```

## Project Structure

```
job-portal/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (user)/            # Job Seeker routes
│   ├── (employer)/        # Employer routes
│   ├── (admin)/           # Admin routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── user/             # User panel components
│   ├── employer/         # Employer components
│   └── admin/            # Admin components
├── lib/                  # Utilities & configurations
├── prisma/               # Prisma schema & migrations
├── types/                # TypeScript types
└── hooks/                # Custom React hooks
```

## Next Steps

Once the project is running:

1. **Create an Admin User** - You'll need to create an admin user directly in the database or through Prisma Studio
2. **Test Authentication** - Try registering and logging in
3. **Explore Features** - Navigate through different user panels

## Development Notes

- The project uses **Next.js 16** with App Router
- Authentication is handled by **NextAuth.js** with JWT
- Database ORM is **Prisma** with **PostgreSQL**
- UI components from **shadcn/ui** with **Tailwind CSS**
- Form validation with **Zod** and **React Hook Form**

## Need Help?

- Check the main [README.md](./README.md) for project overview
- Review Prisma documentation: https://www.prisma.io/docs
- Next.js documentation: https://nextjs.org/docs
- NextAuth.js documentation: https://next-auth.js.org

