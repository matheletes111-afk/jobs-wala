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
    // If csc is already loaded globally, load countries directly
    if (window.csc) {
      scriptLoaded.current = true;
      loadCountries();
      return;
    }

    const handleLoad = () => {
      scriptLoaded.current = true;
      loadCountries();
    };

    // Initialize the global callback queue if not already present
    if (!window.onCSCLoaded) {
      (window as any).cscCallbacks = [];
      window.onCSCLoaded = () => {
        const queue = (window as any).cscCallbacks || [];
        queue.forEach((cb: () => void) => cb());
      };
    }

    // Register this component's load callback
    if ((window as any).cscCallbacks) {
      (window as any).cscCallbacks.push(handleLoad);
    }

    // Only create and append the script once
    let script = document.getElementById("csc-script-loader") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "csc-script-loader";
      script.type = "module";
      script.innerHTML = `
        import { Country, State, City } from 'https://cdn.jsdelivr.net/npm/country-state-city@3.1.0/+esm';
        window.csc = { Country, State, City };
        if (window.onCSCLoaded) window.onCSCLoaded();
      `;
      document.head.appendChild(script);
    }

    return () => {
      // Clean up this component's callback when unmounted
      if ((window as any).cscCallbacks) {
        (window as any).cscCallbacks = (window as any).cscCallbacks.filter((cb: any) => cb !== handleLoad);
      }
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
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Country</Label>
          <Select
            value={selectedCountry}
            onValueChange={handleCountryChange}
            disabled={loading}
          >
            <SelectTrigger id="country" className="w-full h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-700 focus:ring-blue-500/20 shadow-sm">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 shadow-lg">
              {countries.map((country) => (
                <SelectItem key={country.isoCode} value={country.isoCode} className="text-xs font-semibold">
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">State (Multiple)</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="h-10 w-full justify-between rounded-xl border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm"
                disabled={!selectedCountry || loading || states.length === 0}
              >
                <span className="truncate">
                  {selectedStates.length > 0 
                    ? `${selectedStates.length} Selected`
                    : "Select States"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto bg-white border-slate-200 shadow-lg">
              {states.map((state) => (
                <DropdownMenuCheckboxItem
                  key={state.isoCode}
                  checked={selectedStates.includes(state.isoCode)}
                  onCheckedChange={() => handleStateToggle(state.isoCode)}
                  onSelect={(e) => e.preventDefault()}
                  className="text-xs font-semibold"
                >
                  {state.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">City (Multiple)</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="h-10 w-full justify-between rounded-xl border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm"
                disabled={selectedStates.length === 0 || loading || cities.length === 0}
              >
                <span className="truncate">
                  {selectedCities.length > 0 
                    ? `${selectedCities.length} Selected`
                    : "Select Cities"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto bg-white border-slate-200 shadow-lg">
              {cities.map((city, index) => (
                <DropdownMenuCheckboxItem
                  key={`${city.name}-${index}`}
                  checked={selectedCities.includes(city.name)}
                  onCheckedChange={() => handleCityToggle(city.name)}
                  onSelect={(e) => e.preventDefault()}
                  className="text-xs font-semibold"
                >
                  {city.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Selected location tags/pills */}
      {(selectedStates.length > 0 || selectedCities.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-3">
          {selectedStates.map((iso) => {
            const state = states.find((s) => s.isoCode === iso);
            return state ? (
              <span key={iso} className="flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-150 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                {state.name}
                <button type="button" onClick={(e) => { e.preventDefault(); handleStateToggle(iso); }} className="hover:text-red-500 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
          {selectedCities.map((cityName) => (
            <span key={cityName} className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-150 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              {cityName}
              <button type="button" onClick={(e) => { e.preventDefault(); handleCityToggle(cityName); }} className="hover:text-red-500 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
