"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationData {
  country: string;
  state: string;
  city: string;
}

interface LocationDropdownProps {
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
}

interface CountryStateCity {
  Country: {
    getAllCountries: () => Array<{ name: string; isoCode: string }>;
  };
  State: {
    getStatesOfCountry: (countryIsoCode: string) => Array<{ name: string; isoCode: string }>;
  };
  City: {
    getCitiesOfState: (countryIsoCode: string, stateIsoCode: string) => Array<{ name: string }>;
  };
}

declare global {
  interface Window {
    csc?: CountryStateCity;
    onCSCLoaded?: () => void;
  }
}

export default function LocationDropdown({
  value,
  onChange,
  error,
}: LocationDropdownProps) {
  const [countries, setCountries] = useState<Array<{ name: string; isoCode: string }>>([]);
  const [states, setStates] = useState<Array<{ name: string; isoCode: string }>>([]);
  const [cities, setCities] = useState<Array<{ name: string }>>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const scriptLoaded = useRef(false);
  const initialLocation = useRef<LocationData | null>(null);
  const isPrefilling = useRef(false);

  const prefillLocation = useCallback(() => {
    if (!initialLocation.current || !window.csc || isPrefilling.current) return;
    
    isPrefilling.current = true;
    const { Country, State } = window.csc;
    
    try {
      const loc = initialLocation.current;
      
      // Find and set country
      const allCountries = Country.getAllCountries();
      if (loc.country) {
        const countryObj = allCountries.find(
          (c) => c.name === loc.country || c.name.toLowerCase() === loc.country.toLowerCase()
        );
        
        if (countryObj) {
          setSelectedCountry(countryObj.isoCode);
          
          // Load states for the country - the useEffect will handle setting the selected state
          const countryStates = State.getStatesOfCountry(countryObj.isoCode);
          setStates(countryStates);
        }
      }
    } catch (error) {
      console.error("Error prefilling location:", error);
    } finally {
      isPrefilling.current = false;
    }
  }, []);

  // Parse existing location value
  useEffect(() => {
    if (value) {
      try {
        const locationData: LocationData = JSON.parse(value);
        initialLocation.current = locationData;
        // If library is already loaded, trigger prefilling
        if (scriptLoaded.current && window.csc) {
          // Reset selections first, then prefill after a small delay
          setSelectedCountry("");
          setSelectedState("");
          setSelectedCity("");
          setStates([]);
          setCities([]);
          // Use a small delay to ensure state updates are processed
          setTimeout(() => {
            prefillLocation();
          }, 100);
        }
      } catch (e) {
        console.error("Failed to parse location:", e);
        initialLocation.current = null;
        setSelectedCountry("");
        setSelectedState("");
        setSelectedCity("");
        setStates([]);
        setCities([]);
      }
    } else {
      initialLocation.current = null;
      setSelectedCountry("");
      setSelectedState("");
      setSelectedCity("");
      setStates([]);
      setCities([]);
    }
  }, [value, prefillLocation]);

  // Watch for states to be loaded and prefill state if needed
  useEffect(() => {
    if (
      states.length > 0 &&
      initialLocation.current?.state &&
      selectedCountry &&
      !selectedState
    ) {
      const stateObj = states.find(
        (s) =>
          s.name === initialLocation.current!.state ||
          s.name.toLowerCase() === initialLocation.current!.state.toLowerCase()
      );
      if (stateObj) {
        setSelectedState(stateObj.isoCode);
        // Load cities for this state
        if (window.csc) {
          const countryObj = countries.find((c) => c.isoCode === selectedCountry);
          if (countryObj && window.csc.City) {
            const stateCities = window.csc.City.getCitiesOfState(
              selectedCountry,
              stateObj.isoCode
            );
            setCities(stateCities);
          }
        }
      }
    }
  }, [states, selectedCountry, selectedState, countries]);

  // Watch for cities to be loaded and prefill city if needed
  useEffect(() => {
    if (
      cities.length > 0 &&
      initialLocation.current?.city &&
      selectedState &&
      !selectedCity
    ) {
      const cityFound = cities.find(
        (c) =>
          c.name === initialLocation.current!.city ||
          c.name.toLowerCase() === initialLocation.current!.city.toLowerCase()
      );
      if (cityFound) {
        setSelectedCity(cityFound.name);
      }
    }
  }, [cities, selectedState, selectedCity]);

  const loadCountries = () => {
    if (typeof window !== "undefined" && window.csc) {
      try {
        const { Country } = window.csc;
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);
        setLoading(false);

        // Prefill location if we have initial location data
        if (initialLocation.current) {
          // Use setTimeout to ensure countries state is set
          setTimeout(() => {
            prefillLocation();
          }, 50);
        }
      } catch (error) {
        console.error("Error loading countries:", error);
        setLoading(false);
      }
    }
  };

  const loadStates = (countryIsoCode: string) => {
    if (typeof window !== "undefined" && window.csc) {
      try {
        const { State } = window.csc;
        const countryStates = State.getStatesOfCountry(countryIsoCode);
        setStates(countryStates);
      } catch (error) {
        console.error("Error loading states:", error);
      }
    }
  };

  // Load the country-state-city library from CDN
  useEffect(() => {
    if (scriptLoaded.current) return;

    const script = document.createElement("script");
    script.type = "module";
    script.innerHTML = `
      import { Country, State, City } from 'https://cdn.jsdelivr.net/npm/country-state-city@3.1.0/+esm';
      window.csc = { Country, State, City };
      if (window.onCSCLoaded) window.onCSCLoaded();
    `;
    
    const handleLoad = () => {
      scriptLoaded.current = true;
      loadCountries();
    };
    
    window.onCSCLoaded = handleLoad;

    script.onerror = () => {
      console.error("Failed to load country-state-city library");
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.onCSCLoaded;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCities = (countryIsoCode: string, stateIsoCode: string) => {
    if (typeof window !== "undefined" && window.csc) {
      try {
        const { City } = window.csc;
        const stateCities = City.getCitiesOfState(countryIsoCode, stateIsoCode);
        setCities(stateCities);
      } catch (error) {
        console.error("Error loading cities:", error);
      }
    }
  };

  const handleCountryChange = (countryIsoCode: string) => {
    setSelectedCountry(countryIsoCode);
    setSelectedState("");
    setSelectedCity("");
    setStates([]);
    setCities([]);

    if (countryIsoCode) {
      loadStates(countryIsoCode);
      const countryObj = countries.find((c) => c.isoCode === countryIsoCode);
      updateLocation(countryObj ? countryObj.name : "", "", "");
    } else {
      updateLocation("", "", "");
    }
  };

  const handleStateChange = (stateIsoCode: string) => {
    setSelectedState(stateIsoCode);
    setSelectedCity("");
    setCities([]);

    if (stateIsoCode && selectedCountry) {
      loadCities(selectedCountry, stateIsoCode);
      const countryObj = countries.find((c) => c.isoCode === selectedCountry);
      const stateObj = states.find((s) => s.isoCode === stateIsoCode);
      updateLocation(
        countryObj ? countryObj.name : "",
        stateObj ? stateObj.name : "",
        ""
      );
    } else {
      const countryObj = countries.find((c) => c.isoCode === selectedCountry);
      updateLocation(countryObj ? countryObj.name : "", "", "");
    }
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    const countryObj = countries.find((c) => c.isoCode === selectedCountry);
    const stateObj = states.find((s) => s.isoCode === selectedState);
    updateLocation(
      countryObj ? countryObj.name : "",
      stateObj ? stateObj.name : "",
      cityName
    );
  };

  const updateLocation = (country: string, state: string, city: string) => {
    const locationData: LocationData = {
      country: country || "",
      state: state || "",
      city: city || "",
    };
    onChange(JSON.stringify(locationData));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={selectedCountry}
            onValueChange={handleCountryChange}
            disabled={loading}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.isoCode} value={country.isoCode}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select
            value={selectedState}
            onValueChange={handleStateChange}
            disabled={!selectedCountry || loading}
          >
            <SelectTrigger id="state" className="w-full">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.isoCode} value={state.isoCode}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Select
            value={selectedCity}
            onValueChange={handleCityChange}
            disabled={!selectedState || loading}
          >
            <SelectTrigger id="city" className="w-full">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city, index) => (
                <SelectItem key={`${city.name}-${index}`} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

