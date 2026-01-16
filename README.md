# Job Portal Application

A comprehensive job portal platform built with Next.js 16, PostgreSQL, and Prisma. Features three distinct panels for Job Seekers, Employers, and Administrators with advanced resume search, subscription management, and payment integration.

## Features

### 👤 User Panel (Job Seekers)
- User registration and authentication
- Profile management with resume upload
- Advanced job search with filters
- Job application tracking
- Email notifications

### 🏢 Employer Panel
- Employer registration and company profile
- Job posting and management
- Application review and management
- Advanced candidate resume search
- Subscription management with Razorpay integration

### 👨‍💼 Admin Panel
- Dashboard with analytics
- User and job management
- Role-based access control
- Reports and data export
- Subscription oversight

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Payment**: Razorpay
- **File Storage**: AWS S3
- **Email**: Resend
- **Validation**: Zod
- **Forms**: React Hook Form

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository** (if applicable)
   ```bash
   git clone <repository-url>
   cd job-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
job-portal/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (user)/            # Job Seeker routes
│   ├── (employer)/        # Employer routes
│   ├── (admin)/           # Admin routes
│   └── api/               # API route handlers
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

## Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL
- `AWS_ACCESS_KEY_ID` - AWS S3 access key
- `AWS_SECRET_ACCESS_KEY` - AWS S3 secret key
- `AWS_S3_BUCKET_NAME` - S3 bucket name
- `RAZORPAY_KEY_ID` - Razorpay API key
- `RAZORPAY_KEY_SECRET` - Razorpay API secret
- `RESEND_API_KEY` - Resend API key (get from https://resend.com)
- `RESEND_FROM_EMAIL` (optional) - Email sender address (e.g., "KORA <noreply@yourdomain.com>")
- `RESEND_FROM_ADDRESS` (optional) - Fallback sender address if RESEND_FROM_EMAIL is not set
- `MAIL_FROM_NAME` (optional) - Sender name (defaults to "KORA")

## Documentation

- [Setup Guide](./SETUP.md) - Detailed local setup instructions
- [API Documentation](./docs/api.md) - API endpoints (coming soon)
- [Deployment Guide](./docs/deployment.md) - Deployment instructions (coming soon)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@yourdomain.com or open an issue in the repository.
