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
    phone: "",
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

    if (formData.role === "JOB_SEEKER") {
      if (!formData.firstName || !formData.lastName) {
        setError("First name and last name are required");
        return;
      }
      if (!formData.phone?.trim()) {
        setError("Phone number is required");
        return;
      }
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
        payload.phone = formData.phone.trim();
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
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-background xl:flex-row divide-x divide-white/5">
      {/* Left section - only on xl+ to avoid gap on medium screens */}
      {/* Left section */}
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
          Create Account
        </p>
        <h2 className="mb-6 text-3xl font-black leading-tight text-foreground xl:text-4xl 2xl:text-5xl">
          Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Elite Network</span> of Talent
        </h2>
        <p className="mb-10 max-w-md text-lg text-muted-foreground leading-relaxed">
          Build a high-performance profile, connect with top-tier employers, and unlock tailored opportunities designed for your growth.
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

      {/* Form section - full width below xl, centered; 55% on xl+ */}
      {/* Form section */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-12 sm:px-6 md:px-8 xl:min-h-0 xl:w-[55%] xl:py-16 xl:pl-10 xl:pr-12 2xl:pl-16 2xl:pr-16 relative overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.03),transparent)] pointer-events-none" />
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
        <div className="linear-card w-full max-w-md rounded-[2.5rem] p-10 sm:p-12 animate-in slide-in-from-bottom-5 duration-500">
          <h1 className="text-2xl font-black text-foreground mb-2">
            Register
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Start your professional journey today
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-400">
                {error}
              </div>
            )}

            {/* Role segmented control */}
            <div className="space-y-3">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Registration Purpose</Label>
              <div className="flex rounded-xl bg-white/5 border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "JOB_SEEKER" })}
                  className={`flex-1 rounded-lg py-3 text-xs font-black uppercase tracking-widest transition-all ${
                    formData.role === "JOB_SEEKER"
                      ? "bg-white/10 text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "EMPLOYER" })}
                  className={`flex-1 rounded-lg py-3 text-xs font-black uppercase tracking-widest transition-all ${
                    formData.role === "EMPLOYER"
                      ? "bg-white/10 text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  Employer
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {formData.role === "EMPLOYER" ? "Work Email Address" : "Email Address"}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={formData.role === "EMPLOYER" ? "you@company.com" : "you@example.com"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                required
              />
            </div>

            {formData.role === "JOB_SEEKER" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                    required
                  />
                </div>
              </>
            )}

            {formData.role === "EMPLOYER" && (
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="Acme Studios"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                  required
                />
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Password
              </Label>
              <PasswordInput
                id="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                required
                minLength={8}
              />
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 leading-tight">
                8+ chars: Uppercase, lowercase, number & special char
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Confirm Password
              </Label>
              <PasswordInput
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="h-14 rounded-xl border-white/10 bg-white/5 focus:border-primary/50 focus:ring-primary/20 text-foreground transition-all"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="h-14 w-full rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              disabled={loading}
            >
              {loading
                ? "Securing..."
                : formData.role === "EMPLOYER"
                  ? "Create Employer Account"
                  : "Create account"}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
