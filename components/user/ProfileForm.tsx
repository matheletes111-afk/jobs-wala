"use client";

import { useState } from "react";
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

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
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
    resumeUrl?: string | null;
  };
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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

  const onSubmit = async (data: ProfileFormData) => {
    setError("");
    setLoading(true);

    try {
      let resumeUrl = profile?.resumeUrl || null;

      // Upload resume if provided
      if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);

        const uploadResponse = await fetch("/api/upload/resume", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload resume");
        }

        const uploadData = await uploadResponse.json();
        resumeUrl = uploadData.url;
      }

      // Save profile
      const response = await fetch("/api/user/profile", {
        method: profile ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          skills: data.skills
            ? data.skills.split(",").map((s) => s.trim())
            : [],
          resumeUrl,
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

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{profile ? "Edit Profile" : "Create Profile"}</CardTitle>
        <CardDescription>
          Fill in your details to complete your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
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

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              placeholder="+1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <LocationDropdown
              value={locationValue}
              onChange={(value) => setValue("location", value)}
              error={errors.location?.message}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

