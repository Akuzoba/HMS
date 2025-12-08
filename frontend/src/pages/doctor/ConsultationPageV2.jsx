/**
 * ConsultationPageV2 - Enhanced Consultation Page with Clinical Templates
 * 
 * This is an enhanced version of the consultation page that integrates:
 * - EnhancedConsultationForm with smart sentence builders
 * - EnhancedPrescriptionModal with smart drug autocomplete
 * - DynamicExamForm for physical examination
 * 
 * To use this version, update your routes to point to ConsultationPageV2
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Activity, 
  FlaskConical, 
  CheckCircle,
  ClipboardList,
  Stethoscope,
  ArrowRight,
  Eye,
  TrendingUp,
  Heart,
  Thermometer,
  Clock,
  Building2,
  Receipt,
  Pill,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useVisitStore } from '../../store/visitStore';
import { useVitalStore } from '../../store/vitalStore';
import { useConsultationStore } from '../../store/consultationStore';
import { usePrescriptionStore, usePharmacyStore } from '../../store/prescriptionStore';
import { useLabStore } from '../../store/labStore';
import { useConsultationUIStore } from '../../store/consultationUIStore';
import { toast } from 'sonner';

// Import enhanced components
import { EnhancedConsultationForm, EnhancedPrescriptionModal } from '../../components/doctor';

// Validation schema
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

export default function ConsultationPageV2() {
  const { visits, listVisits, updateVisit } = useVisitStore();
  const { vitals, getVisitVitals } = useVitalStore();
  const { createConsultation, updateConsultation, loading, error } = useConsultationStore();
  const { createPrescription, loading: prescriptionLoading } = usePrescriptionStore();
  const { listDrugs } = usePharmacyStore();
  const { labTests, listLabTests, createLabOrder, loading: labLoading } = useLabStore();
  
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabOrderForm, setShowLabOrderForm] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showLabResultsModal, setShowLabResultsModal] = useState(false);
  const [currentConsultationId, setCurrentConsultationId] = useState(null);
  const [selectedLabTests, setSelectedLabTests] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
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

  const visitId = watch('visitId');

  // Load visits
  useEffect(() => {
    listVisits({ status: 'WITH_DOCTOR,IN_PROGRESS' });
    listLabTests();
    listDrugs();
  }, [listVisits, listLabTests, listDrugs]);

  // Update selected visit
  useEffect(() => {
    if (visitId) {
      const visit = visits.find((v) => v.id === visitId);
      setSelectedVisit(visit);
      getVisitVitals(visitId);
      
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

  // Sync with sidebar
  const { pendingAction, clearAction, setConsultationActive } = useConsultationUIStore();
  
  useEffect(() => {
    setConsultationActive(!!currentConsultationId);
  }, [currentConsultationId, setConsultationActive]);

  useEffect(() => {
    if (pendingAction && currentConsultationId) {
      switch (pendingAction) {
        case 'prescription':
          setShowPrescriptionModal(true);
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

  const isLabReturnPatient = selectedVisit?.consultations?.some(
    c => c.labOrders?.some(lo => lo.status === 'COMPLETED' && lo.results?.length > 0)
  );

  const existingConsultationId = selectedVisit?.consultations?.[0]?.id;

  // Form submission
  const onSubmit = async (data) => {
    try {
      if (isLabReturnPatient && existingConsultationId) {
        await updateConsultation(existingConsultationId, {
          finalDiagnosis: data.finalDiagnosis,
          treatmentPlan: data.treatmentPlan,
        });
        setCurrentConsultationId(existingConsultationId);
        toast.success('Diagnosis updated successfully!');
      } else {
        const consultation = await createConsultation(data);
        setCurrentConsultationId(consultation.id);
        toast.success('Consultation saved successfully!');
      }
    } catch (err) {
      console.error('Consultation error:', err);
      toast.error('Failed to save consultation');
    }
  };

  // Prescription submission
  const handlePrescriptionSubmit = async (data) => {
    if (!currentConsultationId || !selectedVisit) {
      toast.error('Please save the consultation first');
      return;
    }
    try {
      await createPrescription({
        consultationId: currentConsultationId,
        patientId: selectedVisit.patient?.id,
        visitId: selectedVisit.id,
        items: data.items,
        instructions: data.instructions,
      });
      toast.success('Prescription created successfully!');
      setShowPrescriptionModal(false);
    } catch (err) {
      toast.error('Failed to create prescription');
    }
  };

  // Lab order submission
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
      toast.success('Lab tests ordered!');
      setSelectedLabTests([]);
      setShowLabOrderForm(false);
      reset();
      setSelectedVisit(null);
      setCurrentConsultationId(null);
      await listVisits({ status: 'WITH_DOCTOR,IN_PROGRESS' });
    } catch (err) {
      toast.error('Failed to order labs');
    }
  };

  // Route patient
  const handleRoutePatient = async (destination) => {
    if (!selectedVisit) return;
    try {
      const statusMap = {
        pharmacy: { status: 'WITH_PHARMACY', message: 'Patient sent to Pharmacy' },
        lab: { status: 'WITH_LAB', message: 'Patient sent to Laboratory' },
        billing: { status: 'BILLING', message: 'Patient sent to Billing' },
        complete: { status: 'COMPLETED', message: 'Visit completed' },
      };
      const { status, message } = statusMap[destination] || statusMap.complete;
      await updateVisit(selectedVisit.id, { status });
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

  const handleReset = () => {
    reset();
    setSelectedVisit(null);
    setCurrentConsultationId(null);
  };

  const latestVitals = vitals[0];
  const completedLabOrders = selectedVisit?.consultations?.flatMap(
    c => c.labOrders?.filter(lo => lo.status === 'COMPLETED' && lo.results?.length > 0) || []
  ) || [];
  const hasLabResults = completedLabOrders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Doctor's Console
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-medium rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Enhanced
                  </span>
                </h1>
                <p className="text-sm text-gray-500">Clinical Documentation with Smart Templates</p>
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
          {/* Left Sidebar */}
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
                    <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No patients waiting</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {visits.map((visit) => {
                      const hasLab = visit.consultations?.some(
                        c => c.labOrders?.some(lo => lo.status === 'COMPLETED')
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
                          onClick={() => reset({ ...watch(), visitId: visit.id })}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {visit.patient?.firstName?.charAt(0)}{visit.patient?.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {visit.patient?.firstName} {visit.patient?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {visit.visitType?.replace('_', ' ')}
                              </p>
                            </div>
                            {hasLab && <FlaskConical className="w-4 h-4 text-purple-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {currentConsultationId && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</h3>
                <button
                  onClick={() => setShowPrescriptionModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-xl text-green-700 transition-colors"
                >
                  <Pill className="w-5 h-5" />
                  <span className="font-medium">Add Prescription</span>
                </button>
                <button
                  onClick={() => setShowLabOrderForm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-700 transition-colors"
                >
                  <FlaskConical className="w-5 h-5" />
                  <span className="font-medium">Order Labs</span>
                </button>
                <button
                  onClick={() => setShowRouteModal(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-700 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                  <span className="font-medium">Route Patient</span>
                </button>
              </div>
            )}

            {/* Lab Results Banner */}
            {hasLabResults && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FlaskConical className="w-5 h-5" />
                  <span className="font-semibold">Lab Results Ready</span>
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

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {!selectedVisit ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Stethoscope className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready for Consultation</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Select a patient from the queue to begin consultation with smart clinical templates.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">
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
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vitals */}
                  {latestVitals && (
                    <div className="p-4 bg-gray-50 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {latestVitals.temperature && (
                          <VitalCard icon={Thermometer} label="Temp" value={`${latestVitals.temperature}°C`} color="orange" />
                        )}
                        {latestVitals.bloodPressureSystolic && (
                          <VitalCard icon={Activity} label="BP" value={`${latestVitals.bloodPressureSystolic}/${latestVitals.bloodPressureDiastolic}`} color="red" />
                        )}
                        {latestVitals.heartRate && (
                          <VitalCard icon={Heart} label="HR" value={`${latestVitals.heartRate} bpm`} color="pink" />
                        )}
                        {latestVitals.oxygenSaturation && (
                          <VitalCard icon={TrendingUp} label="SpO₂" value={`${latestVitals.oxygenSaturation}%`} color="blue" />
                        )}
                        {latestVitals.weight && (
                          <VitalCard icon={Activity} label="Weight" value={`${latestVitals.weight} kg`} color="gray" />
                        )}
                        {latestVitals.bmi && (
                          <VitalCard icon={Activity} label="BMI" value={latestVitals.bmi} color="gray" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Consultation Form */}
                <EnhancedConsultationForm
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  loading={loading}
                  onSubmit={handleSubmit(onSubmit)}
                  hasLabResults={hasLabResults}
                  onReset={handleReset}
                  currentConsultationId={currentConsultationId}
                />

                {/* Consultation Status */}
                {currentConsultationId && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-800 font-medium">Consultation saved. You can now add prescriptions or order labs.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Prescription Modal */}
      <EnhancedPrescriptionModal
        isOpen={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        onSubmit={handlePrescriptionSubmit}
        loading={prescriptionLoading}
        patientName={selectedVisit ? `${selectedVisit.patient?.firstName} ${selectedVisit.patient?.lastName}` : ''}
      />

      {/* Lab Order Modal */}
      <AnimatePresence>
        {showLabOrderForm && (
          <LabOrderModal
            labTests={labTests}
            selectedLabTests={selectedLabTests}
            setSelectedLabTests={setSelectedLabTests}
            onClose={() => {
              setShowLabOrderForm(false);
              setSelectedLabTests([]);
            }}
            onOrder={handleOrderLabs}
            loading={labLoading}
          />
        )}
      </AnimatePresence>

      {/* Route Modal */}
      <AnimatePresence>
        {showRouteModal && (
          <RouteModal
            onClose={() => setShowRouteModal(false)}
            onRoute={handleRoutePatient}
          />
        )}
      </AnimatePresence>

      {/* Lab Results Modal */}
      <AnimatePresence>
        {showLabResultsModal && (
          <LabResultsModal
            labOrders={completedLabOrders}
            onClose={() => setShowLabResultsModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Vital Card Component
function VitalCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    orange: 'text-orange-600',
    red: 'text-red-600',
    pink: 'text-pink-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600',
  };
  
  return (
    <div className="bg-white p-3 rounded-xl border border-gray-200">
      <div className={`flex items-center gap-2 ${colorClasses[color]} mb-1`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Lab Order Modal Component
function LabOrderModal({ labTests, selectedLabTests, setSelectedLabTests, onClose, onOrder, loading }) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-violet-50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            Order Lab Tests
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(labTests || []).map((test) => (
            <label
              key={test.id}
              className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                selectedLabTests.includes(test.id)
                  ? 'bg-purple-50 border-2 border-purple-300'
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
                className="w-4 h-4 text-purple-600 rounded"
              />
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">{test.name}</p>
                <p className="text-xs text-gray-500">{test.category}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
          <span className="text-sm text-gray-600">{selectedLabTests.length} selected</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">
              Cancel
            </button>
            <button
              onClick={onOrder}
              disabled={selectedLabTests.length === 0 || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Ordering...' : 'Order Labs'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Route Modal Component
function RouteModal({ onClose, onRoute }) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-blue-600" />
          Route Patient
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => onRoute('pharmacy')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 rounded-xl text-green-700"
          >
            <Pill className="w-5 h-5" />
            <span className="font-medium">Send to Pharmacy</span>
          </button>
          <button
            onClick={() => onRoute('lab')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-xl text-purple-700"
          >
            <FlaskConical className="w-5 h-5" />
            <span className="font-medium">Send to Laboratory</span>
          </button>
          <button
            onClick={() => onRoute('billing')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-xl text-yellow-700"
          >
            <Receipt className="w-5 h-5" />
            <span className="font-medium">Send to Billing</span>
          </button>
          <button
            onClick={() => onRoute('complete')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-700"
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Complete Visit</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

// Lab Results Modal Component
function LabResultsModal({ labOrders, onClose }) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-violet-50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-purple-600" />
            Lab Results
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {labOrders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{order.labTest?.name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(order.completedAt).toLocaleDateString()}
                </span>
              </div>
              {order.results?.map((result, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{result.parameter}</span>
                    <span className={`text-sm font-bold ${
                      result.isAbnormal ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {result.value} {result.unit}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Reference: {result.referenceRange}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
