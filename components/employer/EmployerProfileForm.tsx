"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, MapPin, Clock, Upload, Camera } from "lucide-react";

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EmployerProfileFormProps {
  profile?: {
    companyName: string;
    industry?: string | null;
    companySize?: string | null;
    website?: string | null;
    description?: string | null;
    companyLogo?: string | null;
    updatedAt?: Date;
  };
  userEmail?: string;
  emailChangeStatus?: string;
  emailChangeError?: string;
}

export default function EmployerProfileForm({
  profile,
  userEmail,
  emailChangeStatus,
  emailChangeError,
}: EmployerProfileFormProps) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.companyLogo ?? null);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setLogoPreview(profile?.companyLogo ?? null);
  }, [profile?.companyLogo]);

  useEffect(() => {
    if (emailChangeStatus === "true") {
      setEmailChangeMessage({
        type: "success",
        text: "Your email has been updated. You may need to sign in again with your new email.",
      });
      router.replace("/employer/profile", { scroll: false });
    }
  }, [emailChangeStatus, router]);

  useEffect(() => {
    if (emailChangeError) {
      const messages: Record<string, string> = {
        invalid_token: "Invalid or expired verification link.",
        token_expired: "Verification link expired. Please request a new one.",
        email_taken: "This email is already in use. Please use a different email.",
        verification_failed: "Verification failed. Please try again.",
      };
      setEmailChangeMessage({
        type: "error",
        text: messages[emailChangeError] || "Something went wrong.",
      });
      router.replace("/employer/profile", { scroll: false });
    }
  }, [emailChangeError, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          companyName: profile.companyName,
          industry: profile.industry || "",
          companySize: profile.companySize || "",
          website: profile.website || "",
          description: profile.description || "",
        }
      : undefined,
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRequestEmailChange = async () => {
    if (!newEmail.trim()) return;
    setEmailChangeMessage(null);
    setEmailChangeLoading(true);
    try {
      const res = await fetch("/api/auth/change-email-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailChangeMessage({ type: "error", text: data.error || "Failed to send verification email." });
        return;
      }
      setEmailChangeMessage({
        type: "success",
        text: `Verification link sent to ${data.sentTo}. Check that inbox and click the link to confirm your new email.`,
      });
      setNewEmail("");
      router.refresh();
    } catch {
      setEmailChangeMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setError("");
    setLoading(true);

    try {
      let logoUrl = profile?.companyLogo || null;

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);

        const uploadResponse = await fetch("/api/upload/logo", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadData = await uploadResponse.json();
        logoUrl = uploadData.url;
      }

      const response = await fetch("/api/employer/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          companyLogo: logoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      router.push("/employer/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const updatedAgo = profile?.updatedAt
    ? formatDistanceToNow(new Date(profile.updatedAt), { addSuffix: true })
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-12 p-8 sm:p-12 bg-black/40 backdrop-blur-3xl">
      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-bold animate-in slide-in-from-top-4">
          {error}
        </div>
      )}

      {/* Profile summary header */}
      <div className="flex flex-col gap-10 sm:flex-row sm:items-start border-b border-white/5 pb-12">
        <div className="flex flex-col items-center gap-4">
          <div
            className="group relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-white/10 bg-white/5 shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            onClick={() => logoInputRef.current?.click()}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company logo"
                className="h-full w-full object-cover transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                {(profile?.companyName?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Camera className="h-8 w-8 text-white" />
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-blue-400 transition-colors"
          >
            <Camera className="h-3 w-3" />
            Upload Logo
          </button>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
             <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
               Verified Employer
             </span>
             {updatedAgo && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <Clock className="h-3.5 w-3.5" />
                Updated {updatedAgo}
              </span>
            )}
          </div>
          <h1 className="mt-6 text-3xl font-black text-foreground md:text-5xl tracking-tighter">
            {profile?.companyName ?? "Complete Profile"}
          </h1>
          <p className="mt-4 text-muted-foreground font-medium italic max-w-2xl leading-relaxed">
            Manage your company details and account settings. Maintain a professional profile to attract the best talent.
          </p>
          <div className="mt-8 flex flex-wrap justify-center sm:justify-start gap-3">
            {profile?.industry && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
                {profile.industry}
              </span>
            )}
            {profile?.companySize && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {profile.companySize} Employees
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
             <h3 className="text-xl font-black text-foreground tracking-tight">Account Security</h3>
             <p className="mt-2 text-sm font-medium text-muted-foreground italic">Manage your email address and account verification settings.</p>
          </div>
          <div className="lg:col-span-2">
            {userEmail !== undefined && (
              <div className="space-y-6 rounded-[2rem] border border-white/5 bg-white/[0.02] p-8">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Email Address
                  </Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={userEmail}
                    disabled
                    className="h-12 rounded-xl bg-white/5 border-white/10 text-muted-foreground font-black opacity-50"
                  />
                </div>
                
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Change Email Address</p>
                  {emailChangeMessage && (
                    <div
                      className={`rounded-xl p-4 text-sm font-bold ${
                        emailChangeMessage.type === "success"
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}
                    >
                      {emailChangeMessage.text}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="w-full space-y-2">
                      <Label htmlFor="newEmail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        New Email Address
                      </Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="company@email.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), handleRequestEmailChange())
                        }
                        disabled={emailChangeLoading}
                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:ring-primary/20"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRequestEmailChange}
                      disabled={emailChangeLoading || !newEmail.trim()}
                      className="h-12 px-6 rounded-xl bg-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/20 transition-all active:scale-95 shrink-0"
                    >
                      {emailChangeLoading ? "Processing…" : "Send Link"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-3 pt-12 border-t border-white/5">
          <div className="lg:col-span-1">
             <h3 className="text-xl font-black text-foreground tracking-tight">Company Profile</h3>
             <p className="mt-2 text-sm font-medium text-muted-foreground italic">Update your company details to provide more information to candidates.</p>
          </div>
          <div className="lg:col-span-2 space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  placeholder="Acme Corp"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
                {errors.companyName && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mt-2">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Industry
                </Label>
                <Input
                  id="industry"
                  {...register("industry")}
                  placeholder="IT Services"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Company Size
                </Label>
                <Input
                  id="companySize"
                  {...register("companySize")}
                  placeholder="500+ Employees"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Company Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  {...register("website")}
                  placeholder="https://www.acmecorp.com"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-primary/20 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Company Description
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your company's mission, values, and work culture..."
                rows={6}
                className="rounded-[2rem] bg-white/5 border-white/10 focus:ring-primary/20 p-6 font-medium italic leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Review and save your company profile information.</p>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-12 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 border-0 text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              {loading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
