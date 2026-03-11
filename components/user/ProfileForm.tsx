"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LocationDropdown from "@/components/user/LocationDropdown";
import { formatResumeUpdatedAt } from "@/lib/utils";
import { Camera, Plus, Trash2, FileText, ImageIcon } from "lucide-react";

export type CertificateItem = { url: string; type: "image" | "pdf"; description: string };

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  location: z.string().optional(),
  jobTitle: z.string().optional(),
  experience: z.number().min(0).optional(),
  education: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    location?: string | null;
    jobTitle?: string | null;
    experience?: number | null;
    education?: string | null;
    bio?: string | null;
    skills: string[];
    profileImage?: string | null;
    resumeUrl?: string | null;
    resumeUpdatedAt?: Date | string | null;
    certificates?: string | null;
  };
  userEmail?: string;
  emailChangeStatus?: string;
  emailChangeError?: string;
}

type CertificateEntry = {
  id: string;
  url?: string;
  type?: "image" | "pdf";
  description: string;
  file?: File;
};

export default function ProfileForm({
  profile,
  userEmail,
  emailChangeStatus,
  emailChangeError,
}: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile?.profileImage ?? null);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeMessage, setEmailChangeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [certificateEntries, setCertificateEntries] = useState<CertificateEntry[]>(() => {
    if (!profile?.certificates) return [];
    try {
      const arr = JSON.parse(profile.certificates) as CertificateItem[];
      return Array.isArray(arr)
        ? arr.map((c) => ({ id: crypto.randomUUID(), url: c.url, type: c.type, description: c.description || "" }))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (emailChangeStatus === "true") {
      setEmailChangeMessage({
        type: "success",
        text: "Your email has been updated. You may need to sign in again with your new email.",
      });
      router.replace("/user/profile", { scroll: false });
    }
  }, [emailChangeStatus, router]);

  useEffect(() => {
    setPhotoPreview(profile?.profileImage ?? null);
  }, [profile?.profileImage]);

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
      router.replace("/user/profile", { scroll: false });
    }
  }, [emailChangeError, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile
      ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone || "",
          location: profile.location || "",
          jobTitle: profile.jobTitle || "",
          experience: profile.experience || 0,
          education: profile.education || "",
          bio: profile.bio || "",
          skills: profile.skills.join(", "),
        }
      : undefined,
  });

  const locationValue = watch("location");

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
      let resumeUrl = profile?.resumeUrl || null;
      let profileImage = profile?.profileImage || null;

      // Upload photo if provided
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/upload/avatar", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload photo");
        const uploadData = await uploadRes.json();
        profileImage = uploadData.url;
      }

      // Upload resume if provided
      if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);
        const uploadResponse = await fetch("/api/upload/resume", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) throw new Error("Failed to upload resume");
        const uploadData = await uploadResponse.json();
        resumeUrl = uploadData.url;
      }

      // Upload new certificate files and build certificates JSON
      const certificatesList: CertificateItem[] = [];
      for (const entry of certificateEntries) {
        if (entry.url && entry.type) {
          certificatesList.push({ url: entry.url, type: entry.type, description: entry.description || "" });
        } else if (entry.file) {
          const fd = new FormData();
          fd.append("file", entry.file);
          const certRes = await fetch("/api/upload/certificate", { method: "POST", body: fd });
          if (!certRes.ok) {
            const err = await certRes.json();
            throw new Error(err.error || "Failed to upload certificate");
          }
          const certData = await certRes.json();
          const type = entry.file.type.startsWith("image/") ? "image" as const : "pdf" as const;
          certificatesList.push({ url: certData.url, type, description: entry.description || "" });
        }
      }
      const certificatesJson = certificatesList.length > 0 ? JSON.stringify(certificatesList) : null;

      // Save profile
      const response = await fetch("/api/user/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          skills: data.skills
            ? data.skills.split(",").map((s) => s.trim())
            : [],
          profileImage,
          resumeUrl,
          certificates: certificatesJson,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save profile");
      }

      router.push("/user/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const triggerPhotoUpload = () => {
    (document.getElementById("profilePhoto") as HTMLInputElement)?.click();
  };

  const addCertificate = () => {
    setCertificateEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "" },
    ]);
  };
  const removeCertificate = (id: string) => {
    setCertificateEntries((prev) => prev.filter((e) => e.id !== id));
  };
  const setCertificateFile = (id: string, file: File | undefined) => {
    setCertificateEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, file } : e))
    );
  };
  const setCertificateDescription = (id: string, description: string) => {
    setCertificateEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, description } : e))
    );
  };

  return (
    <Card className="w-full overflow-hidden rounded-2xl border-gray-200 shadow-md">
      <CardHeader className="border-b bg-gradient-to-br from-blue-50/50 to-violet-50/50 px-6 py-6 sm:px-8 sm:py-6 lg:px-10">
        <div className="flex items-center gap-6">
          <div
            className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100"
            onClick={triggerPhotoUpload}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gray-500">
                {profile?.firstName?.[0] ?? "?"}{profile?.lastName?.[0] ?? ""}
              </span>
            )}
            <input
              id="profilePhoto"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPhotoFile(file);
                  setPhotoPreview(URL.createObjectURL(file));
                }
              }}
            />
          </div>
          <div>
            <CardTitle>{profile ? "Edit Profile" : "Create Profile"}</CardTitle>
            <CardDescription>
              Fill in your details to complete your profile
            </CardDescription>
            <button
              type="button"
              onClick={triggerPhotoUpload}
              className="mt-2 flex items-center gap-2 text-sm font-medium text-[#2563eb] hover:underline"
            >
              <Camera className="h-4 w-4" />
              {photoPreview ? "Change photo" : "Upload photo"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pt-6 pb-8 sm:px-8 lg:px-10 lg:pb-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {userEmail !== undefined && (
            <>
              <div className="space-y-2">
                <Label>Email (login)</Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={userEmail}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  To change your email, use the section below. We will send a verification link to your new address.
                </p>
              </div>
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-medium">Change email</h3>
                {emailChangeMessage && (
                  <div
                    className={`rounded-md p-3 text-sm ${
                      emailChangeMessage.type === "success"
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {emailChangeMessage.text}
                  </div>
                )}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[200px] space-y-2">
                    <Label htmlFor="newEmail" className="sr-only">New email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      placeholder="New email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleRequestEmailChange())}
                      disabled={emailChangeLoading}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRequestEmailChange()}
                    disabled={emailChangeLoading || !newEmail.trim()}
                  >
                    {emailChangeLoading ? "Sending…" : "Send verification link"}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <LocationDropdown
                value={locationValue}
                onChange={(value) => setValue("location", value)}
                error={errors.location?.message}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                {...register("jobTitle")}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                {...register("experience", { valueAsNumber: true })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                {...register("education")}
                placeholder="Bachelor's in Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                {...register("skills")}
                placeholder="React, Node.js, TypeScript"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume">Resume (PDF)</Label>
            <Input
              id="resume"
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            />
            {profile?.resumeUrl && (
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  Current resume:{" "}
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Resume
                  </a>
                </p>
                {profile?.resumeUpdatedAt && (
                  <p className="text-sm text-gray-500">
                    Resume last updated: {formatResumeUpdatedAt(profile.resumeUpdatedAt)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Certificates</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCertificate}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add certificate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload an image or PDF and add a short description. Visible to employers on your profile.
            </p>
            {certificateEntries.length > 0 && (
              <ul className="space-y-3">
                {certificateEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-3"
                  >
                    <div className="flex-1 min-w-[140px] space-y-1">
                      <Label className="text-xs">File (image or PDF)</Label>
                      {entry.url ? (
                        <div className="flex items-center gap-2 text-sm">
                          {entry.type === "image" ? (
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ImageIcon className="h-4 w-4" />
                              View image
                            </a>
                          ) : (
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              View PDF
                            </a>
                          )}
                        </div>
                      ) : (
                        <Input
                          type="file"
                          accept="image/*,.pdf,application/pdf"
                          className="h-9"
                          onChange={(e) =>
                            setCertificateFile(entry.id, e.target.files?.[0])
                          }
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-[160px] space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="e.g. AWS Certified"
                        value={entry.description}
                        onChange={(e) =>
                          setCertificateDescription(entry.id, e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeCertificate(entry.id)}
                      aria-label="Remove certificate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

