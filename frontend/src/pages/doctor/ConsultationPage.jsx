import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Activity, 
  Pill, 
  FlaskConical, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle,
  ClipboardList,
  Stethoscope,
  FileText,
  ArrowRight,
  X,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Heart,
  Thermometer,
  Clock,
  Save,
  RotateCcw,
  ChevronRight,
  Zap,
  Building2,
  Receipt
} from 'lucide-react';
import { useVisitStore } from '../../store/visitStore';
import { useVitalStore } from '../../store/vitalStore';
import { useConsultationStore } from '../../store/consultationStore';
import { usePrescriptionStore, usePharmacyStore } from '../../store/prescriptionStore';
import { useLabStore } from '../../store/labStore';
import { useConsultationUIStore } from '../../store/consultationUIStore';
import { toast } from 'sonner';

// Schema for new consultations (requires chief complaint)
const consultationSchema = z.object({
  visitId: z.string().min(1, 'Please select a visit'),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  historyOfPresentingIllness: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  examination: z.string().optional(),
  provisionalDiagnosis: z.string().optional(),
  finalDiagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  notes: z.string().optional(),
});

// Schema for lab return patients (only requires final diagnosis)
const labReturnSchema = z.object({
  visitId: z.string().min(1, 'Please select a visit'),
  finalDiagnosis: z.string().min(1, 'Final diagnosis is required'),
  treatmentPlan: z.string().optional(),
});

