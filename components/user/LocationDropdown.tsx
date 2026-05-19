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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";

interface LocationData {
  country: string;
  state: string[];
  city: string[];
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
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const scriptLoaded = useRef(false);
  const initialLocation = useRef<LocationData | null>(null);
  const isPrefilling = useRef(false);
  const isInternalChange = useRef(false);

  const prefillLocation = useCallback(() => {
    if (!initialLocation.current || !window.csc || isPrefilling.current) return;
    
    isPrefilling.current = true;
    const { Country, State } = window.csc;
    
    try {
      const loc = initialLocation.current;
      
      const allCountries = Country.getAllCountries();
      if (loc.country) {
        const countryObj = allCountries.find(
          (c) => c.name === loc.country || c.name.toLowerCase() === loc.country.toLowerCase()
        );
        
        if (countryObj) {
          setSelectedCountry(countryObj.isoCode);
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
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    if (value) {
      try {
        const parsed = JSON.parse(value);
        let sStates: string[] = [];
        let sCities: string[] = [];
        
        if (parsed.state) {
          sStates = Array.isArray(parsed.state) ? parsed.state : [parsed.state];
        }
        if (parsed.city) {
          sCities = Array.isArray(parsed.city) ? parsed.city : [parsed.city];
        }
        
        initialLocation.current = {
          country: parsed.country || "",
          state: sStates,
          city: sCities
        };
        
        if (scriptLoaded.current && window.csc) {
          setSelectedCountry("");
          setSelectedStates([]);
          setSelectedCities([]);
          setStates([]);
          setCities([]);
          setTimeout(() => {
            prefillLocation();
          }, 100);
        }
      } catch (e) {
        initialLocation.current = null;
        setSelectedCountry("");
        setSelectedStates([]);
        setSelectedCities([]);
        setStates([]);
        setCities([]);
      }
    } else {
      initialLocation.current = null;
      setSelectedCountry("");
      setSelectedStates([]);
      setSelectedCities([]);
      setStates([]);
      setCities([]);
    }
  }, [value, prefillLocation]);

  // Watch for states to be loaded and prefill states if needed
  useEffect(() => {
    if (
      states.length > 0 &&
      initialLocation.current?.state &&
      initialLocation.current.state.length > 0 &&
      selectedCountry &&
      selectedStates.length === 0
    ) {
      const targetStateNames = initialLocation.current.state.map(s => s.toLowerCase());
      const matchingStates = states.filter(s => targetStateNames.includes(s.name.toLowerCase()));
      
      if (matchingStates.length > 0) {
        const stateIsoCodes = matchingStates.map(s => s.isoCode);
        setSelectedStates(stateIsoCodes);
        
        if (window.csc && window.csc.City) {
          const allCities: { name: string }[] = [];
          stateIsoCodes.forEach(iso => {
            const stateCities = window.csc!.City.getCitiesOfState(selectedCountry, iso);
            allCities.push(...stateCities);
          });
          
          // Deduplicate cities by name
          const uniqueCities = Array.from(new Map(allCities.map(item => [item.name, item])).values());
          setCities(uniqueCities);
        }
      }
    }
  }, [states, selectedCountry, selectedStates]);

  // Watch for cities to be loaded and prefill cities if needed
  useEffect(() => {
    if (
      cities.length > 0 &&
      initialLocation.current?.city &&
      initialLocation.current.city.length > 0 &&
      selectedStates.length > 0 &&
      selectedCities.length === 0
    ) {
      const targetCityNames = initialLocation.current.city.map(c => c.toLowerCase());
      const matchingCities = cities.filter(c => targetCityNames.includes(c.name.toLowerCase()));
      
      if (matchingCities.length > 0) {
        setSelectedCities(matchingCities.map(c => c.name));
      }
    }
  }, [cities, selectedStates, selectedCities]);

  const loadCountries = () => {
    if (typeof window !== "undefined" && window.csc) {
      try {
        const { Country } = window.csc;
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);
        setLoading(false);

        if (initialLocation.current) {
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

  const loadCitiesForStates = (countryIsoCode: string, stateIsoCodes: string[]) => {
    if (typeof window !== "undefined" && window.csc) {
      try {
        const { City } = window.csc;
        const allCities: { name: string }[] = [];
        stateIsoCodes.forEach(stateIso => {
          const stateCities = City.getCitiesOfState(countryIsoCode, stateIso);
          allCities.push(...stateCities);
        });
        const uniqueCities = Array.from(new Map(allCities.map(item => [item.name, item])).values());
        setCities(uniqueCities);
      } catch (error) {
        console.error("Error loading cities:", error);
      }
    }
  };

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
    script.onerror = () => setLoading(false);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      delete window.onCSCLoaded;
    };
  }, []);

  const handleCountryChange = (countryIsoCode: string) => {
    setSelectedCountry(countryIsoCode);
    setSelectedStates([]);
    setSelectedCities([]);
    setStates([]);
    setCities([]);

    if (countryIsoCode) {
      loadStates(countryIsoCode);
      const countryObj = countries.find((c) => c.isoCode === countryIsoCode);
      updateLocation(countryObj ? countryObj.name : "", [], []);
    } else {
      updateLocation("", [], []);
    }
  };

  const handleStateToggle = (stateIsoCode: string) => {
    let newSelectedStates = [...selectedStates];
    if (newSelectedStates.includes(stateIsoCode)) {
      newSelectedStates = newSelectedStates.filter(code => code !== stateIsoCode);
    } else {
      newSelectedStates.push(stateIsoCode);
    }
    
    setSelectedStates(newSelectedStates);
    setSelectedCities([]); // reset cities on state change
    setCities([]);

    if (newSelectedStates.length > 0 && selectedCountry) {
      loadCitiesForStates(selectedCountry, newSelectedStates);
    }
    
    const countryObj = countries.find((c) => c.isoCode === selectedCountry);
    const selectedStateNames = newSelectedStates
      .map(iso => states.find(s => s.isoCode === iso)?.name)
      .filter(Boolean) as string[];
      
    updateLocation(
      countryObj ? countryObj.name : "",
      selectedStateNames,
      []
    );
  };

  const handleCityToggle = (cityName: string) => {
    let newSelectedCities = [...selectedCities];
    if (newSelectedCities.includes(cityName)) {
      newSelectedCities = newSelectedCities.filter(name => name !== cityName);
    } else {
      newSelectedCities.push(cityName);
    }
    
    setSelectedCities(newSelectedCities);
    
    const countryObj = countries.find((c) => c.isoCode === selectedCountry);
    const selectedStateNames = selectedStates
      .map(iso => states.find(s => s.isoCode === iso)?.name)
      .filter(Boolean) as string[];
      
    updateLocation(
      countryObj ? countryObj.name : "",
      selectedStateNames,
      newSelectedCities
    );
  };

  const updateLocation = (country: string, stateNames: string[], cityNames: string[]) => {
    const locationData = {
      country: country || "",
      state: stateNames,
      city: cityNames,
    };
    isInternalChange.current = true;
    onChange(JSON.stringify(locationData));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
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
          <Label htmlFor="state">State (Multiple)</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between font-normal bg-background/50"
                disabled={!selectedCountry || loading || states.length === 0}
              >
                Select States
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
              {states.map((state) => (
                <DropdownMenuCheckboxItem
                  key={state.isoCode}
                  checked={selectedStates.includes(state.isoCode)}
                  onCheckedChange={() => handleStateToggle(state.isoCode)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {state.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedStates.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedStates.map((iso) => {
                const state = states.find((s) => s.isoCode === iso);
                return state ? (
                  <span key={iso} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm">
                    {state.name}
                    <button type="button" onClick={(e) => { e.preventDefault(); handleStateToggle(iso); }} className="hover:text-red-400 transition-colors bg-white/10 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City (Multiple)</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between font-normal bg-background/50"
                disabled={selectedStates.length === 0 || loading || cities.length === 0}
              >
                Select Cities
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
              {cities.map((city, index) => (
                <DropdownMenuCheckboxItem
                  key={`${city.name}-${index}`}
                  checked={selectedCities.includes(city.name)}
                  onCheckedChange={() => handleCityToggle(city.name)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {city.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedCities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedCities.map((cityName) => (
                <span key={cityName} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm">
                  {cityName}
                  <button type="button" onClick={(e) => { e.preventDefault(); handleCityToggle(cityName); }} className="hover:text-red-400 transition-colors bg-white/10 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
