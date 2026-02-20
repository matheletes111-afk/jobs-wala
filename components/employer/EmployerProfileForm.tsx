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
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const updatedAgo = profile?.updatedAt
    ? formatDistanceToNow(new Date(profile.updatedAt), { addSuffix: true })
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Profile summary header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100"
            onClick={() => logoInputRef.current?.click()}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-50 text-3xl font-bold text-[#2563eb]">
                {(profile?.companyName?.[0] ?? "?").toUpperCase()}
              </div>
            )}
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
            className="flex items-center gap-1.5 text-sm font-medium text-[#2563eb] hover:underline"
          >
            <Camera className="h-4 w-4" />
            Update Photo
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]">
            Employer Profile
          </span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900 md:text-3xl">
            {profile?.companyName ?? "Company Profile"}
          </h1>
          <p className="mt-2 text-gray-600">
            Keep your company information fresh so job seekers and candidates
            understand your brand, culture, and the opportunities you offer.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile?.industry && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#2563eb]">
                <Briefcase className="h-3.5 w-3.5" />
                {profile.industry}
              </span>
            )}
            {profile?.companySize && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#2563eb]">
                <MapPin className="h-3.5 w-3.5" />
                {profile.companySize}
              </span>
            )}
            {updatedAgo && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#2563eb]">
                <Clock className="h-3.5 w-3.5" />
                Updated {updatedAgo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Profile
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Company Information
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              These details power your public profile and job postings.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 shrink-0 gap-2 border-[#2563eb] text-[#2563eb] hover:bg-blue-50 sm:mt-0"
            onClick={() => logoInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload logo
          </Button>
        </div>

        <div className="space-y-6">
          {/* Email section (if applicable) */}
          {userEmail !== undefined && (
            <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <div>
                <Label htmlFor="currentEmail" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={userEmail}
                  disabled
                  className="mt-1.5 bg-white"
                />
              </div>
              <p className="text-xs text-gray-600">
                To change your email, we will send a verification link to your new address.
              </p>
              {emailChangeMessage && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    emailChangeMessage.type === "success"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {emailChangeMessage.text}
                </div>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1 space-y-1.5">
                  <Label htmlFor="newEmail" className="text-sm font-medium text-gray-700">
                    New email
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="you@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleRequestEmailChange())
                    }
                    disabled={emailChangeLoading}
                    className="bg-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRequestEmailChange}
                  disabled={emailChangeLoading || !newEmail.trim()}
                >
                  {emailChangeLoading ? "Sending…" : "Send verification link"}
                </Button>
              </div>
            </div>
          )}

          {/* Two-column form fields */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                Company name *
              </Label>
              <Input
                id="companyName"
                {...register("companyName")}
                placeholder="Acme Inc."
                className="bg-white"
              />
              {errors.companyName && (
                <p className="text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                Industry
              </Label>
              <Input
                id="industry"
                {...register("industry")}
                placeholder="Technology"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize" className="text-sm font-medium text-gray-700">
                Company size
              </Label>
              <Input
                id="companySize"
                {...register("companySize")}
                placeholder="50-100 employees"
                className="bg-white"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                {...register("website")}
                placeholder="https://www.example.com"
                className="bg-white"
              />
            </div>
          </div>

          {/* About / Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              About your company
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Summarize your company, culture, and what makes you a great place to work."
              rows={5}
              className="resize-y bg-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#2563eb] hover:bg-[#1d4ed8]"
            >
              {loading ? "Saving…" : profile ? "Update profile" : "Create profile"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
