import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Pill,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Clock,
  Calculator,
  AlertCircle,
  Package,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { SmartDrugAutocomplete } from '../clinical';

// Validation schema
const prescriptionItemSchema = z.object({
  drugName: z.string().min(1, 'Drug name is required'),
  strength: z.string().optional(),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  frequencyText: z.string().optional(),
  duration: z.string().min(1, 'Duration is required'),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  items: z.array(prescriptionItemSchema).min(1, 'At least one item is required'),
  instructions: z.string().optional(),
});

/**
 * EnhancedPrescriptionModal - Smart prescription creation with drug templates
 * 
 * Features:
 * - Smart drug autocomplete with dosage templates
 * - Auto-calculation of quantity based on frequency and duration
 * - Recent prescriptions quick-access
 * - Drug interaction warnings (placeholder for future)
 */
export default function EnhancedPrescriptionModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  patientName,
}) {
  const [recentSelections, setRecentSelections] = useState([]);
  const [showQuantityCalculator, setShowQuantityCalculator] = useState({});
  const [copied, setCopied] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      items: [createEmptyItem()],
      instructions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        items: [createEmptyItem()],
        instructions: '',
      });
    }
  }, [isOpen, reset]);

  function createEmptyItem() {
    return {
      drugName: '',
      strength: '',
      dosage: '',
      frequency: '',
      frequencyText: '',
      duration: '',
      quantity: 1,
      instructions: '',
    };
  }

  // Handle drug selection from autocomplete
  const handleDrugSelect = useCallback((index, regimen) => {
    setValue(`items.${index}.drugName`, regimen.drugName);
    setValue(`items.${index}.strength`, regimen.strength || '');
    setValue(`items.${index}.dosage`, regimen.strength || '');
    setValue(`items.${index}.frequency`, regimen.frequency || '');
    setValue(`items.${index}.frequencyText`, regimen.frequencyText || '');
    setValue(`items.${index}.duration`, regimen.duration ? `${regimen.duration} days` : '');
    setValue(`items.${index}.instructions`, regimen.instructions || '');
    
    // Auto-calculate quantity
    if (regimen.frequency && regimen.duration) {
      const freqPerDay = getFrequencyPerDay(regimen.frequency);
      const quantity = freqPerDay * regimen.duration;
      setValue(`items.${index}.quantity`, quantity);
    }

    // Add to recent selections
    setRecentSelections(prev => {
      const filtered = prev.filter(r => r.drugName !== regimen.drugName);
      return [regimen, ...filtered].slice(0, 5);
    });
  }, [setValue]);

  // Get doses per day from frequency code
  function getFrequencyPerDay(frequency) {
    const freqMap = {
      'OD': 1,
      'BD': 2,
      'TDS': 3,
      'QID': 4,
      'Q6H': 4,
      'Q8H': 3,
      'Q12H': 2,
      'STAT': 1,
      'PRN': 1,
      'HS': 1,
    };
    return freqMap[frequency] || 1;
  }

  // Calculate quantity helper
  const calculateQuantity = (index) => {
    const frequency = watch(`items.${index}.frequency`);
    const durationStr = watch(`items.${index}.duration`);
    
    if (!frequency || !durationStr) return;
    
    const freqPerDay = getFrequencyPerDay(frequency);
    const durationMatch = durationStr.match(/(\d+)/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
    
    if (duration > 0) {
      const quantity = freqPerDay * duration;
      setValue(`items.${index}.quantity`, quantity);
    }
  };

  // Generate prescription summary for copying
  const generatePrescriptionSummary = () => {
    const items = watch('items');
    const summary = items.map((item, i) => 
      `${i + 1}. ${item.drugName} ${item.strength || ''}\n   Sig: ${item.dosage} ${item.frequencyText || item.frequency} for ${item.duration}\n   Qty: ${item.quantity}\n   ${item.instructions ? `Note: ${item.instructions}` : ''}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Pill className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  Create Prescription
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Smart
                  </span>
                </h3>
                {patientName && (
                  <p className="text-sm text-gray-600">for {patientName}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Recent Selections Quick Access */}
        {recentSelections.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <Clock className="w-3 h-3" />
              Recent Selections
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSelections.map((drug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    append(createEmptyItem());
                    setTimeout(() => handleDrugSelect(fields.length, drug), 0);
                  }}
                  className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  {drug.drugName} {drug.strength}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="enhanced-prescription-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">Medication</span>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Smart Drug Autocomplete */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Drug Name <span className="text-red-500">*</span>
                    </label>
                    <SmartDrugAutocomplete
                      onSelect={(regimen) => handleDrugSelect(index, regimen)}
                      placeholder="Search medications or select from templates..."
                    />
                    <input type="hidden" {...register(`items.${index}.drugName`)} />
                    
                    {/* Show selected drug */}
                    {watch(`items.${index}.drugName`) && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 font-medium">
                          {watch(`items.${index}.drugName`)} {watch(`items.${index}.strength`)}
                        </span>
                      </div>
                    )}
                    {errors.items?.[index]?.drugName && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.items[index].drugName.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Dosage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register(`items.${index}.dosage`)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="e.g., 500mg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register(`items.${index}.frequency`)}
                        onChange={(e) => {
                          register(`items.${index}.frequency`).onChange(e);
                          calculateQuantity(index);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select</option>
                        <option value="OD">Once daily (OD)</option>
                        <option value="BD">Twice daily (BD)</option>
                        <option value="TDS">Three times (TDS)</option>
                        <option value="QID">Four times (QID)</option>
                        <option value="Q6H">Every 6 hours</option>
                        <option value="Q8H">Every 8 hours</option>
                        <option value="HS">At bedtime (HS)</option>
                        <option value="PRN">As needed (PRN)</option>
                        <option value="STAT">Immediately (STAT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register(`items.${index}.duration`)}
                        onChange={(e) => {
                          register(`items.${index}.duration`).onChange(e);
                          calculateQuantity(index);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select</option>
                        <option value="3 days">3 days</option>
                        <option value="5 days">5 days</option>
                        <option value="7 days">7 days</option>
                        <option value="10 days">10 days</option>
                        <option value="14 days">14 days</option>
                        <option value="21 days">21 days</option>
                        <option value="30 days">1 month</option>
                        <option value="60 days">2 months</option>
                        <option value="90 days">3 months</option>
                        <option value="Ongoing">Ongoing</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                        Quantity <span className="text-red-500">*</span>
                        <button
                          type="button"
                          onClick={() => calculateQuantity(index)}
                          className="ml-1 text-green-600 hover:text-green-700"
                          title="Auto-calculate"
                        >
                          <Calculator className="w-3 h-3" />
                        </button>
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        placeholder="Auto"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Special Instructions
                    </label>
                    <input
                      type="text"
                      {...register(`items.${index}.instructions`)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      placeholder="e.g., Take after meals, with water"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add Another Drug Button */}
            <button
              type="button"
              onClick={() => append(createEmptyItem())}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Medication
            </button>

            {/* General Instructions */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                General Instructions for Pharmacist
              </label>
              <textarea
                {...register('instructions')}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any additional instructions for dispensing..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4" />
                <span>{fields.length} medication{fields.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                type="button"
                onClick={generatePrescriptionSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="enhanced-prescription-form"
                disabled={loading}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Pill className="w-4 h-4" />
                    Create Prescription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
