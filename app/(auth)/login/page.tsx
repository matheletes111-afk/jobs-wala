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
      Promise.resolve().then(() => setSuccess("Email verified successfully! You can now login."));
    } else if (registered === "true") {
      Promise.resolve().then(() => setSuccess("Registration successful! Please check your email to verify your account."));
    } else if (errorParam === "invalid_token") {
      Promise.resolve().then(() => setError("Invalid verification token. Please request a new verification email."));
    } else if (errorParam === "token_expired") {
      Promise.resolve().then(() => setError("Verification token has expired. Please request a new verification email."));
    } else if (errorParam === "verification_failed") {
      Promise.resolve().then(() => setError("Email verification failed. Please try again."));
    } else if (errorParam === "EMAIL_NOT_VERIFIED") {
      Promise.resolve().then(() => setError("Please verify your email address before logging in. Check your inbox for the verification link."));
    }
    const resetSuccess = searchParams.get("reset");
    if (resetSuccess === "success") {
      Promise.resolve().then(() => setSuccess("Your password has been reset. You can now log in with your new password."));
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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-background xl:flex-row divide-x divide-white/5">
      {/* Left section - only on xl+ to avoid gap on medium screens */}
      <div className="hidden flex-col justify-center pl-8 pr-6 xl:flex xl:w-[45%] xl:pl-12 xl:pr-10 2xl:pl-16 2xl:pr-12">
        <Link href="/" className="mb-12 inline-flex transition-transform hover:scale-105 active:scale-95">
          <img
            src="/images/logo.jpeg"
            alt="Jobs Portal"
            width={320}
            height={320}
            className="h-32 w-auto max-w-full rounded-lg object-contain filter brightness-110 contrast-125 mix-blend-screen"
          />
        </Link>
        <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-primary">
          Sign In
        </p>
        <h2 className="mb-6 text-3xl font-black leading-tight text-foreground xl:text-4xl 2xl:text-5xl">
          Welcome back to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Future of Work</span>
        </h2>
        <p className="mb-10 max-w-md text-lg text-muted-foreground leading-relaxed">
          Sign in to access your dashboard, discover personalized job matches, and manage your professional journey.
        </p>
        <ul className="space-y-4">
          {[
            "Access curated jobs from verified companies",
            "Showcase your portfolio and skill badges",
            "Collaborate with hiring teams in real time"
          ].map((text) => (
            <li key={text} className="flex items-center gap-4 text-foreground/80 font-medium">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Form section */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8 xl:min-h-0 xl:w-[55%] xl:py-12 xl:pl-10 xl:pr-12 2xl:pl-16 2xl:pr-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.03),transparent)] pointer-events-none" />
        <div className="mb-8 w-full max-w-md xl:hidden">
          <Link href="/" className="inline-flex">
            <img
              src="/images/logo.jpeg"
              alt="Jobs Portal"
              width={240}
              height={240}
              className="h-20 w-auto max-w-full rounded-lg object-contain filter brightness-110 contrast-125 mix-blend-screen"
            />
          </Link>
        </div>
        <div className="linear-card w-full max-w-md rounded-[2.5rem] p-10 sm:p-12 animate-in zoom-in-95 duration-500">
          <h1 className="text-2xl font-black text-foreground mb-2">
            Sign In
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Access your professional dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
                {success}
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                required
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                required
              />
            </div>
            <Button
              type="submit"
              className="h-14 w-full rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            New here?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create an account
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
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md animate-pulse space-y-6 rounded-[2.5rem] border border-white/5 bg-white/2 p-12">
            <div className="h-8 w-32 rounded-lg bg-white/5" />
            <div className="h-4 w-48 rounded-lg bg-white/5" />
            <div className="h-14 rounded-xl bg-white/5" />
            <div className="h-14 rounded-xl bg-white/5" />
            <div className="h-14 rounded-xl bg-white/5" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
