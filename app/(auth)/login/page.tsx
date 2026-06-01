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
    } else if (errorParam === "EMPLOYER_PENDING") {
      Promise.resolve().then(() => setError("Your profile is pending admin approval."));
    } else if (errorParam === "EMPLOYER_REJECTED") {
      Promise.resolve().then(() => setError("Your profile has been rejected by the admin."));
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
        } else if (checkData.error === "EMPLOYER_PENDING") {
          setError("Your profile is pending admin approval.");
        } else if (checkData.error === "EMPLOYER_REJECTED") {
          setError("Your profile has been rejected by the admin.");
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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent xl:flex-row">
      {/* Left panel — premium light gradient */}
      <div className="hidden xl:flex xl:w-[45%] flex-col items-start justify-start pt-32 relative overflow-hidden linear-card border-r border-slate-200 shadow-xl">
        {/* Glow blobs */}
        <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-orange-400/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(to right,#000 1px,transparent 1px),linear-gradient(to bottom,#000 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 flex flex-col items-start px-12 2xl:px-20 text-left gap-8">
          {/* Logo */}
          <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
            <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl p-8 shadow-xl inline-block">
              <img src="/images/logo.jpeg" alt="Jobs Portal" width={400} height={160}
                className="h-32 w-auto object-contain mix-blend-multiply" />
            </div>
          </Link>

          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-primary">Sign In</p>
            <h2 className="text-4xl font-black leading-tight text-foreground xl:text-5xl 2xl:text-6xl">
              Welcome back to the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Future of Work</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed font-semibold">
              Sign in to access your dashboard, discover personalized job matches, and manage your professional journey.
            </p>
          </div>

          <ul className="w-full max-w-xs space-y-4 text-left">
            {[
              "Access curated jobs from verified companies",
              "Showcase your portfolio and skill badges",
              "Collaborate with hiring teams in real time"
            ].map((text) => (
              <li key={text} className="flex items-start gap-4 text-slate-700 font-bold text-sm">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 border border-blue-200 text-blue-600 shadow-sm">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
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
              className="h-20 w-auto max-w-full rounded-lg object-contain mix-blend-multiply"
            />
          </Link>
        </div>
        <div className="w-full max-w-lg rounded-[3rem] linear-card p-10 sm:p-14 shadow-2xl animate-in zoom-in-95 duration-500 z-10 relative mx-auto">
          <h1 className="text-2xl font-black text-foreground mb-2">
            Sign In
          </h1>
          <p className="text-sm font-bold text-muted-foreground mb-10">
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
                className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all px-5 font-bold"
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
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-orange-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all px-5 font-bold"
                required
              />
            </div>
            <Button
              type="submit"
              className="mt-4 h-16 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
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
        <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
          <div className="w-full max-w-md animate-pulse space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-12">
            <div className="h-8 w-32 rounded-lg bg-slate-100" />
            <div className="h-4 w-48 rounded-lg bg-slate-100" />
            <div className="h-14 rounded-xl bg-slate-100" />
            <div className="h-14 rounded-xl bg-slate-100" />
            <div className="h-14 rounded-xl bg-slate-100" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
