import { useState, useEffect, useRef } from 'react';
import { Search, Pill, Clock, CheckCircle } from 'lucide-react';
import useClinicalTemplateStore from '../../store/clinicalTemplateStore';

/**
 * Smart Drug Autocomplete Component
 * 
 * Features:
 * - Real-time search as you type
 * - Shows drug name, strength, frequency, duration
 * - One-click to add complete prescription
 * - Ranked by popularity (most prescribed first)
 */
const SmartDrugAutocomplete = ({ onSelect, placeholder = "Search medications..." }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { searchResults, searchDrugRegimens, recordRegimenUsage } = useClinicalTemplateStore();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchDrugRegimens(query);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, searchDrugRegimens]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[highlightedIndex]) {
          handleSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (regimen) => {
    // Record usage for popularity ranking
    recordRegimenUsage(regimen.id);
    
    // Transform to prescription format
    const prescription = {
      drugName: regimen.drugName,
      genericName: regimen.genericName,
      strength: regimen.strength,
      dosageForm: regimen.dosageForm,
      route: regimen.route || 'ORAL',
      frequency: regimen.frequency,
      frequencyText: regimen.frequencyText,
      duration: regimen.duration,
      durationUnit: regimen.durationUnit || 'days',
      instructions: regimen.instructions,
      indication: regimen.indication,
      drugId: regimen.drugId,
      displayText: regimen.displayText,
    };

    onSelect(prescription);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  const getCategoryColor = (category) => {
    const colors = {
      ANTIBIOTIC: 'bg-blue-100 text-blue-800',
      ANTIMALARIAL: 'bg-green-100 text-green-800',
      ANALGESIC: 'bg-yellow-100 text-yellow-800',
      NSAID: 'bg-orange-100 text-orange-800',
      PPI: 'bg-purple-100 text-purple-800',
      ANTIHYPERTENSIVE: 'bg-red-100 text-red-800',
      ACE_INHIBITOR: 'bg-red-100 text-red-800',
      ANTIDIABETIC: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {searchResults.length} results found - Click to add prescription
            </span>
          </div>
          
          {searchResults.map((regimen, index) => (
            <div
              key={regimen.id}
              onClick={() => handleSelect(regimen)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Drug Name & Strength */}
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900">
                      {regimen.drugName}
                    </span>
                    <span className="text-sm text-gray-600">
                      {regimen.strength}
                    </span>
                    {regimen.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(regimen.category)}`}>
                        {regimen.category.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Full Prescription Display */}
                  <div className="mt-1 ml-6 text-sm text-gray-700 font-medium">
                    {regimen.displayText}
                  </div>

                  {/* Details */}
                  <div className="mt-1 ml-6 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {regimen.frequencyText}
                    </span>
                    {regimen.duration && (
                      <span>
                        × {regimen.duration} {regimen.durationUnit}
                      </span>
                    )}
                    {regimen.route && regimen.route !== 'ORAL' && (
                      <span className="text-orange-600">
                        {regimen.route}
                      </span>
                    )}
                  </div>

                  {/* Instructions */}
                  {regimen.instructions && (
                    <div className="mt-1 ml-6 text-xs text-gray-500 italic">
                      {regimen.instructions}
                    </div>
                  )}
                </div>

                {/* Usage indicator */}
                {regimen.usageCount > 0 && (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {regimen.usageCount}×
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query.length >= 2 && searchResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No matching medications found</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default SmartDrugAutocomplete;
