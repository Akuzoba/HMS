import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useVisitStore } from '../../store/visitStore';
import { useVitalStore } from '../../store/vitalStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Stethoscope, Heart, Thermometer, Scale, Ruler, Wind, Droplets,
  Activity, User, Clock, ArrowRight, CheckCircle, X, Search,
  AlertTriangle, FileText
} from 'lucide-react';

const vitalSchema = z.object({
  visitId: z.string().min(1, 'Please select a visit'),
  temperature: z.coerce
    .number()
    .min(20, 'Temperature too low')
    .max(50, 'Temperature too high')
    .optional()
    .nullable(),
  bloodPressureSystolic: z.coerce
    .number()
    .min(50, 'Invalid BP')
    .max(250, 'Invalid BP')
    .optional()
    .nullable(),
  bloodPressureDiastolic: z.coerce
    .number()
    .min(30, 'Invalid BP')
    .max(150, 'Invalid BP')
    .optional()
    .nullable(),
  heartRate: z.coerce
    .number()
    .min(30, 'Heart rate too low')
    .max(250, 'Heart rate too high')
    .optional()
    .nullable(),
  respiratoryRate: z.coerce
    .number()
    .min(5, 'Respiratory rate too low')
    .max(60, 'Respiratory rate too high')
    .optional()
    .nullable(),
  oxygenSaturation: z.coerce
    .number()
    .min(50, 'O2 saturation too low')
    .max(100, 'O2 saturation too high')
    .optional()
    .nullable(),
  weight: z.coerce
    .number()
    .min(0.5, 'Weight too low')
    .max(500, 'Weight too high')
    .optional()
    .nullable(),
  height: z.coerce
    .number()
    .min(20, 'Height too low')
    .max(300, 'Height too high')
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

export default function TriagePage() {
  const { user } = useAuthStore();
  const { visits, listVisits, updateVisit } = useVisitStore();
  const { recordVitals, loading, error } = useVitalStore();
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routingTo, setRoutingTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(vitalSchema),
    defaultValues: {
      visitId: '',
      temperature: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      heartRate: null,
      respiratoryRate: null,
      oxygenSaturation: null,
      weight: null,
      height: null,
      notes: '',
    },
  });

  const visitId = watch('visitId');
  const weight = watch('weight');
  const height = watch('height');

  // Calculate BMI
  const bmi =
    weight && height
      ? (weight / Math.pow(height / 100, 2)).toFixed(1)
      : null;

  // Load pending visits (CHECKED_IN = just arrived, IN_TRIAGE = being processed)
  useEffect(() => {
    listVisits({ status: 'CHECKED_IN,IN_TRIAGE' });
  }, [listVisits]);

  // Update selected visit
  useEffect(() => {
    if (visitId) {
      const visit = (visits || []).find((v) => v.id === visitId);
      setSelectedVisit(visit);
    } else {
      setSelectedVisit(null);
    }
  }, [visitId, visits]);

  // Filter visits by search
  const filteredVisits = (visits || []).filter(visit => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      visit.patient?.firstName?.toLowerCase().includes(term) ||
      visit.patient?.lastName?.toLowerCase().includes(term) ||
      visit.visitNumber?.toLowerCase().includes(term) ||
      visit.patient?.patientNumber?.toLowerCase().includes(term)
    );
  });

  const handleRoutePatient = async (destination) => {
    if (!selectedVisit) return;
    
    setRoutingTo(destination);
    try {
      const statusMap = {
        'doctor': 'WITH_DOCTOR',
        'lab': 'WITH_LAB'
      };
      
      await updateVisit(selectedVisit.id, { status: statusMap[destination] });
      toast.success(`Patient routed to ${destination === 'doctor' ? 'Doctor' : 'Laboratory'}`);
      setShowRouteModal(false);
      setSelectedVisit(null);
      reset();
      listVisits({ status: 'CHECKED_IN,IN_TRIAGE' });
    } catch (err) {
      toast.error('Failed to route patient');
    } finally {
      setRoutingTo('');
    }
  };

  const onSubmit = async (data) => {
    if (!selectedVisit?.id) {
      toast.error('Please select a patient first');
      return;
    }
    
    try {
      // Remove null/empty values but always keep visitId
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(
          ([key, v]) => key === 'visitId' || (v !== null && v !== undefined && v !== '')
        )
      );
      
      // Ensure visitId is set
      cleanData.visitId = selectedVisit.id;

      await recordVitals(cleanData);
      
      // Update visit status to IN_TRIAGE
      await updateVisit(selectedVisit.id, { status: 'IN_TRIAGE' });
      
      toast.success('Vitals recorded successfully!');
      setShowRouteModal(true); // Show routing modal after recording vitals
      
      // Refresh visits list
      listVisits({ status: 'CHECKED_IN,IN_TRIAGE' });
    } catch (err) {
      toast.error('Failed to record vitals');
      console.error('Failed to record vitals:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Stethoscope className="text-primary-600" />
          Triage - Record Vital Signs
        </h1>
        <p className="text-gray-600">Record patient vital signs and route to appropriate department</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Visits List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-lg shadow p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Patient Queue</h2>
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm font-medium">
                {filteredVisits.length} waiting
              </span>
            </div>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {filteredVisits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>No patients in queue</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {filteredVisits.map((visit) => (
                  <motion.div
                    key={visit.id}
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      visitId === visit.id
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-300 hover:shadow'
                    }`}
                    onClick={() => reset({ ...watch(), visitId: visit.id })}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <p className="font-semibold text-gray-900">
                            {visit.patient?.firstName} {visit.patient?.lastName}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          {visit.patient?.patientNumber}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            visit.visitType === 'EMERGENCY' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {visit.visitType?.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(visit.visitDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        {visit.chiefComplaint && (
                          <p className="text-xs text-gray-600 mt-2 italic line-clamp-2">
                            "{visit.chiefComplaint}"
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        visit.status === 'CHECKED_IN'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {visit.status === 'CHECKED_IN' ? 'Waiting' : 'In Triage'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Vitals Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Record Vital Signs</h2>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-green-800">{successMessage}</p>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {!selectedVisit ? (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <p className="mt-4 text-lg">Select a pending visit to record vitals</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Patient Info Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Patient: {selectedVisit.patient?.firstName}{' '}
                    {selectedVisit.patient?.lastName}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Visit:</span>{' '}
                      {selectedVisit.visitNumber}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{' '}
                      {selectedVisit.visitType?.replace('_', ' ')}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Chief Complaint:</span>{' '}
                      {selectedVisit.chiefComplaint || 'None'}
                    </div>
                  </div>
                </div>

                {/* Temperature & Heart Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('temperature')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="36.5"
                    />
                    {errors.temperature && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.temperature.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      {...register('heartRate')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="72"
                    />
                    {errors.heartRate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.heartRate.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Pressure (mmHg)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        {...register('bloodPressureSystolic')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Systolic (120)"
                      />
                      {errors.bloodPressureSystolic && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.bloodPressureSystolic.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="number"
                        {...register('bloodPressureDiastolic')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Diastolic (80)"
                      />
                      {errors.bloodPressureDiastolic && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.bloodPressureDiastolic.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Respiratory Rate & O2 Saturation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Respiratory Rate (breaths/min)
                    </label>
                    <input
                      type="number"
                      {...register('respiratoryRate')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="16"
                    />
                    {errors.respiratoryRate && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.respiratoryRate.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      O₂ Saturation (%)
                    </label>
                    <input
                      type="number"
                      {...register('oxygenSaturation')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="98"
                    />
                    {errors.oxygenSaturation && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.oxygenSaturation.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Weight, Height & BMI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('weight')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="70"
                    />
                    {errors.weight && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.weight.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('height')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="170"
                    />
                    {errors.height && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.height.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BMI (Auto-calculated)
                    </label>
                    <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                      {bmi || '-'}
                      {bmi && (
                        <span className="ml-2 text-xs text-gray-500">
                          {bmi < 18.5
                            ? 'Underweight'
                            : bmi < 25
                            ? 'Normal'
                            : bmi < 30
                            ? 'Overweight'
                            : 'Obese'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Additional observations or notes..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setSelectedVisit(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? 'Recording...' : (
                      <>
                        <CheckCircle size={18} />
                        Record Vitals & Route
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {/* Route Patient Modal */}
      <AnimatePresence>
        {showRouteModal && selectedVisit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowRouteModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Route Patient</h3>
                  <button
                    onClick={() => setShowRouteModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-4">
                    <CheckCircle className="text-green-600" size={24} />
                    <div>
                      <p className="font-medium text-green-800">Vitals Recorded Successfully</p>
                      <p className="text-sm text-green-600">
                        {selectedVisit.patient?.firstName} {selectedVisit.patient?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">
                    Where should this patient be routed next?
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handleRoutePatient('doctor')}
                    disabled={!!routingTo}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200">
                        <Stethoscope className="text-primary-600" size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Doctor Consultation</p>
                        <p className="text-sm text-gray-500">Send to consulting doctor</p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400 group-hover:text-primary-600" size={20} />
                  </button>

                  <button
                    onClick={() => handleRoutePatient('lab')}
                    disabled={!!routingTo}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center group-hover:bg-cyan-200">
                        <FileText className="text-cyan-600" size={24} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">Laboratory</p>
                        <p className="text-sm text-gray-500">Send for lab tests first</p>
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400 group-hover:text-cyan-600" size={20} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowRouteModal(false);
                    setSelectedVisit(null);
                    reset();
                  }}
                  className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Route Later
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
