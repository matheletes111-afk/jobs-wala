"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "JOB_SEEKER",
    firstName: "",
    lastName: "",
    companyName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.role === "JOB_SEEKER" && (!formData.firstName || !formData.lastName)) {
      setError("First name and last name are required");
      return;
    }

    if (formData.role === "EMPLOYER" && !formData.companyName) {
      setError("Company name is required");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "JOB_SEEKER") {
        payload.firstName = formData.firstName;
        payload.lastName = formData.lastName;
      } else if (formData.role === "EMPLOYER") {
        payload.companyName = formData.companyName;
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      alert("Registration successful! Please check your email to verify your account before logging in.");
      router.push("/login?registered=true");
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-gradient-to-r from-sky-50 via-white to-white xl:flex-row">
      {/* Left section - only on xl+ to avoid gap on medium screens */}
      <div className="hidden flex-col justify-center pl-8 pr-6 xl:flex xl:w-[45%] xl:pl-12 xl:pr-10 2xl:pl-16 2xl:pr-12">
        <Link href="/" className="mb-8 inline-flex">
          <img
            src="/images/logo.jpeg"
            alt="Jobs Portal"
            width={320}
            height={320}
            className="h-40 w-auto max-w-full rounded-lg object-contain xl:h-44 2xl:h-52"
          />
        </Link>
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-sky-500">
          Create account
        </p>
        <h2 className="mb-4 text-2xl font-bold leading-tight text-gray-800 xl:text-3xl">
          Join thousands of professionals hiring and getting hired
        </h2>
        <p className="mb-8 max-w-md text-base text-gray-600">
          Build a profile that stands out, connect with employers, and unlock tailored recommendations to accelerate your career journey.
        </p>
        <ul className="space-y-3">
          <li className="flex items-center gap-3 text-gray-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Access curated jobs from verified companies
          </li>
          <li className="flex items-center gap-3 text-gray-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Showcase your portfolio and skill badges
          </li>
          <li className="flex items-center gap-3 text-gray-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Collaborate with hiring teams in real time
          </li>
        </ul>
      </div>

      {/* Form section - full width below xl, centered; 55% on xl+ */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8 xl:min-h-0 xl:w-[55%] xl:py-12 xl:pl-10 xl:pr-12 2xl:pl-16 2xl:pr-16">
        <div className="mb-6 w-full max-w-md xl:hidden">
          <Link href="/" className="inline-flex">
            <img
              src="/images/logo.jpeg"
              alt="Jobs Portal"
              width={240}
              height={240}
              className="h-28 w-auto max-w-full rounded-lg object-contain sm:h-32"
            />
          </Link>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/50 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900">
            Create your free account
          </h1>
          <p className="mt-1 mb-6 text-sm text-gray-500">
            Start as a candidate or an employer. Switch anytime.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Role segmented control */}
            <div className="space-y-2">
              <Label className="text-gray-700">I am a</Label>
              <div className="flex rounded-lg border border-gray-300 p-0.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "JOB_SEEKER" })}
                  className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                    formData.role === "JOB_SEEKER"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "EMPLOYER" })}
                  className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                    formData.role === "EMPLOYER"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-transparent text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Employer
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                {formData.role === "EMPLOYER" ? "Work email" : "Email"}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={formData.role === "EMPLOYER" ? "you@company.com" : "you@example.com"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {formData.role === "JOB_SEEKER" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </>
            )}

            {formData.role === "EMPLOYER" && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700">
                  Company name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Studios"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">
                At least 8 characters with uppercase, lowercase, number and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirm password
              </Label>
              <PasswordInput
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-blue-600 font-semibold hover:bg-blue-700"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : formData.role === "EMPLOYER"
                  ? "Create Employer Account"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
