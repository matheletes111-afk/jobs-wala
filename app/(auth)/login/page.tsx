"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Check } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const errorParam = searchParams.get("error");
    const registered = searchParams.get("registered");

    if (verified === "true") {
      setSuccess("Email verified successfully! You can now login.");
    } else if (registered === "true") {
      setSuccess("Registration successful! Please check your email to verify your account.");
    } else if (errorParam === "invalid_token") {
      setError("Invalid verification token. Please request a new verification email.");
    } else if (errorParam === "token_expired") {
      setError("Verification token has expired. Please request a new verification email.");
    } else if (errorParam === "verification_failed") {
      setError("Email verification failed. Please try again.");
    } else if (errorParam === "EMAIL_NOT_VERIFIED") {
      setError("Please verify your email address before logging in. Check your inbox for the verification link.");
    }
    const resetSuccess = searchParams.get("reset");
    if (resetSuccess === "success") {
      setSuccess("Your password has been reset. You can now log in with your new password.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const checkRes = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok || checkData.error) {
        if (checkData.error === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email address before logging in. Check your inbox for the verification link.");
        } else {
          setError(checkData.error || "Invalid email or password");
        }
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl");
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-sky-50 via-white to-white">
      {/* Left section - informational (same layout as register) */}
      <div className="hidden w-[45%] flex-col justify-center px-12 xl:px-20 lg:flex">
        <Link href="/" className="mb-8 inline-flex">
          <img
            src="/images/logo.jpeg"
            alt="Jobs Portal"
            width={320}
            height={320}
            className="h-40 w-auto rounded-lg object-contain sm:h-56"
          />
        </Link>
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-sky-500">
          Sign in
        </p>
        <h2 className="mb-4 text-3xl font-bold leading-tight text-gray-800">
          Welcome back to your account
        </h2>
        <p className="mb-8 max-w-md text-base text-gray-600">
          Sign in to access your account, continue your job search, or manage your listings and applications.
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

      {/* Right section - form card (same as register) */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[55%]">
        <div className="mb-6 w-full lg:hidden">
          <Link href="/" className="inline-flex">
          <img
            src="/images/logo.jpeg"
            alt="Jobs Portal"
            width={240}
            height={240}
            className="h-32 w-auto rounded-lg object-contain sm:h-40"
          />
        </Link>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg shadow-gray-200/50">
          <h1 className="text-xl font-bold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-1 mb-6 text-sm text-gray-500">
            Enter your email and password to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-700">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <Button
              type="submit"
              className="h-11 w-full rounded-lg bg-blue-600 font-semibold hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-sky-50 to-white px-4">
          <div className="w-full max-w-md animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="h-8 w-32 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="h-10 rounded-lg bg-gray-200" />
            <div className="h-10 rounded-lg bg-gray-200" />
            <div className="h-10 rounded-lg bg-gray-200" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
