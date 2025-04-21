// src/components/questionnaire/DomainSearchInput.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Loader2,
  Globe,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

// Common TLDs to detect and strip from search
const COMMON_TLDS = [
  ".com",
  ".net",
  ".org",
  ".io",
  ".co",
  ".me",
  ".app",
  ".dev",
  ".xyz",
  ".info",
  ".site",
  ".online",
  ".biz",
  ".store",
  ".shop",
];

export const DomainSearchInput = (props: DomainSearchInputProps) => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DomainSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Increase debounce delay from 500ms to 2000ms (2 seconds)
  const debouncedSearchQuery = useDebounce(searchQuery, 2000);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainSuggestion | null>(
    null
  );
  const [hasSearched, setHasSearched] = useState(false);

  // Custom domain state
  const [showCustomDomainInput, setShowCustomDomainInput] = useState(false);
  const [customDomain, setCustomDomain] = useState("");

  // Initialize component based on provided value
  useEffect(() => {
    if (!props.value) return;

    if (props.value.startsWith("customDomain:")) {
      // This is a custom domain
      const domainValue = props.value.replace("customDomain:", "");
      setCustomDomain(domainValue);
      setShowCustomDomainInput(true);
      setSelectedDomain(null);
      setSearchQuery("");
    } else {
      // This is a searched domain
      setSearchQuery(props.value);
      setCustomDomain("");
      setShowCustomDomainInput(false);

      // Try to find domain in suggestions if they exist
      const foundDomain = suggestions.find((s) => s.name === props.value);
      if (foundDomain) {
        setSelectedDomain(foundDomain);
      }
    }
  }, [props.value, suggestions]);

  // Strip TLDs from search query to get the base domain name
  const getCleanSearchQuery = (query: string): string => {
    // Convert to lowercase for case-insensitive matching
    let cleanQuery = query.toLowerCase().trim();

    // Remove common prefixes
    if (cleanQuery.startsWith("www.")) {
      cleanQuery = cleanQuery.substring(4);
    }

    // Strip TLD if present
    for (const tld of COMMON_TLDS) {
      if (cleanQuery.endsWith(tld)) {
        cleanQuery = cleanQuery.substring(0, cleanQuery.length - tld.length);
        break; // Stop after finding first match
      }
    }

    return cleanQuery;
  };

  // Fetch domain suggestions when search query changes
  useEffect(() => {
    // If no search query or too short, clear suggestions and return
    if (
      !debouncedSearchQuery ||
      debouncedSearchQuery.length < 2 ||
      showCustomDomainInput
    ) {
      setSuggestions([]);
      return;
    }

    // Skip search if we already have a selected domain to prevent re-search
    // But only if we've already searched before (hasSearched flag)
    if (selectedDomain && hasSearched) {
      return;
    }

    const fetchDomainSuggestions = async () => {
      try {
        setIsSearching(true);
        setError("");

        // Clean up the search query to handle cases where users enter full domains
        const cleanedQuery = getCleanSearchQuery(debouncedSearchQuery);

        // Only search if we have a valid query after cleaning
        if (cleanedQuery.length < 2) {
          setIsSearching(false);
          setSuggestions([]);
          return;
        }

        console.log(`Searching domains for: ${cleanedQuery}`);

        const response = await fetch(
          `/api/domains/search?query=${encodeURIComponent(cleanedQuery)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to search domains");
        }

        const data = await response.json();
        setSuggestions(data.domains || []);
        setShowSuggestions(data.domains && data.domains.length > 0);
        setHasSearched(true);

        // If we had a selected domain but changed the search, clear it
        if (
          selectedDomain &&
          !selectedDomain.name.includes(cleanedQuery.toLowerCase())
        ) {
          setSelectedDomain(null);
        }
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
  }, [
    debouncedSearchQuery,
    selectedDomain,
    showCustomDomainInput,
    hasSearched,
  ]);

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

  // Handle selecting a domain from suggestions
  const handleSelectDomain = (domain: DomainSuggestion) => {
    setSearchQuery(domain.name);
    props.onChange(domain.name); // Store normal domain directly
    setSelectedDomain(domain);
    setShowSuggestions(false);
  };

  // When user starts typing, we should clear the selected domain and hasSearched flag
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // If the user modifies the search query, clear the selected domain and allow searching again
    if (newValue !== selectedDomain?.name) {
      setSelectedDomain(null);
      // Only reset hasSearched if the value significantly changes
      if (getCleanSearchQuery(newValue) !== getCleanSearchQuery(searchQuery)) {
        setHasSearched(false);
      }
    }
    setSearchQuery(newValue);
  };

  // Clear domain search input
  const handleClearSearchInput = () => {
    setSearchQuery("");
    props.onChange("");
    setSelectedDomain(null);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  // Handle custom domain input change
  const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDomain(value);
    // Store with special prefix to identify it as a custom domain
    props.onChange(value ? `customDomain:${value}` : "");
  };

  // Clear custom domain input
  const handleClearCustomDomain = () => {
    setCustomDomain("");
    props.onChange("");
  };

  // Toggle between search and custom domain input
  const toggleCustomDomainInput = () => {
    const newState = !showCustomDomainInput;
    setShowCustomDomainInput(newState);

    if (newState) {
      // Switching to custom domain input
      setSelectedDomain(null);
      setSearchQuery("");
      props.onChange(customDomain ? `customDomain:${customDomain}` : "");
    } else {
      // Switching to domain search
      setCustomDomain("");
      props.onChange(selectedDomain ? selectedDomain.name : searchQuery);
    }
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Render the search input section
  const renderSearchInput = () => {
    const elements = [];

    // Search input field
    elements.push(
      React.createElement(
        "div",
        { key: "search-input", className: "relative" },
        React.createElement("input", {
          ref: inputRef,
          type: "text",
          value: searchQuery,
          onChange: handleSearchInputChange,
          onFocus: () => suggestions.length > 0 && setShowSuggestions(true),
          placeholder:
            props.placeholder || "Search for a domain (e.g. yourbusiness.com)",
          className:
            "w-full bg-transparent text-white text-xl md:text-2xl py-4 pr-10 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600",
        }),
        React.createElement(
          "div",
          {
            className:
              "absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center text-neutral-500",
          },
          searchQuery &&
            React.createElement(
              "button",
              {
                onClick: handleClearSearchInput,
                className:
                  "p-1 mr-1 hover:bg-gray-800 rounded-full transition-colors",
                "aria-label": "Clear search",
              },
              React.createElement(X, {
                className: "h-4 w-4 text-gray-400 hover:text-white",
              })
            ),
          isSearching
            ? React.createElement(Loader2, {
                className: "h-5 w-5 animate-spin",
              })
            : React.createElement(Search, { className: "h-5 w-5" })
        )
      )
    );

    // Selected domain display
    if (selectedDomain) {
      elements.push(
        React.createElement(
          "div",
          {
            key: "selected-domain",
            className:
              "mt-3 bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex justify-between items-center",
          },
          React.createElement(
            "div",
            { className: "flex items-center" },
            React.createElement(Globe, {
              className: "h-5 w-5 text-[#F58327] mr-2",
            }),
            React.createElement(
              "span",
              { className: "text-white font-medium" },
              selectedDomain.name
            ),
            React.createElement(
              "span",
              {
                className:
                  "ml-2 text-green-400 text-xs px-2 py-0.5 rounded-full bg-green-900/30 border border-green-800",
              },
              "Available"
            )
          ),
          React.createElement(
            "span",
            { className: "text-[#F58327] font-medium" },
            formatPrice(selectedDomain.price)
          )
        )
      );
    }

    // Error message
    if (error) {
      elements.push(
        React.createElement(
          "div",
          {
            key: "error-message",
            className: "mt-2 text-red-500 text-sm flex items-center",
          },
          React.createElement(AlertTriangle, {
            className: "h-4 w-4 mr-1 flex-shrink-0",
          }),
          React.createElement("span", {}, error)
        )
      );
    }

    // Suggestions dropdown
    if (showSuggestions && suggestions.length > 0) {
      elements.push(
        React.createElement(
          "div",
          {
            key: "suggestions",
            ref: suggestionsRef,
            className:
              "absolute z-10 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto",
          },
          suggestions.map((suggestion) =>
            React.createElement(
              "div",
              {
                key: suggestion.name,
                className:
                  "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-700 transition-colors duration-200",
                onClick: () => handleSelectDomain(suggestion),
              },
              React.createElement(
                "div",
                { className: "flex items-center" },
                React.createElement(
                  "span",
                  { className: "text-white text-lg mr-2" },
                  suggestion.name
                ),
                React.createElement(
                  "span",
                  {
                    className:
                      "text-green-400 text-xs px-2 py-0.5 rounded-full bg-green-900/30 border border-green-800",
                  },
                  "Available"
                )
              ),
              React.createElement(
                "span",
                { className: "text-[#F58327]" },
                formatPrice(suggestion.price)
              )
            )
          )
        )
      );
    }

    // Show searching message when waiting for results
    if (isSearching) {
      elements.push(
        React.createElement(
          "div",
          {
            key: "searching-message",
            className: "mt-2 text-gray-400 text-sm flex items-center",
          },
          React.createElement(Loader2, {
            className: "h-4 w-4 mr-1 animate-spin",
          }),
          "Searching for domains..."
        )
      );
    }
    // No results message
    else if (
      searchQuery &&
      !isSearching &&
      debouncedSearchQuery.length >= 2 &&
      suggestions.length === 0 &&
      !error &&
      hasSearched
    ) {
      elements.push(
        React.createElement(
          "div",
          {
            key: "no-results",
            className: "mt-2 text-yellow-500 text-sm flex items-center",
          },
          React.createElement(AlertTriangle, { className: "h-4 w-4 mr-1" }),
          "No domains found under $15 AUD. Try a different search."
        )
      );
    }
    // Waiting for user to finish typing message
    else if (
      searchQuery &&
      searchQuery.length >= 2 &&
      !isSearching &&
      !hasSearched &&
      !selectedDomain
    ) {
      elements.push(
        React.createElement(
          "div",
          {
            key: "waiting-message",
            className: "mt-2 text-gray-400 text-sm flex items-center",
          },
          "Finish typing to search for domains..."
        )
      );
    }

    return elements;
  };

  // Render the custom domain input section
  const renderCustomDomainInput = () => {
    return React.createElement(
      "div",
      { className: "relative" },
      React.createElement(
        "div",
        { className: "flex items-center" },
        React.createElement(Globe, {
          className: "h-5 w-5 text-[#F58327] mr-2",
        }),
        React.createElement("input", {
          type: "text",
          value: customDomain,
          onChange: handleCustomDomainChange,
          placeholder: "Enter your existing domain (e.g. yourbusiness.com)",
          className:
            "w-full bg-transparent text-white text-xl md:text-2xl py-4 pr-10 border-b-2 border-neutral-800 focus:border-[#F58327] focus:outline-none transition-all duration-200 placeholder-neutral-600",
        }),
        React.createElement(
          "div",
          { className: "absolute right-0 top-1/2 transform -translate-y-1/2" },
          customDomain &&
            React.createElement(
              "button",
              {
                onClick: handleClearCustomDomain,
                className:
                  "p-1 hover:bg-gray-800 rounded-full transition-colors",
                "aria-label": "Clear domain",
              },
              React.createElement(X, {
                className: "h-4 w-4 text-gray-400 hover:text-white",
              })
            )
        )
      )
    );
  };

  // Root element
  return React.createElement(
    "div",
    { className: "relative" },
    // Main content - either search or custom domain input
    !showCustomDomainInput ? renderSearchInput() : renderCustomDomainInput(),

    // Toggle button
    React.createElement(
      "button",
      {
        onClick: toggleCustomDomainInput,
        className:
          "mt-4 flex items-center text-[#F58327] hover:text-[#e67016] transition-colors text-sm",
      },
      showCustomDomainInput
        ? [
            React.createElement(ChevronUp, {
              key: "icon",
              className: "h-4 w-4 mr-1",
            }),
            "Search for a new domain instead",
          ]
        : [
            React.createElement(ChevronDown, {
              key: "icon",
              className: "h-4 w-4 mr-1",
            }),
            "Already have a domain? Add it here",
          ]
    ),

    // Helper text
    React.createElement(
      "div",
      { className: "mt-2 text-xs text-gray-500" },
      showCustomDomainInput
        ? "If you don't have a domain and prefer not to use a free one, simply click continue to proceed."
        : "If you don't have a domain and prefer not to use a free one, simply click continue to proceed."
    )
  );
};
