"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(
        data.message ||
        "If an account exists with this email, you will receive a password reset link shortly."
      );
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent xl:flex-row divide-x divide-white/5">
      {/* Left section - Matching Login/Register Layout */}
      <div className="hidden flex-col justify-center pl-8 pr-6 xl:flex xl:w-[45%] xl:pl-12 xl:pr-10 2xl:pl-16 2xl:pr-12">
        <Link href="/" className="mb-12 inline-flex transition-transform hover:scale-105 active:scale-95">
          <img
            src="/images/logo.png"
            alt="Jobs Portal"
            width={320}
            height={320}
            className="h-32 w-auto max-w-full rounded-lg object-contain filter brightness-110 contrast-125 mix-blend-screen"
          />
        </Link>
        <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-primary">
          Account Recovery
        </p>
        <h2 className="mb-6 text-3xl font-black leading-tight text-foreground xl:text-4xl 2xl:text-5xl">
          Recover your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Account</span>
        </h2>
        <p className="mb-10 max-w-md text-lg text-muted-foreground leading-relaxed">
          Don&apos;t worry if you&apos;ve forgotten your password. We&apos;ll help you get back to your professional journey in no time.
        </p>
      </div>

      {/* Form section */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8 xl:min-h-0 xl:w-[55%] xl:py-12 xl:pl-10 xl:pr-12 2xl:pl-16 2xl:pr-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.03),transparent)] pointer-events-none" />
        <div className="mb-8 w-full max-w-md xl:hidden">
          <Link href="/" className="inline-flex">
            <img
              src="/images/logo.png"
              alt="Jobs Portal"
              width={240}
              height={240}
              className="h-20 w-auto max-w-full rounded-lg object-contain filter brightness-110 contrast-125 mix-blend-screen"
            />
          </Link>
        </div>

        <div className="linear-card w-full max-w-md rounded-[2.5rem] p-10 sm:p-12 animate-in zoom-in-95 duration-500">
          <h1 className="text-2xl font-black text-foreground mb-2">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Enter your email and we&apos;ll send you a link to reset your password.
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

            <Button
              type="submit"
              className="h-14 w-full rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send reset link"}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
