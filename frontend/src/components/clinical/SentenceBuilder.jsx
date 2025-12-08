import { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Sparkles, Copy, Check } from 'lucide-react';
import useClinicalTemplateStore from '../../store/clinicalTemplateStore';

/**
 * Sentence Builder Component
 * 
 * Features:
 * - Pre-built templates for common conditions
 * - Dropdown/multiselect fields
 * - Real-time preview of generated text
 * - One-click to insert into notes
 */
const SentenceBuilder = ({ 
  category, // e.g., 'FEVER', 'COUGH', 'ABDOMINAL'
  onInsert, 
  className = '' 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [generatedText, setGeneratedText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState([]);

  const { getTemplatesForCategory, generateClinicalText, isLoading } = useClinicalTemplateStore();

  // Load templates for category
  useEffect(() => {
    if (category) {
      getTemplatesForCategory(category).then(setTemplates).catch(console.error);
    }
  }, [category, getTemplatesForCategory]);

  // Parse placeholders from template
  const getPlaceholders = () => {
    if (!selectedTemplate) return [];
    try {
      return JSON.parse(selectedTemplate.placeholders);
    } catch {
      return [];
    }
  };

  // Get default values
  const getDefaults = () => {
    if (!selectedTemplate?.defaultValues) return {};
    try {
      return JSON.parse(selectedTemplate.defaultValues);
    } catch {
      return {};
    }
  };

  // Initialize values when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const defaults = getDefaults();
      setValues(defaults);
      updatePreview(defaults);
    } else {
      setValues({});
      setGeneratedText('');
    }
  }, [selectedTemplate]);

  // Generate preview text
  const updatePreview = async (currentValues) => {
    if (!selectedTemplate) return;

    let text = selectedTemplate.template;
    const placeholders = getPlaceholders();

    placeholders.forEach((placeholder) => {
      const value = currentValues[placeholder.name];
      if (value !== undefined && value !== null && value !== '') {
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        text = text.replace(new RegExp(`\\{${placeholder.name}\\}`, 'g'), displayValue);
      } else if (placeholder.required) {
        text = text.replace(
          new RegExp(`\\{${placeholder.name}\\}`, 'g'),
          `[${placeholder.label}]`
        );
      } else {
        text = text.replace(new RegExp(`\\{${placeholder.name}\\}`, 'g'), '');
      }
    });

    // Clean up text
    text = text.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/\s+\./g, '.').trim();
    setGeneratedText(text);
  };

  // Handle value change
  const handleValueChange = (name, value) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    updatePreview(newValues);
  };

  // Handle multiselect
  const handleMultiselectChange = (name, option) => {
    const currentValues = values[name] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v) => v !== option)
      : [...currentValues, option];
    handleValueChange(name, newValues);
  };

  // Insert text into notes
  const handleInsert = () => {
    if (generatedText && onInsert) {
      onInsert(generatedText);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Render field based on type
  const renderField = (placeholder) => {
    const { name, label, type, options, required } = placeholder;
    const value = values[name];

    switch (type) {
      case 'select':
        return (
          <div key={name} className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select {label.toLowerCase()}...</option>
              {options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={name} className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-1">
              {options?.map((opt) => {
                const isSelected = (value || []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleMultiselectChange(name, opt)}
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

      case 'text':
        return (
          <div key={name} className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleValueChange(name, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (templates.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="font-medium text-gray-900">Sentence Builder</span>
          {selectedTemplate && (
            <span className="text-xs text-gray-500">
              - {selectedTemplate.templateName}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </div>

      {isExpanded && (
        <div className="p-4">
          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Template
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find((t) => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.templateName}
                </option>
              ))}
            </select>
          </div>

          {/* Fields */}
          {selectedTemplate && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {getPlaceholders().map(renderField)}
              </div>

              {/* Preview */}
              {generatedText && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-700">Preview</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {generatedText}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setValues({});
                    setGeneratedText('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
                <button
                  onClick={handleInsert}
                  disabled={!generatedText}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Insert into Notes
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SentenceBuilder;
