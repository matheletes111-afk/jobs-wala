import { JobSeekerProfile } from "@prisma/client";

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: JobSeekerProfile | null): {
  percentage: number;
  completedFields: string[];
  missingFields: string[];
  isComplete: boolean;
} {
  if (!profile) {
    return {
      percentage: 0,
      completedFields: [],
      missingFields: [
        "firstName",
        "lastName",
        "phone",
        "location",
        "resumeUrl",
        "skills",
        "education",
        "experience",
        "bio",
        "jobTitle",
      ],
      isComplete: false,
    };
  }

  const requiredFields = [
    { key: "firstName", value: profile.firstName, required: true },
    { key: "lastName", value: profile.lastName, required: true },
    { key: "phone", value: profile.phone, required: true },
    { key: "location", value: profile.location, required: true },
    { key: "resumeUrl", value: profile.resumeUrl, required: true },
    { key: "skills", value: profile.skills?.length > 0 ? profile.skills : null, required: true },
  ];

  const optionalFields = [
    { key: "education", value: profile.education, required: false },
    { key: "experience", value: profile.experience !== null && profile.experience !== undefined ? profile.experience : null, required: false },
    { key: "bio", value: profile.bio, required: false },
    { key: "jobTitle", value: profile.jobTitle, required: false },
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const completedFields: string[] = [];
  const missingFields: string[] = [];

  allFields.forEach((field) => {
    const isCompleted = field.value !== null && field.value !== undefined && field.value !== "";
    if (isCompleted) {
      completedFields.push(field.key);
    } else {
      missingFields.push(field.key);
    }
  });

  // Calculate percentage (required fields weighted more)
  const requiredWeight = 0.7; // 70% weight for required fields
  const optionalWeight = 0.3; // 30% weight for optional fields

  const requiredCompleted = requiredFields.filter((f) => f.value !== null && f.value !== undefined && f.value !== "").length;
  const optionalCompleted = optionalFields.filter((f) => f.value !== null && f.value !== undefined && f.value !== "").length;

  const requiredScore = (requiredCompleted / requiredFields.length) * requiredWeight;
  const optionalScore = (optionalCompleted / optionalFields.length) * optionalWeight;
  const percentage = Math.round((requiredScore + optionalScore) * 100);

  // Profile is complete if all required fields are filled
  const isComplete = requiredFields.every((f) => f.value !== null && f.value !== undefined && f.value !== "");

  return {
    percentage,
    completedFields,
    missingFields,
    isComplete,
  };
}

/**
 * Check if profile is complete enough to apply for jobs
 * Requires: firstName, lastName, phone, location, resumeUrl, and at least one skill
 */
export function canApplyForJobs(profile: JobSeekerProfile | null): {
  canApply: boolean;
  missingRequirements: string[];
} {
  if (!profile) {
    return {
      canApply: false,
      missingRequirements: [
        "Profile not created",
        "Resume not uploaded",
        "Phone number not provided",
        "Location not provided",
        "Skills not added",
      ],
    };
  }

  const missingRequirements: string[] = [];

  if (!profile.firstName || !profile.lastName) {
    missingRequirements.push("Name not complete");
  }

  if (!profile.phone) {
    missingRequirements.push("Phone number not provided");
  }

  if (!profile.location) {
    missingRequirements.push("Location not provided");
  }

  if (!profile.resumeUrl) {
    missingRequirements.push("Resume not uploaded");
  }

  if (!profile.skills || profile.skills.length === 0) {
    missingRequirements.push("At least one skill is required");
  }

  return {
    canApply: missingRequirements.length === 0,
    missingRequirements,
  };
}
