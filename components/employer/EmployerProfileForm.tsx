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
import { Briefcase, MapPin, Clock, Upload, Camera, FileText, X } from "lucide-react";

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  pointOfContact: z.string().optional(),
  phone: z.string().optional(),
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
    pointOfContact?: string | null;
    phone?: string | null;
    msmeDocUrl?: string | null;
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
  const msmeInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.companyLogo ?? null);
  const [msmeFile, setMsmeFile] = useState<File | null>(null);
  const [msmeDocUrl, setMsmeDocUrl] = useState<string | null>(profile?.msmeDocUrl ?? null);
  const [msmeName, setMsmeName] = useState<string>(profile?.msmeDocUrl ? "Existing document" : "");
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
          pointOfContact: profile.pointOfContact || "",
          phone: profile.phone || "",
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

  const handleMsmeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMsmeFile(file);
      setMsmeName(file.name);
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
    } catch (e) {
      setEmailChangeMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("companyName", data.companyName);
      if (data.industry) formData.append("industry", data.industry);
      if (data.companySize) formData.append("companySize", data.companySize);
      if (data.website) formData.append("website", data.website);
      if (data.description) formData.append("description", data.description);
      if (data.pointOfContact) formData.append("pointOfContact", data.pointOfContact);
      if (data.phone) formData.append("phone", data.phone);

      if (logoFile) {
        formData.append("logo", logoFile);
      }
      if (msmeFile) {
        formData.append("msmeDoc", msmeFile);
      }

      const response = await fetch("/api/employer/profile", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      router.push("/employer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updatedAgo = profile?.updatedAt
    ? formatDistanceToNow(new Date(profile.updatedAt), { addSuffix: true })
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 bg-transparent">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600 animate-in slide-in-from-top-4">
          {error}
        </div>
      )}

      {/* Profile summary header */}
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start border-b border-slate-200/60 pb-8">
        <div className="flex flex-col items-center gap-3">
          <div
            className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            onClick={() => logoInputRef.current?.click()}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company logo"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-50 text-3xl font-bold text-blue-600">
                {(profile?.companyName?.[0] ?? "?").toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Camera className="h-6 w-6 text-white" />
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
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Camera className="h-3 w-3" />
            Upload Logo
          </button>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
             <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified Employer
             </span>
             {updatedAgo && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-550">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Updated {updatedAgo}
              </span>
            )}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-800 tracking-tight">
            {profile?.companyName ?? "Complete Profile"}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
            Manage your company details and account settings. Maintain a professional profile to attract the best talent.
          </p>
          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
            {profile?.industry && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-650">
                <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                {profile.industry}
              </span>
            )}
            {profile?.companySize && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-650">
                <MapPin className="h-3.5 w-3.5 text-blue-500" />
                {profile.companySize} Employees
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
             <h3 className="text-base font-bold text-slate-800 tracking-tight">Account Security</h3>
             <p className="mt-1 text-xs font-medium text-slate-500">Manage your email address and account verification settings.</p>
          </div>
          <div className="lg:col-span-2">
            {userEmail !== undefined && (
               <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                <div className="space-y-1.5">
                  <Label htmlFor="currentEmail" className="text-xs font-semibold text-slate-500">
                    Email Address
                  </Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={userEmail}
                    disabled
                    className="h-10 rounded-lg bg-slate-100 border-slate-200 text-slate-400 font-semibold opacity-60 shadow-none"
                  />
                </div>
                
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Change Email Address</p>
                  {emailChangeMessage && (
                    <div
                      className={`rounded-lg p-3 text-xs font-semibold ${
                        emailChangeMessage.type === "success"
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-600"
                          : "bg-red-50 border border-red-100 text-red-650"
                      }`}
                    >
                      {emailChangeMessage.text}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="w-full space-y-1.5">
                      <Label htmlFor="newEmail" className="text-xs font-semibold text-slate-500">
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
                        className="h-10 rounded-lg bg-white border-slate-200 text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRequestEmailChange}
                      disabled={emailChangeLoading || !newEmail.trim()}
                      className="h-10 px-5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
                    >
                      {emailChangeLoading ? "Processing…" : "Send Link"}
                    </Button>
                  </div>
                </div>
               </div>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 pt-10 border-t border-slate-200/60">
          <div className="lg:col-span-1">
             <h3 className="text-base font-bold text-slate-800 tracking-tight">Company Profile</h3>
             <p className="mt-1 text-xs font-medium text-slate-500">Update your company details to provide more information to candidates.</p>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Company Name */}
              <div className="space-y-1.5">
                <Label htmlFor="companyName" className="text-xs font-semibold text-slate-500">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  placeholder="Acme Corp"
                  className="h-11 rounded-xl bg-white border-slate-200 text-xs font-semibold text-slate-750"
                />
                {errors.companyName && (
                  <p className="text-xs font-semibold text-red-500 mt-1">{errors.companyName.message}</p>
                )}
              </div>

              {/* Industry */}
              <div className="space-y-1.5">
                <Label htmlFor="industry" className="text-xs font-semibold text-slate-500">
                  Industry
                </Label>
                <Input
                  id="industry"
                  {...register("industry")}
                  placeholder="IT Services"
                  className="h-11 rounded-xl bg-white border-slate-200 text-xs font-semibold text-slate-750"
                />
              </div>

              {/* Company Size */}
              <div className="space-y-1.5">
                <Label htmlFor="companySize" className="text-xs font-semibold text-slate-500">
                  Company Size
                </Label>
                <Input
                  id="companySize"
                  {...register("companySize")}
                  placeholder="500+ Employees"
                  className="h-11 rounded-xl bg-white border-slate-200 text-xs font-semibold text-slate-750"
                />
              </div>

              {/* Company Website */}
              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-semibold text-slate-500">
                  Company Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  {...register("website")}
                  placeholder="https://www.acmecorp.com"
                  className="h-11 rounded-xl bg-white border-slate-200 text-xs font-semibold text-slate-750"
                />
              </div>

              {/* Point of Contact */}
              <div className="space-y-1.5">
                <Label htmlFor="pointOfContact" className="text-xs font-semibold text-slate-500">
                  Point of Contact
                </Label>
                <Input
                  id="pointOfContact"
                  {...register("pointOfContact")}
                  placeholder="John Smith (HR Manager)"
                  className="h-11 rounded-xl bg-white border-slate-200 text-xs font-semibold text-slate-750"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-500">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="+91 98765 43210"
                  className="h-11 rounded-xl bg-white border-slate-200 text-xs font-semibold text-slate-750"
                />
              </div>
            </div>

            {/* Company Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-500">
                Company Description
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your company's mission, values, and work culture..."
                rows={5}
                className="rounded-xl bg-white border-slate-200 p-4 text-xs font-medium text-slate-700 leading-relaxed"
              />
            </div>

            {/* MSME Document */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-slate-500">
                MSME / Authority Registration Document
                <span className="ml-1 text-slate-450 normal-case font-medium">(PDF or DOCX, max 5 MB)</span>
              </Label>
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 cursor-pointer hover:border-blue-500/50 hover:bg-slate-100/50 transition-colors"
                onClick={() => msmeInputRef.current?.click()}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                  <FileText className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  {msmeName ? (
                    <p className="text-xs font-bold text-slate-700 truncate">{msmeName}</p>
                  ) : (
                    <p className="text-xs font-semibold text-slate-450">Click to upload registration document</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOC, DOCX</p>
                </div>
                {msmeName && (
                  <button
                    type="button"
                    className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setMsmeFile(null); setMsmeDocUrl(null); setMsmeName(""); }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {!msmeName && (
                  <Upload className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <input
                  ref={msmeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleMsmeChange}
                />
              </div>
              {msmeDocUrl && !msmeFile && (
                <a
                  href={msmeDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <FileText className="h-3.5 w-3.5" /> View current document
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-200/60">
          <p className="text-xs font-semibold text-slate-400">Review and save your company profile information.</p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="h-11 px-6 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
            >
              <span style={{ color: "white" }}>
                {loading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
