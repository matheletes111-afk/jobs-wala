import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import HomeJobList from "@/components/HomeJobList";

export default async function HomePage() {
  // Fetch active jobs for homepage
  const jobs = await prisma.job.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    take: 10, // Show latest 10 jobs on homepage
    include: {
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  // Check if user is logged in (for conditional rendering)
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Job Portal</h1>
          <div className="flex gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="mb-4 text-4xl font-bold">Find Your Dream Job</h2>
          <p className="mb-8 text-xl text-gray-600">
            Connect with top employers and discover opportunities that match your skills
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/user/jobs">
              <Button size="lg" variant="outline">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </section>

        {/* Current Job Openings Section */}
        {jobs.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="mb-6 text-3xl font-bold">Current Job Openings</h2>
            <HomeJobList jobs={jobs} />
          </section>
        )}

        <section className="container mx-auto px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Find a Job</CardTitle>
                <CardDescription>
                  Create your profile, upload your resume, and apply to jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Sign Up as Job Seeker
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Post a Job</CardTitle>
                <CardDescription>
                  Post jobs, find candidates, and manage applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Sign Up as Employer
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Find a Resume</CardTitle>
                <CardDescription>
                  Find the perfect candidate with our advanced resume search feature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/employer/search">
                  <Button variant="outline" className="w-full">
                    Search Candidates
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
