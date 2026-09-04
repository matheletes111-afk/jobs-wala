"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, Search, X, RotateCcw } from "lucide-react";
import { Country, State, City } from "country-state-city";

interface LocationDropdownProps {
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
}

const MAX_DISPLAY_ITEMS = 60;

export default function LocationDropdown({
  value,
  onChange,
  error,
}: LocationDropdownProps) {
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Search filter states for dropdown menus
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const isInternalChange = useRef(false);

  // States available for selected country
  const states = useMemo(() => {
    if (!selectedCountry) return [];
    return State.getStatesOfCountry(selectedCountry);
  }, [selectedCountry]);

  // Cities available for selected states in selected country
  const allCities = useMemo(() => {
    if (!selectedCountry || selectedStates.length === 0) return [];
    const allCitiesList: Array<{ name: string }> = [];
    selectedStates.forEach((stateIso) => {
      const stateCities = City.getCitiesOfState(selectedCountry, stateIso);
      allCitiesList.push(...stateCities);
    });
    // Deduplicate cities by name
    return Array.from(
      new Map(allCitiesList.map((item) => [item.name, item])).values()
    );
  }, [selectedCountry, selectedStates]);

  // Filtered Countries
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return allCountries.slice(0, MAX_DISPLAY_ITEMS);
    return allCountries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.isoCode.toLowerCase().includes(q)
      )
      .slice(0, MAX_DISPLAY_ITEMS);
  }, [allCountries, countrySearch]);

  // Filtered States
  const filteredStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    if (!q) return states;
    return states.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.isoCode.toLowerCase().includes(q)
    );
  }, [states, stateSearch]);

  // Filtered and Windowed Cities (High performance on mobile)
  const { visibleCities, totalCityMatches } = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    let matches = allCities;
    if (q) {
      matches = allCities.filter((c) => c.name.toLowerCase().includes(q));
    }
    // Prioritize selected cities at the top so user can always see/toggle them
    const selectedSet = new Set(selectedCities);
    const selectedItems = matches.filter((c) => selectedSet.has(c.name));
    const unselectedItems = matches.filter((c) => !selectedSet.has(c.name));
    const ordered = [...selectedItems, ...unselectedItems];

    return {
      visibleCities: ordered.slice(0, MAX_DISPLAY_ITEMS),
      totalCityMatches: matches.length,
    };
  }, [allCities, citySearch, selectedCities]);

  // Synchronize state from value prop
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    if (!value || !value.trim()) {
      setSelectedCountry("");
      setSelectedStates([]);
      setSelectedCities([]);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        let countryIso = "";
        if (parsed.country) {
          const matchCountry = allCountries.find(
            (c) =>
              c.name.toLowerCase() === parsed.country.toLowerCase() ||
              c.isoCode.toLowerCase() === parsed.country.toLowerCase()
          );
          countryIso = matchCountry ? matchCountry.isoCode : parsed.country;
        }

        let sStates: string[] = [];
        if (parsed.state) {
          const rawStates = Array.isArray(parsed.state)
            ? parsed.state
            : [parsed.state];
          if (countryIso) {
            const countryStates = State.getStatesOfCountry(countryIso);
            sStates = rawStates
              .map((st: string) => {
                const matchState = countryStates.find(
                  (s) =>
                    s.name.toLowerCase() === String(st).toLowerCase() ||
                    s.isoCode.toLowerCase() === String(st).toLowerCase()
                );
                return matchState ? matchState.isoCode : String(st);
              })
              .filter(Boolean);
          } else {
            sStates = rawStates.map(String);
          }
        }

        let sCities: string[] = [];
        if (parsed.city) {
          sCities = (Array.isArray(parsed.city) ? parsed.city : [parsed.city])
            .map(String)
            .filter(Boolean);
        }

        setSelectedCountry(countryIso);
        setSelectedStates(sStates);
        setSelectedCities(sCities);
        return;
      }
    } catch {
      // Raw string (e.g. "Bangalore" or "Maharashtra" or "India")
      const raw = decodeURIComponent(value).trim();
      if (!raw) return;

      // Check if it matches a country
      const matchCountry = allCountries.find(
        (c) => c.name.toLowerCase() === raw.toLowerCase()
      );
      if (matchCountry) {
        setSelectedCountry(matchCountry.isoCode);
        setSelectedStates([]);
        setSelectedCities([]);
        return;
      }

      // Check default country (India) for matching states or cities
      const defaultCountryStates = State.getStatesOfCountry("IN");
      const matchState = defaultCountryStates.find(
        (s) => s.name.toLowerCase() === raw.toLowerCase()
      );
      if (matchState) {
        setSelectedCountry("IN");
        setSelectedStates([matchState.isoCode]);
        setSelectedCities([]);
        return;
      }
    }
  }, [value, allCountries]);

  const emitChange = (
    countryIso: string,
    stateIsos: string[],
    cityNames: string[]
  ) => {
    const countryObj = allCountries.find((c) => c.isoCode === countryIso);
    const countryName = countryObj ? countryObj.name : countryIso;

    const countryStates = countryIso
      ? State.getStatesOfCountry(countryIso)
      : [];
    const stateNames = stateIsos.map((iso) => {
      const st = countryStates.find((s) => s.isoCode === iso);
      return st ? st.name : iso;
    });

    const locationData = {
      country: countryName || "",
      state: stateNames,
      city: cityNames,
    };

    isInternalChange.current = true;
    if (!countryName && stateNames.length === 0 && cityNames.length === 0) {
      onChange("");
    } else {
      onChange(JSON.stringify(locationData));
    }
  };

  const handleCountryChange = (countryIsoCode: string) => {
    setSelectedCountry(countryIsoCode);
    setSelectedStates([]);
    setSelectedCities([]);
    setCountrySearch("");
    setStateSearch("");
    setCitySearch("");
    emitChange(countryIsoCode, [], []);
  };

  const handleStateToggle = (stateIso: string) => {
    const isSelected = selectedStates.includes(stateIso);
    let nextStates: string[];
    if (isSelected) {
      nextStates = selectedStates.filter((s) => s !== stateIso);
    } else {
      nextStates = [...selectedStates, stateIso];
    }
    setSelectedStates(nextStates);
    setSelectedCities([]); // reset cities when state selection changes
    setCitySearch("");
    emitChange(selectedCountry, nextStates, []);
  };

  const handleCityToggle = (cityName: string) => {
    const isSelected = selectedCities.includes(cityName);
    let nextCities: string[];
    if (isSelected) {
      nextCities = selectedCities.filter((c) => c !== cityName);
    } else {
      nextCities = [...selectedCities, cityName];
    }
    setSelectedCities(nextCities);
    emitChange(selectedCountry, selectedStates, nextCities);
  };

  const selectedCountryObj = allCountries.find((c) => c.isoCode === selectedCountry);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Country Selector with Search */}
        <div className="space-y-1.5">
          <Label
            htmlFor="country"
            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            Country
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                id="country"
                className="h-10 w-full justify-between rounded-xl border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm"
              >
                <span className="truncate">
                  {selectedCountryObj ? selectedCountryObj.name : "Select Country"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[280px] sm:w-[300px] max-h-80 p-0 flex flex-col bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden z-50"
            >
              {/* Country Search Bar */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {countrySearch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCountrySearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Country Options List */}
              <div className="overflow-y-auto max-h-60 p-1 divide-y divide-slate-50">
                {filteredCountries.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No countries found</p>
                ) : (
                  filteredCountries.map((c) => {
                    const isSelected = selectedCountry === c.isoCode;
                    return (
                      <button
                        key={c.isoCode}
                        type="button"
                        onClick={() => handleCountryChange(c.isoCode)}
                        className={`w-full px-3 py-2 text-xs font-semibold text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 2. State Selector with Search */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="state"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              State (Multiple)
            </Label>
            {selectedStates.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStates([]);
                  setSelectedCities([]);
                  emitChange(selectedCountry, [], []);
                }}
                className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Clear
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                id="state"
                className="h-10 w-full justify-between rounded-xl border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm"
                disabled={!selectedCountry || states.length === 0}
              >
                <span className="truncate">
                  {selectedStates.length > 0
                    ? `${selectedStates.length} Selected`
                    : states.length === 0
                    ? "No States Available"
                    : "Select States"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[280px] sm:w-[300px] max-h-80 p-0 flex flex-col bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden z-50"
            >
              {/* State Search Bar */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    placeholder="Search state..."
                    className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {stateSearch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStateSearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* State Options List */}
              <div className="overflow-y-auto max-h-60 p-1 divide-y divide-slate-50">
                {filteredStates.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No states found</p>
                ) : (
                  filteredStates.map((st) => {
                    const isSelected = selectedStates.includes(st.isoCode);
                    return (
                      <button
                        key={st.isoCode}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStateToggle(st.isoCode);
                        }}
                        className={`w-full px-3 py-2 text-xs font-semibold text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{st.name}</span>
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 3. City Selector with Instant Search & Windowed Rendering */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="city"
              className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              City (Multiple)
            </Label>
            {selectedCities.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCities([]);
                  emitChange(selectedCountry, selectedStates, []);
                }}
                className="text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Clear
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                id="city"
                className="h-10 w-full justify-between rounded-xl border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm"
                disabled={selectedStates.length === 0 || allCities.length === 0}
              >
                <span className="truncate">
                  {selectedCities.length > 0
                    ? `${selectedCities.length} Selected`
                    : selectedStates.length === 0
                    ? "Select State First"
                    : allCities.length === 0
                    ? "No Cities Available"
                    : "Select Cities"}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[280px] sm:w-[300px] max-h-80 p-0 flex flex-col bg-white border-slate-200 shadow-xl rounded-xl overflow-hidden z-50"
            >
              {/* City Search Bar */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Search city (e.g. Bangalore)..."
                    className="w-full h-8 pl-8 pr-7 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {citySearch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCitySearch("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* City Options List */}
              <div className="overflow-y-auto max-h-60 p-1 divide-y divide-slate-50">
                {visibleCities.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No cities found</p>
                ) : (
                  visibleCities.map((city, index) => {
                    const isSelected = selectedCities.includes(city.name);
                    return (
                      <button
                        key={`${city.name}-${index}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleCityToggle(city.name);
                        }}
                        className={`w-full px-3 py-2 text-xs font-semibold text-left flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-800 font-bold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{city.name}</span>
                        <div
                          className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Informative Footer for high item counts */}
              {totalCityMatches > MAX_DISPLAY_ITEMS && (
                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] font-medium text-slate-400 text-center">
                  Showing {MAX_DISPLAY_ITEMS} of {totalCityMatches} cities • Type to filter
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Selected location tags/pills with smooth animations */}
      {(selectedStates.length > 0 || selectedCities.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-3">
          {selectedStates.map((iso) => {
            const st = states.find((s) => s.isoCode === iso);
            const displayName = st ? st.name : iso;
            return (
              <span
                key={iso}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm"
              >
                <span>{displayName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStateToggle(iso);
                  }}
                  className="hover:text-red-600 transition-colors p-0.5 rounded hover:bg-blue-100/50 cursor-pointer"
                  aria-label={`Remove ${displayName}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
          {selectedCities.map((cityName) => (
            <span
              key={cityName}
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm"
            >
              <span>{cityName}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCityToggle(cityName);
                }}
                className="hover:text-red-600 transition-colors p-0.5 rounded hover:bg-emerald-100/50 cursor-pointer"
                aria-label={`Remove ${cityName}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
