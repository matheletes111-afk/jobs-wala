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
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-primary">Create Account</p>
            <h2 className="text-4xl font-black leading-tight text-foreground xl:text-5xl 2xl:text-6xl">
              Join the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Elite Network</span>
              {" "}of Talent
            </h2>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed font-semibold">
              Build a high-performance profile, connect with top-tier employers, and unlock tailored opportunities designed for your growth.
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
              className="h-20 w-auto max-w-full rounded-lg object-contain mix-blend-multiply"
            />
          </Link>
        </div>
        <div className="w-full max-w-lg rounded-[3rem] linear-card p-10 sm:p-14 shadow-2xl animate-in slide-in-from-bottom-5 duration-500 z-10 relative mx-auto">
          <h1 className="text-2xl font-black text-foreground mb-2">
            Register
          </h1>
          <p className="text-sm font-bold text-muted-foreground mb-10">
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
              <div className="flex rounded-2xl bg-slate-100/80 p-1.5 shadow-inner border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "JOB_SEEKER" })}
                  className={`flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all ${formData.role === "JOB_SEEKER"
                      ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "EMPLOYER" })}
                  className={`flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all ${formData.role === "EMPLOYER"
                      ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
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
                className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all px-5 font-bold"
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
                      className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all px-5 font-bold"
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
                      className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all px-5 font-bold"
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
                    className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all px-5 font-bold"
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
                  className="h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary text-foreground transition-all px-5 font-bold"
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
                className="h-14 rounded-2xl border-slate-200 bg-white/50 shadow-inner focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 text-foreground transition-all px-5"
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
                className="h-14 rounded-2xl border-slate-200 bg-white/50 shadow-inner focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 text-foreground transition-all px-5"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="mt-4 h-16 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
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
            <Link href="/login" className="text-blue-600 hover:text-orange-500 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