const diagnosisSchema = z.object({
  icdCode: z.string().min(1, 'ICD code is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['PROVISIONAL', 'FINAL']),
});

const prescriptionItemSchema = z.object({
  drugName: z.string().min(1, 'Drug name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  quantity: z.coerce.number().min(1, 'Quantity is required'),
  instructions: z.string().optional(),
});

const prescriptionSchema = z.object({
  items: z.array(prescriptionItemSchema).min(1, 'At least one item is required'),
  instructions: z.string().optional(),
});

export default function ConsultationPage() {
  const { visits, listVisits, updateVisit } = useVisitStore();
  const { vitals, getVisitVitals } = useVitalStore();
  const { createConsultation, updateConsultation, addDiagnosis, loading, error } = useConsultationStore();
  const { createPrescription, loading: prescriptionLoading } = usePrescriptionStore();
  const { drugs, listDrugs } = usePharmacyStore();
  const { labTests, listLabTests, createLabOrder, loading: labLoading } = useLabStore();
  
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [drugSearch, setDrugSearch] = useState({});
  const [drugDropdownOpen, setDrugDropdownOpen] = useState({}); // Track which drug dropdowns are open
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showLabOrderForm, setShowLabOrderForm] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showLabResultsModal, setShowLabResultsModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentConsultationId, setCurrentConsultationId] = useState(null);
  const [activeTab, setActiveTab] = useState('consultation'); // consultation, prescription, labs
  const [selectedLabTests, setSelectedLabTests] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      visitId: '',
      chiefComplaint: '',
      historyOfPresentingIllness: '',
      pastMedicalHistory: '',
      examination: '',
      provisionalDiagnosis: '',
      finalDiagnosis: '',
      treatmentPlan: '',
      notes: '',
    },
  });

  const {
    register: registerDiagnosis,
    handleSubmit: handleSubmitDiagnosis,
    formState: { errors: diagnosisErrors },
    reset: resetDiagnosis,
  } = useForm({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      icdCode: '',
      description: '',
      type: 'PROVISIONAL',
    },
  });

  // Prescription form
  const {
    register: registerPrescription,
    handleSubmit: handleSubmitPrescription,
    control: prescriptionControl,
    formState: { errors: prescriptionErrors },
    reset: resetPrescription,
    setValue: setPrescriptionValue,
    watch: watchPrescription,
  } = useForm({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      items: [{ drugName: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' }],
      instructions: '',
    },
  });

  const { fields: prescriptionItems, append: addPrescriptionItem, remove: removePrescriptionItem } = useFieldArray({
    control: prescriptionControl,
    name: 'items',
  });

  const visitId = watch('visitId');

  // Load visits with status WITH_DOCTOR
  useEffect(() => {
    listVisits({ status: 'WITH_DOCTOR,IN_PROGRESS' });
    listLabTests();
    listDrugs();
  }, [listVisits, listLabTests, listDrugs]);

  // Update selected visit and load vitals
  useEffect(() => {
    if (visitId) {
      const visit = visits.find((v) => v.id === visitId);
      setSelectedVisit(visit);
      getVisitVitals(visitId);
      
      // For lab return patients, automatically set the consultation ID
      const hasCompletedLabResults = visit?.consultations?.some(
        c => c.labOrders?.some(lo => lo.status === 'COMPLETED' && lo.results?.length > 0)
      );
      if (hasCompletedLabResults && visit?.consultations?.[0]?.id) {
        setCurrentConsultationId(visit.consultations[0].id);
      }
    } else {
      setSelectedVisit(null);
      setCurrentConsultationId(null);
    }
  }, [visitId, visits, getVisitVitals]);

  // Sync consultation active state with sidebar
  const { pendingAction, clearAction, setConsultationActive } = useConsultationUIStore();
  
  useEffect(() => {
    setConsultationActive(!!currentConsultationId);
  }, [currentConsultationId, setConsultationActive]);

  // Handle sidebar action triggers
  useEffect(() => {
    if (pendingAction && currentConsultationId) {
      switch (pendingAction) {
        case 'diagnosis':
          setShowDiagnosisForm(true);
          break;
        case 'prescription':
          setShowPrescriptionForm(true);
          break;
        case 'labs':
          setShowLabOrderForm(true);
          break;
        case 'route':
          setShowRouteModal(true);
          break;
      }
      clearAction();
    }
  }, [pendingAction, currentConsultationId, clearAction]);

  // Check if patient is returning from lab (has completed lab results)
  const isLabReturnPatient = selectedVisit?.consultations?.some(
    c => c.labOrders?.some(lo => lo.status === 'COMPLETED' && lo.results?.length > 0)
  );

  // Get existing consultation ID for lab return patients
  const existingConsultationId = selectedVisit?.consultations?.[0]?.id;

  const onSubmit = async (data) => {
    try {
      if (isLabReturnPatient && existingConsultationId) {
        // For lab return patients, update the existing consultation
        await updateConsultation(existingConsultationId, {
          finalDiagnosis: data.finalDiagnosis,
          treatmentPlan: data.treatmentPlan,
          status: 'COMPLETED',
        });
        setCurrentConsultationId(existingConsultationId);
        toast.success('Diagnosis updated successfully!');
      } else {
        // For new patients, create a new consultation
        const consultation = await createConsultation(data);
        setCurrentConsultationId(consultation.id);
        toast.success('Consultation created successfully!');
      }
    } catch (err) {
      console.error('Consultation error:', err);
      toast.error(isLabReturnPatient ? 'Failed to update diagnosis' : 'Failed to create consultation');
    }
  };

  // Custom submit handler for lab return patients (bypasses form validation)
  const handleLabReturnSubmit = async (e) => {
    e.preventDefault();
    const finalDiagnosis = watch('finalDiagnosis');
    const treatmentPlan = watch('treatmentPlan');
    
    if (!finalDiagnosis || finalDiagnosis.trim() === '') {
      toast.error('Final diagnosis is required');
      return;
    }

    if (!existingConsultationId) {
      toast.error('No consultation found to update');
      console.error('No existingConsultationId found for lab return patient');
      return;
    }

    try {
      await updateConsultation(existingConsultationId, {
        finalDiagnosis,
        treatmentPlan,
        // Keep status as IN_PROGRESS so doctor can still prescribe and route
      });
      setCurrentConsultationId(existingConsultationId);
      toast.success('Diagnosis updated successfully! You can now add prescriptions or route the patient.');
      
      // Refresh patient list but keep patient selected
      await listVisits({ status: 'WITH_DOCTOR,IN_PROGRESS' });
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update diagnosis');
    }
  };

  const onSubmitDiagnosis = async (data) => {
    if (!currentConsultationId) return;
    try {
      await addDiagnosis(currentConsultationId, data);
      toast.success('Diagnosis added successfully!');
      resetDiagnosis();
      setShowDiagnosisForm(false);
    } catch (err) {
      toast.error('Failed to add diagnosis');
    }
  };

  // Handle prescription submission
  const onSubmitPrescription = async (data) => {
    if (!currentConsultationId || !selectedVisit) {
      console.error('Missing required data:', { currentConsultationId, selectedVisit });
      toast.error('Please save the consultation first before prescribing');
      return;
    }
    try {
      console.log('Creating prescription with data:', {
        consultationId: currentConsultationId,
        patientId: selectedVisit.patient?.id,
        visitId: selectedVisit.id,
        items: data.items,
        instructions: data.instructions,
      });
      const result = await createPrescription({
        consultationId: currentConsultationId,
        patientId: selectedVisit.patient?.id,
        visitId: selectedVisit.id,
        items: data.items,
        instructions: data.instructions,
      });
      console.log('Prescription created:', result);
      toast.success('Prescription created successfully!');
      resetPrescription();
      setShowPrescriptionForm(false);
    } catch (err) {
      console.error('Failed to create prescription:', err);
      toast.error(err.response?.data?.message || 'Failed to create prescription');
    }
  };

  // Handle lab order submission
  const handleOrderLabs = async () => {
    if (!currentConsultationId || !selectedVisit || selectedLabTests.length === 0) return;
    try {
      await createLabOrder({
        patientId: selectedVisit.patient?.id,
        consultationId: currentConsultationId,
        tests: selectedLabTests.map(testId => ({ labTestId: testId })),
        priority: 'ROUTINE',
        clinicalNotes: 'Ordered during consultation',
      });
      toast.success('Lab tests ordered - Patient sent to Laboratory!');
      setSelectedLabTests([]);
      setShowLabOrderForm(false);
      
      // Reset and refresh since patient is now routed to lab
      reset();
      setSelectedVisit(null);
      setCurrentConsultationId(null);
      await listVisits({ status: 'WITH_DOCTOR,IN_PROGRESS' });
    } catch (err) {
      toast.error('Failed to order lab tests');
    }
  };

  // Handle routing patient to pharmacy, lab, billing, or complete
  const handleRoutePatient = async (destination) => {
    if (!selectedVisit) return;
    try {
      let newStatus;
      let message;
      switch (destination) {
        case 'pharmacy':
          newStatus = 'WITH_PHARMACY';
          message = 'Patient sent to Pharmacy';
          break;
        case 'lab':
          newStatus = 'WITH_LAB';
          message = 'Patient sent to Laboratory';
          break;
        case 'billing':
          newStatus = 'BILLING';
          message = 'Patient sent to Billing';
          break;
        case 'complete':
          newStatus = 'COMPLETED';
          message = 'Visit completed';
          break;
        default:
          newStatus = 'COMPLETED';
          message = 'Visit completed';
      }
      await updateVisit(selectedVisit.id, { status: newStatus });
      toast.success(message);
      setShowRouteModal(false);
      reset();
      setSelectedVisit(null);
      setCurrentConsultationId(null);
      await listVisits({ status: 'WITH_DOCTOR,IN_PROGRESS' });
    } catch (err) {
      toast.error('Failed to route patient');
    }
  };

  const latestVitals = vitals[0];
  
  // Check for completed lab results
  const completedLabOrders = selectedVisit?.consultations?.flatMap(
    c => c.labOrders?.filter(lo => lo.status === 'COMPLETED' && lo.results?.length > 0) || []
  ) || [];
  const hasLabResults = completedLabOrders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctor's Console</h1>
                <p className="text-sm text-gray-500">Consultation & Clinical Documentation</p>
              </div>
            </div>
            {selectedVisit && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {selectedVisit.visitNumber}
                </span>
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  In Session
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Patient Queue & Actions */}
          <div className="w-80 flex-shrink-0 space-y-4">
            {/* Patient Queue */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Patient Queue
                  <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {visits.length}
                  </span>
                </h2>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {visits.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No patients waiting</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {visits.map((visit, idx) => {
                      const hasCompletedLabResults = visit.consultations?.some(
                        c => c.labOrders?.some(lo => lo.status === 'COMPLETED' && lo.results?.length > 0)
                      );
                      const isSelected = visitId === visit.id;
                      
                      return (
                        <div
                          key={visit.id}
                          className={`p-3 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-blue-50 border-l-4 border-blue-600' 
                              : 'hover:bg-gray-50 border-l-4 border-transparent'
                          }`}
                          onClick={() => {
                            reset({ ...watch(), visitId: visit.id });
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {visit.patient?.firstName?.charAt(0)}{visit.patient?.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {visit.patient?.firstName} {visit.patient?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {visit.visitType?.replace('_', ' ')}
                              </p>
                            </div>
                            {hasCompletedLabResults && (
                              <FlaskConical className="w-4 h-4 text-purple-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Lab Results Quick Access */}
            {hasLabResults && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-sm p-4 text-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FlaskConical className="w-5 h-5" />
                  <span className="font-semibold">Lab Results Ready</span>
                  <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-xs">
                    {completedLabOrders.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowLabResultsModal(true)}
                  className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Results
                </button>
              </motion.div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {!selectedVisit ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Stethoscope className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready for Consultation</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Select a patient from the queue to begin their consultation and clinical documentation.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-lg font-bold">
                          {selectedVisit.patient?.firstName?.charAt(0)}{selectedVisit.patient?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">
                            {selectedVisit.patient?.firstName} {selectedVisit.patient?.lastName}
                          </h2>
                          <div className="flex items-center gap-3 mt-0.5 text-blue-100 text-sm">
                            <span>MRN: {selectedVisit.patient?.mrn}</span>
                            <span>•</span>
                            <span>{selectedVisit.visitType?.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{selectedVisit.visitNumber}</span>
                          </div>
                        </div>
                      </div>
                      {/* Patient Vitals and History Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowVitalsModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                        >
                          <Activity className="w-4 h-4" />
                          Patient Vitals
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowHistoryModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                        >
                          <ClipboardList className="w-4 h-4" />
                          History
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vitals Grid - Classic Style */}
                  {latestVitals && (
                    <div className="p-6 bg-gray-50 border-t">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Vital Signs
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {latestVitals.temperature && (
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                              <Thermometer className="w-4 h-4" />
                              <span className="text-xs font-medium">Temp</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{latestVitals.temperature}°C</p>
                          </div>
                        )}
                        {latestVitals.bloodPressureSystolic && (
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 text-red-600 mb-1">
                              <Activity className="w-4 h-4" />
                              <span className="text-xs font-medium">BP</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
                            </p>
                          </div>
                        )}
                        {latestVitals.heartRate && (
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 text-pink-600 mb-1">
                              <Heart className="w-4 h-4" />
                              <span className="text-xs font-medium">Heart Rate</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{latestVitals.heartRate} bpm</p>
                          </div>
                        )}
                        {latestVitals.oxygenSaturation && (
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 text-blue-600 mb-1">
                              <Activity className="w-4 h-4" />
                              <span className="text-xs font-medium">SpO₂</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{latestVitals.oxygenSaturation}%</p>
                          </div>
                        )}
                        {latestVitals.weight && (
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                              <span className="text-xs font-medium">Weight</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{latestVitals.weight} kg</p>
                          </div>
                        )}
                        {latestVitals.bmi && (
                          <div className="bg-white p-3 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                              <span className="text-xs font-medium">BMI</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">{latestVitals.bmi}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Consultation Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-gray-400" />
                      {hasLabResults ? 'Post-Lab Diagnosis' : 'Clinical Documentation'}
                    </h3>
                    {hasLabResults && (
                      <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                        <FlaskConical className="w-4 h-4" />
                        Patient returned from Laboratory with results
                      </p>
                    )}
                  </div>
                  
                  <form onSubmit={hasLabResults ? handleLabReturnSubmit : handleSubmit(onSubmit)} className="p-6">
                    <div className="space-y-6">
                      {/* Show full form for new patients, only diagnosis for lab returns */}
                      {!hasLabResults ? (
                        <>
                          {/* Chief Complaint */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Chief Complaint <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              {...register('chiefComplaint')}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Primary reason for this visit..."
                            />
                            {errors.chiefComplaint && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {errors.chiefComplaint.message}
                              </p>
                            )}
                          </div>

                          {/* History Section */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                History of Presenting Illness
                              </label>
                              <textarea
                                {...register('historyOfPresentingIllness')}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                placeholder="Onset, duration, progression of symptoms..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Past Medical History
                              </label>
                              <textarea
                                {...register('pastMedicalHistory')}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                placeholder="Previous conditions, surgeries, allergies..."
                              />
                            </div>
                          </div>

                          {/* Examination */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Physical Examination
                            </label>
                            <textarea
                              {...register('examination')}
                              rows={4}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                              placeholder="General appearance, system-specific findings..."
                            />
                          </div>

                          {/* Diagnosis Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
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

                          {/* Treatment Plan */}
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

                          {/* Notes */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Additional Notes
                            </label>
                            <textarea
                              {...register('notes')}
                              rows={2}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                              placeholder="Any other relevant observations..."
                            />
                          </div>
                        </>
                      ) : (
                        /* Simplified form for patients returning from lab */
                        <div>
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

                          <div className="mt-4">
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
                      )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          reset();
                          setSelectedVisit(null);
                          setCurrentConsultationId(null);
                        }}
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
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnosis Form Modal */}
      <AnimatePresence>
        {showDiagnosisForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDiagnosisForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add ICD Diagnosis</h3>
                    <p className="text-sm text-gray-500">Enter diagnosis code and details</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmitDiagnosis(onSubmitDiagnosis)} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ICD Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerDiagnosis('icdCode')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., A00.0"
                  />
                  {diagnosisErrors.icdCode && (
                    <p className="mt-1 text-sm text-red-600">{diagnosisErrors.icdCode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...registerDiagnosis('description')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Diagnosis description"
                  />
                  {diagnosisErrors.description && (
                    <p className="mt-1 text-sm text-red-600">{diagnosisErrors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...registerDiagnosis('type')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="PROVISIONAL">Provisional</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiagnosisForm(false);
                      resetDiagnosis();
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Diagnosis'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Modal */}
      <AnimatePresence>
        {showPrescriptionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPrescriptionForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Pill className="w-4 h-4 text-green-600" />
                            </div>
                            Create Prescription
                          </h3>
                          <button
                            onClick={() => {
                              setShowPrescriptionForm(false);
                              resetPrescription();
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Scrollable Content */}
                      <div className="flex-1 overflow-y-auto p-6">
                        <form id="prescription-form" onSubmit={handleSubmitPrescription(onSubmitPrescription)} className="space-y-4">
                          {prescriptionItems.map((item, index) => (
                            <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                                {prescriptionItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removePrescriptionItem(index)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Drug Name *</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={drugSearch[index] || ''}
                                      onChange={(e) => {
                                        setDrugSearch({ ...drugSearch, [index]: e.target.value });
                                        setDrugDropdownOpen({ ...drugDropdownOpen, [index]: true });
                                      }}
                                      onFocus={() => setDrugDropdownOpen({ ...drugDropdownOpen, [index]: true })}
                                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                      placeholder="Search for a drug..."
                                    />
                                    <input type="hidden" {...registerPrescription(`items.${index}.drugName`)} />
                                    {drugDropdownOpen[index] && drugSearch[index] && drugSearch[index].length > 0 && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {(drugs || []).filter(d => 
                                          d.drugName?.toLowerCase().includes(drugSearch[index]?.toLowerCase() || '') &&
                                          d.stockQuantity > 0
                                        ).length === 0 ? (
                                          <div className="px-3 py-2 text-sm text-gray-500">No drugs found in stock</div>
                                        ) : (
                                          (drugs || []).filter(d => 
                                            d.drugName?.toLowerCase().includes(drugSearch[index]?.toLowerCase() || '') &&
                                            d.stockQuantity > 0
                                          ).map((drug) => (
                                            <button
                                              key={drug.id}
                                              type="button"
                                              onClick={() => {
                                                setPrescriptionValue(`items.${index}.drugName`, drug.drugName);
                                                setDrugSearch({ ...drugSearch, [index]: drug.drugName });
                                                setDrugDropdownOpen({ ...drugDropdownOpen, [index]: false });
                                              }}
                                              className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 flex justify-between items-center"
                                            >
                                              <span>{drug.drugName}</span>
                                              <span className="text-xs text-gray-400">Stock: {drug.stockQuantity}</span>
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {watchPrescription(`items.${index}.drugName`) && (
                                    <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Selected: {watchPrescription(`items.${index}.drugName`)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Dosage *</label>
                                  <input
                                    type="text"
                                    {...registerPrescription(`items.${index}.dosage`)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                    placeholder="e.g., 1 tablet"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Frequency *</label>
                                  <select
                                    {...registerPrescription(`items.${index}.frequency`)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                  >
                                    <option value="">Select frequency</option>
                                    <option value="Once daily">Once daily</option>
                                    <option value="Twice daily">Twice daily</option>
                                    <option value="Three times daily">3x daily</option>
                                    <option value="Four times daily">4x daily</option>
                                    <option value="Every 6 hours">Every 6 hours</option>
                                    <option value="Every 8 hours">Every 8 hours</option>
                                    <option value="As needed">As needed</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Duration *</label>
                                  <select
                                    {...registerPrescription(`items.${index}.duration`)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                  >
                                    <option value="">Select duration</option>
                                    <option value="3 days">3 days</option>
                                    <option value="5 days">5 days</option>
                                    <option value="7 days">7 days</option>
                                    <option value="10 days">10 days</option>
                                    <option value="14 days">14 days</option>
                                    <option value="1 month">1 month</option>
                                    <option value="Ongoing">Ongoing</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                                  <input
                                    type="number"
                                    min="1"
                                    {...registerPrescription(`items.${index}.quantity`)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                    placeholder="e.g., 21"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                                  <input
                                    type="text"
                                    {...registerPrescription(`items.${index}.instructions`)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                                    placeholder="e.g., Take after meals"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addPrescriptionItem({ drugName: '', dosage: '', frequency: '', duration: '', quantity: 1, instructions: '' })}
                            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Another Drug
                          </button>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">General Instructions</label>
                            <textarea
                              {...registerPrescription('instructions')}
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Any additional instructions for the pharmacist..."
                            />
                          </div>
                        </form>
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPrescriptionForm(false);
                            resetPrescription();
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          form="prescription-form"
                          disabled={prescriptionLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                          {prescriptionLoading ? (
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
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

      {/* Lab Order Modal */}
      <AnimatePresence>
        {showLabOrderForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowLabOrderForm(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <FlaskConical className="w-4 h-4 text-purple-600" />
                            </div>
                            Order Lab Tests
                          </h3>
                          <button
                            onClick={() => {
                              setShowLabOrderForm(false);
                              setSelectedLabTests([]);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Select the lab tests to order for this patient</p>
                      </div>
                      
                      {/* Scrollable Content */}
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-2">
                          {(labTests || []).length === 0 ? (
                            <div className="text-center py-8">
                              <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-500">No lab tests available</p>
                            </div>
                          ) : (
                            (labTests || []).map((test) => (
                              <label
                                key={test.id}
                                className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                                  selectedLabTests.includes(test.id)
                                    ? 'bg-purple-50 border-2 border-purple-300 shadow-sm'
                                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedLabTests.includes(test.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedLabTests([...selectedLabTests, test.id]);
                                    } else {
                                      setSelectedLabTests(selectedLabTests.filter(id => id !== test.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <div className="ml-3 flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{test.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{test.category} • {test.code}</p>
                                </div>
                                {test.price && (
                                  <span className="ml-2 text-sm font-semibold text-purple-600 whitespace-nowrap">
                                    ${test.price.toFixed(2)}
                                  </span>
                                )}
                              </label>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 text-sm font-semibold rounded-full">
                              {selectedLabTests.length}
                            </span>
                            <span className="text-sm text-gray-600">test{selectedLabTests.length !== 1 ? 's' : ''} selected</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowLabOrderForm(false);
                                setSelectedLabTests([]);
                              }}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleOrderLabs}
                              disabled={selectedLabTests.length === 0 || labLoading}
                              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                            >
                              {labLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Ordering...
                                </>
                              ) : (
                                <>
                                  <FlaskConical className="w-4 h-4" />
                                  Order Labs
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Route Patient Modal */}
              <AnimatePresence>
                {showRouteModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowRouteModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 text-center">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <Send className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Route Patient</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Where should <span className="font-medium">{selectedVisit?.patient?.firstName}</span> go next?
                        </p>
                      </div>

                      {/* Options */}
                      <div className="p-4 space-y-3">
                        <button
                          onClick={() => handleRoutePatient('pharmacy')}
                          className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-green-50 border-2 border-transparent hover:border-green-300 transition-all group"
                        >
                          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <Pill className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="ml-4 text-left flex-1">
                            <p className="font-semibold text-gray-900">Pharmacy</p>
                            <p className="text-xs text-gray-500">For medication dispensing</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                          onClick={() => handleRoutePatient('lab')}
                          className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-purple-50 border-2 border-transparent hover:border-purple-300 transition-all group"
                        >
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <FlaskConical className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="ml-4 text-left flex-1">
                            <p className="font-semibold text-gray-900">Laboratory</p>
                            <p className="text-xs text-gray-500">For lab tests</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                          onClick={() => handleRoutePatient('billing')}
                          className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-amber-50 border-2 border-transparent hover:border-amber-300 transition-all group"
                        >
                          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                            <Receipt className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="ml-4 text-left flex-1">
                            <p className="font-semibold text-gray-900">Billing</p>
                            <p className="text-xs text-gray-500">For payment processing</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                          onClick={() => handleRoutePatient('complete')}
                          className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 border-2 border-transparent hover:border-blue-300 transition-all group"
                        >
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="ml-4 text-left flex-1">
                            <p className="font-semibold text-gray-900">Complete Visit</p>
                            <p className="text-xs text-gray-500">Patient is done for today</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => setShowRouteModal(false)}
                          className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lab Results Modal */}
              <AnimatePresence>
                {showLabResultsModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowLabResultsModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                    >
                      {/* Header */}
                      <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shadow-sm">
                              <FlaskConical className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Lab Results</h3>
                              <p className="text-sm text-gray-600">
                                {selectedVisit?.patient?.firstName} {selectedVisit?.patient?.lastName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowLabResultsModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 overflow-y-auto flex-1">
                        {(() => {
                          const completedLabOrders = selectedVisit?.consultations?.flatMap(
                            c => c.labOrders?.filter(lo => lo.status === 'COMPLETED' && lo.results?.length > 0) || []
                          ) || [];
                          
                          if (completedLabOrders.length === 0) {
                            return (
                              <div className="text-center py-12 text-gray-500">
                                <FlaskConical className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p>No completed lab results available</p>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-6">
                              {completedLabOrders.map((order) => (
                                <div key={order.id} className="border rounded-xl overflow-hidden">
                                  {/* Order Header */}
                                  <div className="bg-gray-50 px-4 py-3 border-b">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="font-semibold text-gray-900">
                                          Lab Order #{order.orderNumber}
                                        </span>
                                        <span className="ml-3 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                          Completed
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {order.completedAt && new Date(order.completedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                    {order.clinicalNotes && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Notes:</span> {order.clinicalNotes}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {/* Results Table */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full">
                                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                          <th className="px-4 py-3 text-left font-medium">Test Name</th>
                                          <th className="px-4 py-3 text-left font-medium">Result</th>
                                          <th className="px-4 py-3 text-left font-medium">Normal Range</th>
                                          <th className="px-4 py-3 text-left font-medium">Status</th>
                                          <th className="px-4 py-3 text-left font-medium">Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {order.results?.map((result) => (
                                          <tr key={result.id} className={
                                            result.flag === 'HIGH' || result.flag === 'LOW' || result.flag === 'CRITICAL'
                                              ? 'bg-red-50/50'
                                              : ''
                                          }>
                                            <td className="px-4 py-3">
                                              <span className="font-medium text-gray-900">{result.testName}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="flex items-center gap-2">
                                                <span className={`font-semibold ${
                                                  result.flag === 'HIGH' || result.flag === 'CRITICAL'
                                                    ? 'text-red-600'
                                                    : result.flag === 'LOW'
                                                    ? 'text-yellow-600'
                                                    : 'text-gray-900'
                                                }`}>
                                                  {result.result}
                                                </span>
                                                <span className="text-gray-500 text-sm">{result.unit}</span>
                                                {result.flag === 'HIGH' && <TrendingUp className="w-4 h-4 text-red-500" />}
                                                {result.flag === 'LOW' && <TrendingDown className="w-4 h-4 text-yellow-500" />}
                                                {result.flag === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                              {result.normalRange || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                              {result.flag ? (
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                  result.flag === 'NORMAL'
                                                    ? 'bg-green-100 text-green-800'
                                                    : result.flag === 'HIGH'
                                                    ? 'bg-red-100 text-red-800'
                                                    : result.flag === 'LOW'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : result.flag === 'CRITICAL'
                                                    ? 'bg-red-200 text-red-900'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                  {result.flag}
                                                </span>
                                              ) : (
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                  NORMAL
                                                </span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                              {result.notes || '-'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  
                                  {/* Verification Info */}
                                  {order.results?.some(r => r.verifiedAt) && (
                                    <div className="bg-green-50 px-4 py-2 border-t text-sm">
                                      <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>
                                          Verified on {new Date(order.results[0].verifiedAt).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-4 bg-gray-50 border-t flex-shrink-0">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setShowLabResultsModal(false)}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Patient Vitals Modal */}
              <AnimatePresence>
                {showVitalsModal && selectedVisit && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowVitalsModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                    >
                      {/* Header */}
                      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Activity className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Patient Vitals</h3>
                              <p className="text-sm text-gray-500">
                                {selectedVisit.patient?.firstName} {selectedVisit.patient?.lastName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowVitalsModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 overflow-y-auto">
                        {latestVitals ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {latestVitals.temperature && (
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                                    <Thermometer className="w-5 h-5" />
                                    <span className="text-sm font-medium">Temperature</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{latestVitals.temperature}°C</p>
                                </div>
                              )}
                              {latestVitals.bloodPressureSystolic && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                  <div className="flex items-center gap-2 text-red-600 mb-2">
                                    <Activity className="w-5 h-5" />
                                    <span className="text-sm font-medium">Blood Pressure</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic} mmHg
                                  </p>
                                </div>
                              )}
                              {latestVitals.heartRate && (
                                <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                                  <div className="flex items-center gap-2 text-pink-600 mb-2">
                                    <Heart className="w-5 h-5" />
                                    <span className="text-sm font-medium">Heart Rate</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{latestVitals.heartRate} bpm</p>
                                </div>
                              )}
                              {latestVitals.respiratoryRate && (
                                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200">
                                  <div className="flex items-center gap-2 text-cyan-600 mb-2">
                                    <Activity className="w-5 h-5" />
                                    <span className="text-sm font-medium">Respiratory Rate</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{latestVitals.respiratoryRate} /min</p>
                                </div>
                              )}
                              {latestVitals.oxygenSaturation && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                                    <Activity className="w-5 h-5" />
                                    <span className="text-sm font-medium">Oxygen Saturation</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{latestVitals.oxygenSaturation}%</p>
                                </div>
                              )}
                              {latestVitals.weight && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <span className="text-sm font-medium">Weight</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{latestVitals.weight} kg</p>
                                </div>
                              )}
                              {latestVitals.height && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <span className="text-sm font-medium">Height</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{latestVitals.height} cm</p>
                                </div>
                              )}
                              {latestVitals.bmi && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <span className="text-sm font-medium">BMI</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{latestVitals.bmi}</p>
                                </div>
                              )}
                            </div>
                            
                            {latestVitals.notes && (
                              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <p className="text-sm font-medium text-yellow-800 mb-1">Triage Notes</p>
                                <p className="text-gray-700">{latestVitals.notes}</p>
                              </div>
                            )}
                            
                            <div className="text-sm text-gray-500 mt-4">
                              Recorded: {new Date(latestVitals.recordedAt).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No vitals recorded for this visit</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Patient History Modal */}
              <AnimatePresence>
                {showHistoryModal && selectedVisit && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowHistoryModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
                    >
                      {/* Header */}
                      <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                              <ClipboardList className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Patient History</h3>
                              <p className="text-sm text-gray-500">
                                {selectedVisit.patient?.firstName} {selectedVisit.patient?.lastName} - MRN: {selectedVisit.patient?.mrn}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowHistoryModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 overflow-y-auto">
                        {/* Patient Demographics */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Demographics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500">Date of Birth</p>
                              <p className="font-medium text-gray-900">
                                {selectedVisit.patient?.dateOfBirth 
                                  ? new Date(selectedVisit.patient.dateOfBirth).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500">Gender</p>
                              <p className="font-medium text-gray-900">
                                {selectedVisit.patient?.gender || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="font-medium text-gray-900">
                                {selectedVisit.patient?.phone || 'N/A'}
                              </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-xs text-gray-500">Blood Type</p>
                              <p className="font-medium text-gray-900">
                                {selectedVisit.patient?.bloodType || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Chief Complaint for Current Visit */}
                        {selectedVisit.chiefComplaint && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Chief Complaint</h4>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                              <p className="text-gray-800">{selectedVisit.chiefComplaint}</p>
                            </div>
                          </div>
                        )}

                        {/* Previous Consultations */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Consultation History</h4>
                          {selectedVisit.consultations && selectedVisit.consultations.length > 0 ? (
                            <div className="space-y-4">
                              {selectedVisit.consultations.map((consultation, idx) => (
                                <div key={consultation.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                      Consultation #{idx + 1}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(consultation.consultationDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {consultation.presentingComplaint && (
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-500">Presenting Complaint</p>
                                      <p className="text-sm text-gray-800">{consultation.presentingComplaint}</p>
                                    </div>
                                  )}
                                  {consultation.provisionalDiagnosis && (
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-500">Provisional Diagnosis</p>
                                      <p className="text-sm text-gray-800">{consultation.provisionalDiagnosis}</p>
                                    </div>
                                  )}
                                  {consultation.finalDiagnosis && (
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-500">Final Diagnosis</p>
                                      <p className="text-sm font-medium text-gray-900">{consultation.finalDiagnosis}</p>
                                    </div>
                                  )}
                                  
                                  {/* Diagnoses */}
                                  {consultation.diagnoses && consultation.diagnoses.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <p className="text-xs text-gray-500 mb-2">ICD Diagnoses</p>
                                      <div className="flex flex-wrap gap-2">
                                        {consultation.diagnoses.map((diag) => (
                                          <span key={diag.id} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                            {diag.icdCode}: {diag.diagnosisName}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-xl">
                              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No previous consultations</p>
                            </div>
                          )}
                        </div>

                        {/* Allergies */}
                        {selectedVisit.patient?.allergies && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Allergies</h4>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                              <p className="text-red-800">{selectedVisit.patient.allergies}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-4 bg-gray-50 border-t flex-shrink-0">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setShowHistoryModal(false)}
                            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
    </div>
  );
}
