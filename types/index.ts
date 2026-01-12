import { UserRole, JobStatus, ApplicationStatus, SubscriptionPlanType, SubscriptionStatus, EmploymentType } from "@prisma/client";

export type { UserRole, JobStatus, ApplicationStatus, SubscriptionPlanType, SubscriptionStatus, EmploymentType };

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobSeekerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  location?: string | null;
  resumeUrl?: string | null;
  skills: string[];
  experience?: number | null;
  education?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  availabilityStatus?: string | null;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  companyLogo?: string | null;
  industry?: string | null;
  companySize?: string | null;
  website?: string | null;
  description?: string | null;
  subscriptionStatus?: SubscriptionStatus | null;
  subscriptionExpiry?: Date | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  experienceRequired?: number | null;
  salaryRange?: string | null;
  employmentType: EmploymentType;
  status: JobStatus;
  postedBy: string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  jobId: string;
  jobSeekerId: string;
  status: ApplicationStatus;
  coverLetter?: string | null;
  appliedAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  employerId: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}

