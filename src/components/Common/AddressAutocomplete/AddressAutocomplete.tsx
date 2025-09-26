'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './AddressAutocomplete.module.scss';

export interface AddressComponents {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  hasStreetView?: boolean;
}

interface AddressSuggestion {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  lat: number;
  lon: number;
  hasStreetView?: boolean;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (addressComponents: AddressComponents) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  hideDropdown?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Enter street address",
  className = "",
  disabled = false,
  hideDropdown = false
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(2, 15));

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.trim().length < 2 || hideDropdown) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use internal API endpoint
      const response = await fetch('/api/internal/address-autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
          sessionToken: sessionToken,
        }),
      });

      if (!response.ok) {
        console.error('Address API error:', response.status, response.statusText);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const data = await response.json();

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(data.suggestions.length > 0);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, hideDropdown]);

  // Debounce the API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Skip API call if we just selected a suggestion
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }

      if (value && value.trim().length >= 2) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, fetchSuggestions]);

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    // Mark that we just selected a suggestion to prevent dropdown reappearing
    justSelectedRef.current = true;

    // Transform the suggestion to AddressComponents format
    const addressComponents: AddressComponents = {
      formatted_address: suggestion.formatted,
      locality: suggestion.city,
      administrative_area_level_1: suggestion.state,
      postal_code: suggestion.postcode,
      country: suggestion.country,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
      hasStreetView: suggestion.hasStreetView
    };

    // Parse street address components if available
    if (suggestion.street) {
      const streetParts = suggestion.street.split(' ');
      if (streetParts.length >= 2) {
        // Check if first part is a number (street number)
        if (!isNaN(parseInt(streetParts[0]))) {
          addressComponents.street_number = streetParts[0];
          addressComponents.route = streetParts.slice(1).join(' ');
        } else {
          addressComponents.route = suggestion.street;
        }
      } else {
        addressComponents.route = suggestion.street;
      }
    }

    // Only put the street address in the address field, not the full formatted address
    const streetAddress = suggestion.street || addressComponents.formatted_address || '';
    onChange(streetAddress);
    onAddressSelect(addressComponents);

    // Simply close the dropdown after selection
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Reset selection when input changes
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={`${styles.autocompleteContainer} ${className}`} ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={styles.autocompleteInput}
        autoComplete="off"
      />

      {isLoading && (
        <div className={styles.loadingIndicator}>
          Loading address suggestions...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className={styles.suggestionsDropdown}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`${styles.suggestionItem} ${
                index === selectedIndex ? styles.selected : ''
              }`}
              onMouseDown={(e) => {
                // Prevent input blur when clicking suggestion
                e.preventDefault();
                handleSuggestionSelect(suggestion);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className={styles.suggestionMain}>
                {suggestion.street && (
                  <span className={styles.streetAddress}>{suggestion.street}</span>
                )}
              </div>
              <div className={styles.suggestionSecondary}>
                {[suggestion.city, suggestion.state, suggestion.postcode]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}