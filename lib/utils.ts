import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLocation(location: string | null | undefined): string {
  if (!location) return "Not specified";
  
  try {
    const locationData = JSON.parse(location);
    const parts: string[] = [];
    
    if (locationData.city) parts.push(locationData.city);
    if (locationData.state) parts.push(locationData.state);
    if (locationData.country) parts.push(locationData.country);
    
    return parts.length > 0 ? parts.join(", ") : location;
  } catch (e) {
    // If it's not JSON, return as is (for backward compatibility)
    return location;
  }
}
