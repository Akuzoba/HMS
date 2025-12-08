import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  Stethoscope, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Save,
  RotateCcw,
  Copy,
  Check,
  Wand2,
  History,
  MessageSquare
} from 'lucide-react';
import { SentenceBuilder, DynamicExamForm } from '../clinical';

/**
 * EnhancedConsultationForm - Professional clinical documentation with smart templates
 * 
 * Features:
 * - Smart sentence builders for history documentation
 * - Dynamic physical examination forms based on chief complaint
 * - Collapsible sections for better organization
 * - Auto-suggestions based on chief complaint
 */
export default function EnhancedConsultationForm({
  register,
  errors,
  watch,
  setValue,
  loading,
  onSubmit,
  hasLabResults = false,
  onReset,
  currentConsultationId,
}) {
  const [expandedSections, setExpandedSections] = useState({
    chiefComplaint: true,
    history: true,
    examination: true,
    diagnosis: true,
  });
  const [showHistorySentenceBuilder, setShowHistorySentenceBuilder] = useState(false);
  const [showPastHistorySentenceBuilder, setShowPastHistorySentenceBuilder] = useState(false);
  const [copied, setCopied] = useState({});
  
  const chiefComplaint = watch('chiefComplaint');
  const historyOfPresentingIllness = watch('historyOfPresentingIllness');
  const examination = watch('examination');

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle sentence builder output
  const handleHistoryGenerate = useCallback((text) => {
    const currentHistory = watch('historyOfPresentingIllness') || '';
    const newHistory = currentHistory 
      ? `${currentHistory}\n\n${text}` 
      : text;
    setValue('historyOfPresentingIllness', newHistory, { shouldDirty: true });
    setShowHistorySentenceBuilder(false);
  }, [setValue, watch]);

  const handlePastHistoryGenerate = useCallback((text) => {
    const currentHistory = watch('pastMedicalHistory') || '';
    const newHistory = currentHistory 
      ? `${currentHistory}\n\n${text}` 
      : text;
    setValue('pastMedicalHistory', newHistory, { shouldDirty: true });
    setShowPastHistorySentenceBuilder(false);
  }, [setValue, watch]);

  // Handle physical exam changes
  const handleExamChange = useCallback((findings) => {
    // Convert findings object to clinical narrative
    const examText = Object.entries(findings)
      .filter(([_, value]) => value && value.trim())
      .map(([section, value]) => {
        const sectionTitle = section.replace(/([A-Z])/g, ' $1').trim();
        return `${sectionTitle}: ${value}`;
      })
      .join('\n');
    
    if (examText) {
      setValue('examination', examText, { shouldDirty: true });
    }
  }, [setValue]);

  // Copy to clipboard
  const copyToClipboard = (field, text) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [field]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [field]: false })), 2000);
  };

  // Derive category from chief complaint for sentence builders
  const getComplaintCategory = (complaint) => {
    if (!complaint) return null;
    const lowerComplaint = complaint.toLowerCase();
    if (lowerComplaint.includes('fever') || lowerComplaint.includes('temperature')) return 'FEVER';
    if (lowerComplaint.includes('cough') || lowerComplaint.includes('cold')) return 'RESPIRATORY';
    if (lowerComplaint.includes('pain') && (lowerComplaint.includes('stomach') || lowerComplaint.includes('abdom'))) return 'GI';
    if (lowerComplaint.includes('head') || lowerComplaint.includes('migraine')) return 'HEADACHE';
    if (lowerComplaint.includes('skin') || lowerComplaint.includes('rash')) return 'DERMATOLOGY';
    if (lowerComplaint.includes('chest') || lowerComplaint.includes('heart')) return 'CARDIAC';
    return 'GENERAL';
  };

  const category = getComplaintCategory(chiefComplaint);

  // Section Header Component
  const SectionHeader = ({ title, icon: Icon, section, badge, children }) => (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
          {expandedSections[section] ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>
    </div>
  );

  if (hasLabResults) {
    // Simplified form for lab return patients
    return (
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            Post-Lab Diagnosis
          </h3>
          <p className="text-sm text-purple-600 mt-1">
            Patient returned from Laboratory with results
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-sm text-purple-800">
              <strong>Note:</strong> This patient has returned from the laboratory. 
              Please review the lab results and provide the final diagnosis.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Final Diagnosis <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('finalDiagnosis')}
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Based on the lab results, enter your final diagnosis..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Treatment Plan
            </label>
            <textarea
              {...register('treatmentPlan')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Medications, procedures, follow-up schedule..."
            />
          </div>
        </div>

        <FormActions 
          loading={loading} 
          onReset={onReset} 
          currentConsultationId={currentConsultationId}
        />
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Clinical Documentation
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Enhanced with smart templates and auto-suggestions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-medium rounded-full">
              <Sparkles className="w-3 h-3" />
              Smart Mode
            </span>
          </div>
        </div>
      </div>

      {/* Chief Complaint Section */}
      <SectionHeader 
        title="Chief Complaint" 
        icon={MessageSquare} 
        section="chiefComplaint"
      />
      <AnimatePresence>
        {expandedSections.chiefComplaint && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary reason for this visit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('chiefComplaint')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Fever and headache for 3 days"
              />
              {errors.chiefComplaint && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.chiefComplaint.message}
                </p>
              )}
              {category && (
                <p className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  Detected category: <span className="font-medium">{category}</span> - Smart suggestions enabled
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Section */}
      <SectionHeader 
        title="History" 
        icon={History} 
        section="history"
        badge={category ? 'Templates Available' : null}
      >
        {chiefComplaint && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowHistorySentenceBuilder(!showHistorySentenceBuilder);
            }}
            className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
          >
            <Wand2 className="w-3 h-3" />
            Use Template
          </button>
        )}
      </SectionHeader>
      <AnimatePresence>
        {expandedSections.history && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-5">
              {/* Sentence Builder for HPI */}
              <AnimatePresence>
                {showHistorySentenceBuilder && category && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4"
                  >
                    <SentenceBuilder
                      category={category}
                      onGenerate={handleHistoryGenerate}
                      compact
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    History of Presenting Illness
                  </label>
                  {historyOfPresentingIllness && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard('hpi', historyOfPresentingIllness)}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {copied.hpi ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied.hpi ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                <textarea
                  {...register('historyOfPresentingIllness')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Onset, duration, progression of symptoms..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Past Medical History
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPastHistorySentenceBuilder(!showPastHistorySentenceBuilder)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    {showPastHistorySentenceBuilder ? 'Hide' : 'Use'} Template
                  </button>
                </div>
                
                <AnimatePresence>
                  {showPastHistorySentenceBuilder && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-3"
                    >
                      <SentenceBuilder
                        category="PAST_HISTORY"
                        onGenerate={handlePastHistoryGenerate}
                        compact
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <textarea
                  {...register('pastMedicalHistory')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Previous conditions, surgeries, allergies..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Physical Examination Section */}
      <SectionHeader 
        title="Physical Examination" 
        icon={Stethoscope} 
        section="examination"
        badge={chiefComplaint ? 'Smart Forms' : null}
      />
      <AnimatePresence>
        {expandedSections.examination && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">
              {chiefComplaint ? (
                <div className="space-y-4">
                  {/* Dynamic Exam Form */}
                  <DynamicExamForm
                    chiefComplaint={chiefComplaint}
                    onExamChange={handleExamChange}
                    initialFindings={{}}
                  />
                  
                  {/* Raw examination textarea as fallback/override */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Examination Notes
                    </label>
                    <textarea
                      {...register('examination')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Any additional examination findings not captured above..."
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Enter a chief complaint first</p>
                  <p className="text-sm mt-1">Smart examination forms will appear based on the complaint</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnosis Section */}
      <SectionHeader 
        title="Diagnosis & Treatment" 
        icon={FileText} 
        section="diagnosis"
      />
      <AnimatePresence>
        {expandedSections.diagnosis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provisional Diagnosis
                  </label>
                  <textarea
                    {...register('provisionalDiagnosis')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Initial working diagnosis..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Diagnosis
                  </label>
                  <textarea
                    {...register('finalDiagnosis')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Confirmed diagnosis..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan
                </label>
                <textarea
                  {...register('treatmentPlan')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Medications, procedures, follow-up schedule..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Any other relevant observations..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Actions */}
      <FormActions 
        loading={loading} 
        onReset={onReset} 
        currentConsultationId={currentConsultationId}
      />
    </form>
  );
}

// Form Actions Component
function FormActions({ loading, onReset, currentConsultationId }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Clear Form</span>
      </button>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        <span className="font-medium">
          {loading ? 'Saving...' : currentConsultationId ? 'Update Consultation' : 'Save Consultation'}
        </span>
      </motion.button>
    </div>
  );
}
