import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLocation(location: string | null | undefined): string {
  if (!location || location.trim() === "") return "Not specified";
  
  try {
    const locationData = JSON.parse(location);
    const parts: string[] = [];
    
    // Handle both lowercase and capitalized keys for backward compatibility
    const city = locationData.city || locationData.City;
    const state = locationData.state || locationData.State;
    const country = locationData.country || locationData.Country;
    
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    
    return parts.length > 0 ? parts.join(", ") : location;
  } catch (e) {
    // If it's not JSON, return as is (for backward compatibility)
    return location;
  }
}
