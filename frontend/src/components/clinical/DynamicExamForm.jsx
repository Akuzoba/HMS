import { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import useClinicalTemplateStore from '../../store/clinicalTemplateStore';

/**
 * Dynamic Physical Examination Form
 * 
 * Features:
 * - Shows relevant exam sections based on chief complaint
 * - Auto-populate with normal findings
 * - Structured data entry with dropdowns
 * - Generate narrative text from selections
 */
const DynamicExamForm = ({ 
  chiefComplaint,
  initialData = {},
  onChange,
  className = '' 
}) => {
  const [sections, setSections] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [examData, setExamData] = useState(initialData);
  const [narrativeText, setNarrativeText] = useState('');

  const { getRelevantExamSections, getExamSections, isLoading } = useClinicalTemplateStore();

  // Load relevant sections based on chief complaint
  useEffect(() => {
    const loadSections = async () => {
      try {
        let loadedSections;
        if (chiefComplaint) {
          loadedSections = await getRelevantExamSections(chiefComplaint);
        } else {
          loadedSections = await getExamSections();
        }
        setSections(loadedSections);
        
        // Auto-expand required sections
        const requiredIds = new Set(
          loadedSections.filter((s) => s.isRequired).map((s) => s.sectionCode || s.id)
        );
        setExpandedSections(requiredIds);
      } catch (error) {
        console.error('Error loading exam sections:', error);
      }
    };
    
    loadSections();
  }, [chiefComplaint, getRelevantExamSections, getExamSections]);

  // Parse fields from JSON
  const parseFields = (fieldsJson) => {
    try {
      return typeof fieldsJson === 'string' ? JSON.parse(fieldsJson) : fieldsJson;
    } catch {
      return [];
    }
  };

  // Generate narrative text from exam data
  useEffect(() => {
    const narratives = [];
    
    sections.forEach((section) => {
      const sectionCode = section.sectionCode || section.id;
      const sectionData = examData[sectionCode];
      
      if (sectionData && Object.keys(sectionData).length > 0) {
        // Check if using default findings
        if (sectionData._useDefaults && section.defaultFindings) {
          narratives.push(`**${section.sectionName}:** ${section.defaultFindings}`);
        } else {
          // Build narrative from selected values
          const fields = parseFields(section.fields);
          const fieldNarratives = [];
          
          fields.forEach((field) => {
            const value = sectionData[field.name];
            if (value !== undefined && value !== null && value !== '') {
              const displayValue = Array.isArray(value) ? value.join(', ') : value;
              fieldNarratives.push(`${field.label}: ${displayValue}`);
            }
          });
          
          if (fieldNarratives.length > 0) {
            narratives.push(`**${section.sectionName}:** ${fieldNarratives.join('. ')}.`);
          }
        }
      }
    });
    
    setNarrativeText(narratives.join('\n\n'));
    
    // Notify parent of changes
    if (onChange) {
      onChange({ data: examData, narrative: narratives.join('\n\n') });
    }
  }, [examData, sections, onChange]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Handle field value change
  const handleFieldChange = (sectionCode, fieldName, value) => {
    setExamData((prev) => ({
      ...prev,
      [sectionCode]: {
        ...prev[sectionCode],
        [fieldName]: value,
        _useDefaults: false,
      },
    }));
  };

  // Handle multiselect
  const handleMultiselectChange = (sectionCode, fieldName, option) => {
    setExamData((prev) => {
      const currentValues = prev[sectionCode]?.[fieldName] || [];
      const newValues = currentValues.includes(option)
        ? currentValues.filter((v) => v !== option)
        : [...currentValues, option];
      return {
        ...prev,
        [sectionCode]: {
          ...prev[sectionCode],
          [fieldName]: newValues,
          _useDefaults: false,
        },
      };
    });
  };

  // Set normal findings for a section
  const setNormalFindings = (section) => {
    const sectionCode = section.sectionCode || section.id;
    setExamData((prev) => ({
      ...prev,
      [sectionCode]: {
        _useDefaults: true,
        _narrativeText: section.defaultFindings,
      },
    }));
  };

  // Clear section data
  const clearSection = (sectionCode) => {
    setExamData((prev) => {
      const newData = { ...prev };
      delete newData[sectionCode];
      return newData;
    });
  };

  // Render field based on type
  const renderField = (section, field) => {
    const sectionCode = section.sectionCode || section.id;
    const value = examData[sectionCode]?.[field.name];

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {field.label}
              {field.normalRange && (
                <span className="text-gray-400 ml-1">({field.normalRange})</span>
              )}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleFieldChange(sectionCode, field.name, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <div className="flex flex-wrap gap-1">
              {field.options?.map((opt) => {
                const isSelected = (value || []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleMultiselectChange(sectionCode, field.name, opt)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {field.label}
              {field.unit && <span className="text-gray-400 ml-1">({field.unit})</span>}
              {field.normalRange && (
                <span className="text-gray-400 ml-1">[{field.normalRange}]</span>
              )}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(sectionCode, field.name, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'text':
        return (
          <div key={field.name} className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleFieldChange(sectionCode, field.name, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-500">Loading exam sections...</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>No exam sections available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section Cards */}
      <div className="space-y-3">
        {sections.map((section) => {
          const sectionCode = section.sectionCode || section.id;
          const isExpanded = expandedSections.has(sectionCode);
          const hasData = examData[sectionCode] && Object.keys(examData[sectionCode]).length > 0;
          const isUsingDefaults = examData[sectionCode]?._useDefaults;
          
          return (
            <div
              key={sectionCode}
              className={`border rounded-lg overflow-hidden ${
                section.isRequired ? 'border-blue-200' : 'border-gray-200'
              }`}
            >
              {/* Section Header */}
              <div
                className={`flex items-center justify-between p-3 cursor-pointer ${
                  hasData ? 'bg-green-50' : 'bg-gray-50'
                } hover:bg-gray-100 transition-colors`}
                onClick={() => toggleSection(sectionCode)}
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className={`h-4 w-4 ${
                    hasData ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <span className="font-medium text-gray-900">
                    {section.sectionName}
                  </span>
                  {section.isRequired && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      Required
                    </span>
                  )}
                  {hasData && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-4 border-t border-gray-100">
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setNormalFindings(section)}
                      className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 transition-colors ${
                        isUsingDefaults
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      Normal Findings
                    </button>
                    {hasData && (
                      <button
                        onClick={() => clearSection(sectionCode)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Show default findings or fields */}
                  {isUsingDefaults ? (
                    <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-700 italic">
                      {section.defaultFindings}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {parseFields(section.fields).map((field) =>
                        renderField(section, field)
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Generated Narrative */}
      {narrativeText && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Physical Examination Summary
          </h4>
          <div className="text-sm text-gray-800 whitespace-pre-wrap">
            {narrativeText.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-2">
                {paragraph.replace(/\*\*/g, '')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicExamForm;
