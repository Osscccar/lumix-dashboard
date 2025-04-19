// src/components/questionnaire/DomainSearchInput.tsx
import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Check, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

type DomainSearchInputProps = {
  questionId: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

type DomainSuggestion = {
  name: string;
  available: boolean;
  price: number;
  currency: string;
};

export const DomainSearchInput = ({
  questionId,
  placeholder,
  value,
  onChange,
}: DomainSearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainSuggestion | null>(
    null
  );

  // Fetch domain suggestions when search query changes
  useEffect(() => {
    const fetchDomainSuggestions = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setIsSearching(true);
        setError("");

        const response = await fetch(
          `/api/domains/search?query=${encodeURIComponent(
            debouncedSearchQuery
          )}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to search domains");
        }

        const data = await response.json();
        setSuggestions(data.domains || []);
        setShowSuggestions(data.domains && data.domains.length > 0);
      } catch (err) {
        console.error("Domain search error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to search domains"
        );
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchDomainSuggestions();
  }, [debouncedSearchQuery]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle select domain
  const handleSelectDomain = (domain: DomainSuggestion) => {
    setSearchQuery(domain.name);
    onChange(domain.name);
    setSelectedDomain(domain);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={
            placeholder || "Search for a domain (e.g. yourbusiness.com)"
          }
          className="w-full bg-transparent text-white text-xl md:text-2xl py-4 pr-10 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600"
        />
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-neutral-500">
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Selected domain display */}
      {selectedDomain && (
        <div className="mt-3 bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-white font-medium">
              {selectedDomain.name}
            </span>
            <span className="ml-2 text-green-400 text-xs px-2 py-0.5 rounded-full bg-green-900/30 border border-green-800">
              Available
            </span>
          </div>
          <span className="text-[#F58327] font-medium">
            ${Number(selectedDomain.price).toFixed(2)} {selectedDomain.currency}
          </span>
        </div>
      )}

      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.name}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
              onClick={() => handleSelectDomain(suggestion)}
            >
              <div className="flex items-center">
                <span className="text-white text-lg mr-2">
                  {suggestion.name}
                </span>
                <span className="text-green-400 text-xs px-2 py-0.5 rounded-full bg-green-900/30 border border-green-800">
                  Available
                </span>
              </div>
              <span className="text-[#F58327]">
                ${Number(suggestion.price).toFixed(2)} {suggestion.currency}
              </span>
            </div>
          ))}
        </div>
      )}

      {searchQuery &&
        !isSearching &&
        debouncedSearchQuery.length >= 2 &&
        suggestions.length === 0 &&
        !error && (
          <div className="mt-2 text-yellow-500 text-sm">
            No domains found under $15 AUD. Try a different search.
          </div>
        )}

      <div className="mt-2 text-xs text-gray-500">
        Search for a domain name for your website (included free with your
        plan).
      </div>
    </div>
  );
};
