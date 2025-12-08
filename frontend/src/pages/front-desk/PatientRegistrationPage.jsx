import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { usePatientStore } from '@/store/patientStore';
import { useVisitStore } from '@/store/visitStore';
import { 
  ArrowLeft, Save, UserPlus, ClipboardList, CheckCircle, Copy, 
  AlertTriangle, Users, Calendar, Phone, ChevronDown, ChevronUp 
} from 'lucide-react';

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { required_error: 'Gender is required' }),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional()
});

export default function PatientRegistrationPage() {
  const navigate = useNavigate();
  const { createPatient, clearDuplicateCheck, potentialDuplicates } = usePatientStore();
  const { createVisit } = useVisitStore();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);
  const [addingToQueue, setAddingToQueue] = useState(false);
  const [visitType, setVisitType] = useState('OPD');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [pendingPatientData, setPendingPatientData] = useState(null);
  const [expandedMatch, setExpandedMatch] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(patientSchema)
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Patient ID copied to clipboard');
  };

  const handleAddToQueue = async () => {
    if (!registeredPatient?.id) {
      toast.error('Patient data not available');
      return;
    }
    
    setAddingToQueue(true);
    try {
      await createVisit({
        patientId: registeredPatient.id,
        visitType: visitType,
        chiefComplaint: chiefComplaint?.trim() || 'General consultation'
      });
      toast.success('Patient added to queue successfully');
      setShowSuccessModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Add to queue error:', error);
      toast.error('Failed to add patient to queue');
    } finally {
      setAddingToQueue(false);
    }
  };

  const handleRegisterAnother = () => {
    setShowSuccessModal(false);
    setRegisteredPatient(null);
    setChiefComplaint('');
    setDuplicateWarning(null);
    setPendingPatientData(null);
    clearDuplicateCheck();
    reset();
  };

  // Handle proceeding despite duplicate warning
  const handleProceedAnyway = async () => {
    if (!pendingPatientData) return;
    
    setLoading(true);
    setShowDuplicateModal(false);
    
    const result = await createPatient(pendingPatientData, true); // confirmNotDuplicate = true
    setLoading(false);

    if (result.success && !result.isDuplicateWarning) {
      setRegisteredPatient(result.data);
      setShowSuccessModal(true);
      setPendingPatientData(null);
      setDuplicateWarning(null);
      clearDuplicateCheck();
    } else {
      toast.error(result.error || 'Failed to register patient');
    }
  };

  // Navigate to existing patient
  const handleUseExistingPatient = (patient) => {
    setShowDuplicateModal(false);
    navigate(`/patients/${patient.id}`);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    
    // Convert date to ISO format
    const formattedData = {
      ...data,
      dateOfBirth: new Date(data.dateOfBirth).toISOString()
    };

    const result = await createPatient(formattedData);
    setLoading(false);

    // Check for duplicate warning
    if (result.isDuplicateWarning || result.isDuplicateError) {
      setPendingPatientData(formattedData);
      setDuplicateWarning(result.duplicateCheck);
      setShowDuplicateModal(true);
      return;
    }

    if (result.success) {
      setRegisteredPatient(result.data);
      setShowSuccessModal(true);
    } else {
      toast.error(result.error || 'Failed to register patient');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          icon={<ArrowLeft size={20} />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Patient Registration</h1>
          <p className="text-neutral-600 mt-1">Register a new patient into the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="First Name"
                {...register('firstName')}
                error={errors.firstName?.message}
                placeholder="John"
                required
              />
              <Input
                label="Middle Name"
                {...register('middleName')}
                placeholder="Optional"
              />
              <Input
                label="Last Name"
                {...register('lastName')}
                error={errors.lastName?.message}
                placeholder="Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Date of Birth"
                type="date"
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
                required
              />
              <Select
                label="Gender"
                {...register('gender')}
                error={errors.gender?.message}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' }
                ]}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                {...register('phoneNumber')}
                error={errors.phoneNumber?.message}
                placeholder="+233 XX XXX XXXX"
                required
              />
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Address"
                {...register('address')}
                placeholder="House number, street name"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="City"
                {...register('city')}
                placeholder="Accra"
              />
              <Select
                label="Region"
                {...register('region')}
                options={[
                  { value: 'Greater Accra', label: 'Greater Accra' },
                  { value: 'Ashanti', label: 'Ashanti' },
                  { value: 'Western', label: 'Western' },
                  { value: 'Eastern', label: 'Eastern' },
                  { value: 'Northern', label: 'Northern' }
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Emergency Contact Name"
                {...register('emergencyContact')}
                placeholder="Jane Doe"
              />
              <Input
                label="Emergency Contact Phone"
                type="tel"
                {...register('emergencyPhone')}
                placeholder="+233 XX XXX XXXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Blood Group"
                {...register('bloodGroup')}
                options={[
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' }
                ]}
              />
              <div></div>
            </div>

            <div className="space-y-4 mt-4">
              <Textarea
                label="Known Allergies"
                {...register('allergies')}
                placeholder="List any known allergies..."
                rows={3}
              />
              <Textarea
                label="Chronic Conditions"
                {...register('chronicConditions')}
                placeholder="List any chronic conditions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Insurance Provider"
                {...register('insuranceProvider')}
                placeholder="NHIS"
              />
              <Input
                label="Insurance Number"
                {...register('insuranceNumber')}
                placeholder="INS-XXXX-XXXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Save size={20} />}
            loading={loading}
          >
            Register Patient
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Patient Registered Successfully"
        size="md"
      >
        {registeredPatient && (
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
            </div>

            {/* Patient Details */}
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Patient ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary-600">{registeredPatient.patientNumber}</span>
                  <button
                    onClick={() => copyToClipboard(registeredPatient.patientNumber)}
                    className="p-1 hover:bg-neutral-200 rounded"
                  >
                    <Copy size={16} className="text-neutral-500" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Name</span>
                <span className="font-semibold text-neutral-900">
                  {registeredPatient.firstName} {registeredPatient.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Phone</span>
                <span className="text-neutral-700">{registeredPatient.phoneNumber}</span>
              </div>
              {registeredPatient.bloodGroup && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Blood Group</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-sm font-medium">
                    {registeredPatient.bloodGroup}
                  </span>
                </div>
              )}
            </div>

            {/* Add to Queue Section */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium text-neutral-900 flex items-center gap-2">
                <ClipboardList size={18} />
                Add to Visit Queue
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {['OPD', 'EMERGENCY', 'FOLLOW_UP'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVisitType(type)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      visitType === type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    {type === 'OPD' && '🏥 OPD Visit'}
                    {type === 'EMERGENCY' && '🚨 Emergency'}
                    {type === 'FOLLOW_UP' && '📋 Follow-up'}
                  </button>
                ))}
              </div>

              <Textarea
                label="Chief Complaint (Optional)"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Brief description of why patient is visiting..."
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleRegisterAnother}
                icon={<UserPlus size={18} />}
              >
                Register Another
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleAddToQueue}
                loading={addingToQueue}
                icon={<ClipboardList size={18} />}
              >
                Add to Queue
              </Button>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/patients/${registeredPatient.id}`)}
              className="w-full text-center text-sm text-primary-600 hover:underline"
            >
              View Patient Profile →
            </button>
          </div>
        )}
      </Modal>

      {/* Duplicate Warning Modal */}
      <Modal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setPendingPatientData(null);
        }}
        title=""
        size="lg"
      >
        <div className="space-y-5">
          {/* Warning Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <AlertTriangle size={32} className="text-amber-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              Potential Duplicate Patient Found
            </h3>
            <p className="text-neutral-600">
              {duplicateWarning?.message || 'We found patients with similar information in the system.'}
            </p>
          </div>

          {/* Match Summary */}
          {duplicateWarning && (
            <div className="flex justify-center gap-4 text-sm">
              {duplicateWarning.definiteMatchCount > 0 && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                  {duplicateWarning.definiteMatchCount} Definite Match{duplicateWarning.definiteMatchCount > 1 ? 'es' : ''}
                </span>
              )}
              {duplicateWarning.probableMatchCount > 0 && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                  {duplicateWarning.probableMatchCount} Probable Match{duplicateWarning.probableMatchCount > 1 ? 'es' : ''}
                </span>
              )}
              {duplicateWarning.possibleMatchCount > 0 && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {duplicateWarning.possibleMatchCount} Possible Match{duplicateWarning.possibleMatchCount > 1 ? 'es' : ''}
                </span>
              )}
            </div>
          )}

          {/* Potential Matches List */}
          <div className="max-h-80 overflow-y-auto space-y-3">
            {duplicateWarning?.matches?.map((match, index) => (
              <div
                key={match.patient.id}
                className={`border rounded-lg p-4 transition-all ${
                  match.confidence === 'DEFINITE_MATCH' 
                    ? 'border-red-300 bg-red-50' 
                    : match.confidence === 'PROBABLE_MATCH'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-blue-300 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border">
                        <Users size={20} className="text-neutral-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900">
                          {match.patient.firstName} {match.patient.middleName} {match.patient.lastName}
                        </h4>
                        <p className="text-sm text-neutral-600 font-mono">
                          {match.patient.patientNumber}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Calendar size={14} />
                        <span>
                          {match.patient.dateOfBirth 
                            ? new Date(match.patient.dateOfBirth).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <Phone size={14} />
                        <span>{match.patient.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>

                    {match.patient.lastVisit && (
                      <p className="mt-2 text-xs text-neutral-500">
                        Last visit: {new Date(match.patient.lastVisit.visitDate).toLocaleDateString()} ({match.patient.lastVisit.visitType})
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      match.score >= 95 ? 'text-red-600' :
                      match.score >= 80 ? 'text-amber-600' :
                      'text-blue-600'
                    }`}>
                      {match.score}%
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      match.confidence === 'DEFINITE_MATCH' 
                        ? 'bg-red-200 text-red-800' 
                        : match.confidence === 'PROBABLE_MATCH'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {match.confidence.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Expandable Match Details */}
                <button
                  type="button"
                  onClick={() => setExpandedMatch(expandedMatch === index ? null : index)}
                  className="mt-3 text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                >
                  {expandedMatch === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expandedMatch === index ? 'Hide' : 'Show'} match details
                </button>

                {expandedMatch === index && match.breakdown && (
                  <div className="mt-2 p-2 bg-white/50 rounded text-xs space-y-1">
                    {Object.entries(match.breakdown).map(([field, score]) => (
                      <div key={field} className="flex justify-between">
                        <span className="text-neutral-600 capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                        <span className={`font-medium ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {score}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Use This Patient Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleUseExistingPatient(match.patient)}
                >
                  Use This Patient Record
                </Button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowDuplicateModal(false);
                setPendingPatientData(null);
              }}
            >
              Cancel Registration
            </Button>
            <Button
              type="button"
              variant={duplicateWarning?.definiteMatchCount > 0 ? 'danger' : 'primary'}
              className="flex-1"
              onClick={handleProceedAnyway}
              loading={loading}
            >
              {duplicateWarning?.definiteMatchCount > 0 
                ? 'Create Anyway (Not Recommended)'
                : 'Create New Patient'}
            </Button>
          </div>

          {duplicateWarning?.definiteMatchCount > 0 && (
            <p className="text-xs text-red-600 text-center">
              ⚠️ Creating a duplicate record may cause data inconsistency issues
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
