import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  User, Phone, Mail, MapPin, Calendar, Droplets, AlertTriangle,
  Heart, Activity, FileText, Pill, FlaskConical, CreditCard,
  Clock, ChevronRight, Edit, UserPlus, ArrowLeft, Copy,
  Thermometer, Scale, Ruler, Stethoscope, ClipboardList, CheckCircle, XCircle
} from 'lucide-react';
import { usePatientStore } from '@/store/patientStore';
import { useVisitStore } from '@/store/visitStore';
import { useAuthStore } from '@/store/authStore';
import { useLabStore } from '@/store/labStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea } from '@/components/ui/Input';

export default function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentPatient, getPatientById, isLoading } = usePatientStore();
  const { visits, getPatientVisits, createVisit } = useVisitStore();
  const { getPatientLabHistory } = useLabStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [visitType, setVisitType] = useState('OPD');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [addingToQueue, setAddingToQueue] = useState(false);
  const [labHistory, setLabHistory] = useState([]);
  const [labLoading, setLabLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getPatientById(id);
      getPatientVisits(id);
    }
  }, [id, getPatientById, getPatientVisits]);

  // Load lab history when switching to labs tab
  useEffect(() => {
    if (activeTab === 'labs' && id) {
      setLabLoading(true);
      getPatientLabHistory(id)
        .then(data => setLabHistory(data || []))
        .catch(() => setLabHistory([]))
        .finally(() => setLabLoading(false));
    }
  }, [activeTab, id, getPatientLabHistory]);

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleAddToQueue = async () => {
    if (!currentPatient) return;
    
    setAddingToQueue(true);
    try {
      await createVisit({
        patientId: currentPatient.id,
        visitType,
        chiefComplaint: chiefComplaint || 'General consultation'
      });
      toast.success('Patient added to queue successfully');
      setShowQueueModal(false);
      setChiefComplaint('');
      getPatientVisits(id); // Refresh visits
    } catch (error) {
      toast.error('Failed to add patient to queue');
    } finally {
      setAddingToQueue(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_TRIAGE': 'bg-blue-100 text-blue-800',
      'WITH_DOCTOR': 'bg-purple-100 text-purple-800',
      'IN_LAB': 'bg-cyan-100 text-cyan-800',
      'AT_PHARMACY': 'bg-orange-100 text-orange-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Patient not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const patient = currentPatient;
  const activeVisit = (visits || []).find(v => !['COMPLETED', 'CANCELLED'].includes(v.status));
  const pastVisits = (visits || []).filter(v => ['COMPLETED', 'CANCELLED'].includes(v.status));
  const latestVitals = activeVisit?.vitals?.[0] || pastVisits[0]?.vitals?.[0];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'visits', label: 'Visit History', icon: ClipboardList },
    { id: 'vitals', label: 'Vitals', icon: Activity },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'labs', label: 'Lab Results', icon: FlaskConical },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {/* Patient Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">
                  {patient.firstName} {patient.middleName || ''} {patient.lastName}
                </h1>
                <div className="flex items-center gap-4 mt-1 text-primary-100">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {calculateAge(patient.dateOfBirth)}
                  </span>
                  <span>•</span>
                  <span>{patient.gender}</span>
                  {patient.bloodGroup && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Droplets size={14} />
                        {patient.bloodGroup}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div 
                className="bg-white/20 rounded-lg px-4 py-2 cursor-pointer hover:bg-white/30 transition"
                onClick={() => copyToClipboard(patient.patientNumber)}
              >
                <p className="text-primary-100 text-xs">Patient ID</p>
                <p className="text-white font-mono font-bold flex items-center gap-2">
                  {patient.patientNumber}
                  <Copy size={14} />
                </p>
              </div>
              {(user?.role?.name === 'FRONT_DESK' || user?.role?.name === 'ADMIN') && (
                <Button 
                  onClick={() => setShowQueueModal(true)}
                  className="bg-white text-primary-600 hover:bg-primary-50"
                  icon={<UserPlus size={18} />}
                >
                  Add to Queue
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Active Visit Banner */}
        {activeVisit && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-yellow-800">Active Visit:</span>
              <span className="text-yellow-700">{activeVisit.visitNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activeVisit.status)}`}>
                {activeVisit.status.replace('_', ' ')}
              </span>
            </div>
            <button 
              className="text-yellow-700 hover:text-yellow-900 text-sm font-medium flex items-center gap-1"
              onClick={() => setActiveTab('visits')}
            >
              View Details <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Contact Info Bar */}
        <div className="px-6 py-3 bg-neutral-50 flex items-center gap-6 text-sm flex-wrap">
          <span className="flex items-center gap-2 text-neutral-600">
            <Phone size={16} className="text-neutral-400" />
            {patient.phoneNumber}
          </span>
          {patient.email && (
            <span className="flex items-center gap-2 text-neutral-600">
              <Mail size={16} className="text-neutral-400" />
              {patient.email}
            </span>
          )}
          {patient.address && (
            <span className="flex items-center gap-2 text-neutral-600">
              <MapPin size={16} className="text-neutral-400" />
              {patient.address}, {patient.city}
            </span>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={18} />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Date of Birth</span>
                  <span className="font-medium">{formatDate(patient.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Gender</span>
                  <span className="font-medium">{patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Blood Group</span>
                  <span className="font-medium">{patient.bloodGroup || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Registered</span>
                  <span className="font-medium">{formatDate(patient.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone size={18} />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Name</span>
                  <span className="font-medium">{patient.emergencyContact || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phone</span>
                  <span className="font-medium">{patient.emergencyPhone || 'Not provided'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Insurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={18} />
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Provider</span>
                  <span className="font-medium">{patient.insuranceProvider || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Policy Number</span>
                  <span className="font-medium">{patient.insuranceNumber || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Medical Alerts */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={18} />
                  Medical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">Allergies</p>
                    <div className="bg-red-50 rounded-lg p-3 text-red-800">
                      {patient.allergies || 'No known allergies'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700 mb-2">Chronic Conditions</p>
                    <div className="bg-orange-50 rounded-lg p-3 text-orange-800">
                      {patient.chronicConditions || 'None recorded'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latest Vitals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={18} />
                  Latest Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestVitals ? (
                  <div className="space-y-3">
                    {latestVitals.bloodPressureSys && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-neutral-500">
                          <Heart size={16} /> BP
                        </span>
                        <span className="font-medium">
                          {latestVitals.bloodPressureSys}/{latestVitals.bloodPressureDia} mmHg
                        </span>
                      </div>
                    )}
                    {latestVitals.temperature && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-neutral-500">
                          <Thermometer size={16} /> Temp
                        </span>
                        <span className="font-medium">{latestVitals.temperature}°C</span>
                      </div>
                    )}
                    {latestVitals.pulseRate && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-neutral-500">
                          <Activity size={16} /> Pulse
                        </span>
                        <span className="font-medium">{latestVitals.pulseRate} bpm</span>
                      </div>
                    )}
                    {latestVitals.weight && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-neutral-500">
                          <Scale size={16} /> Weight
                        </span>
                        <span className="font-medium">{latestVitals.weight} kg</span>
                      </div>
                    )}
                    <p className="text-xs text-neutral-400 mt-2">
                      Recorded: {formatDateTime(latestVitals.recordedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-center py-4">No vitals recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'visits' && (
          <Card>
            <CardHeader>
              <CardTitle>Visit History</CardTitle>
            </CardHeader>
            <CardContent>
              {(visits || []).length === 0 ? (
                <p className="text-center text-neutral-500 py-8">No visits recorded</p>
              ) : (
                <div className="space-y-4">
                  {(visits || []).map((visit) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 rounded-lg border ${
                        !['COMPLETED', 'CANCELLED'].includes(visit.status)
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-medium text-primary-600">{visit.visitNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                              {visit.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded">{visit.visitType}</span>
                          </div>
                          <p className="text-sm text-neutral-600 mt-1">{visit.chiefComplaint || 'No complaint recorded'}</p>
                          <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDateTime(visit.visitDate)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                      
                      {/* Visit Timeline */}
                      {visit.vitals?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-200">
                          <p className="text-xs font-medium text-neutral-500 mb-2">Vitals Recorded</p>
                          <div className="flex gap-4 text-sm">
                            {visit.vitals[0].bloodPressureSys && (
                              <span>BP: {visit.vitals[0].bloodPressureSys}/{visit.vitals[0].bloodPressureDia}</span>
                            )}
                            {visit.vitals[0].temperature && <span>Temp: {visit.vitals[0].temperature}°C</span>}
                            {visit.vitals[0].pulseRate && <span>Pulse: {visit.vitals[0].pulseRate} bpm</span>}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'vitals' && (
          <Card>
            <CardHeader>
              <CardTitle>Vitals History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-neutral-500 py-8">Vitals history chart coming soon...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'prescriptions' && (
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-neutral-500 py-8">Prescription history coming soon...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'labs' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-600" />
                Lab Results History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {labLoading ? (
                <div className="text-center py-8 text-gray-500">Loading lab results...</div>
              ) : labHistory.length === 0 ? (
                <div className="text-center py-8">
                  <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No lab results found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {labHistory.map((order) => (
                    <div key={order.id} className="border rounded-xl overflow-hidden">
                      {/* Order Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.orderedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Results Table */}
                      {order.results && order.results.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                              <tr>
                                <th className="px-4 py-2 font-medium text-gray-700">Test</th>
                                <th className="px-4 py-2 font-medium text-gray-700">Result</th>
                                <th className="px-4 py-2 font-medium text-gray-700">Normal Range</th>
                                <th className="px-4 py-2 font-medium text-gray-700">Flag</th>
                                <th className="px-4 py-2 font-medium text-gray-700">Verified</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {order.results.map((result) => (
                                <tr key={result.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{result.testName}</td>
                                  <td className="px-4 py-3">
                                    <span className={`font-semibold ${
                                      result.flag === 'CRITICAL' ? 'text-red-600' :
                                      result.flag === 'HIGH' ? 'text-orange-600' :
                                      result.flag === 'LOW' ? 'text-blue-600' :
                                      'text-gray-900'
                                    }`}>
                                      {result.result} {result.unit}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">{result.normalRange || '-'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      result.flag === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                      result.flag === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                      result.flag === 'LOW' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {result.flag || 'NORMAL'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {result.verifiedAt ? (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-xs">{result.verifiedBy}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 text-xs">Pending</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500">
                          <p className="text-sm">
                            {order.status === 'PENDING' ? 'Awaiting sample collection' :
                             order.status === 'SAMPLE_COLLECTED' ? 'Sample collected, awaiting results' :
                             order.status === 'CANCELLED' ? 'Order was cancelled' :
                             'Results pending'}
                          </p>
                        </div>
                      )}

                      {/* Order Footer */}
                      <div className="bg-gray-50 px-4 py-2 border-t text-xs text-gray-500 flex justify-between">
                        <span>Ordered by: {order.orderedBy?.firstName} {order.orderedBy?.lastName}</span>
                        {order.completedAt && (
                          <span>Completed: {new Date(order.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-neutral-500 py-8">Billing history coming soon...</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Add to Queue Modal */}
      <Modal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        title="Add Patient to Queue"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-neutral-600 mb-3">
              Adding <strong>{patient.firstName} {patient.lastName}</strong> to the visit queue.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Visit Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['OPD', 'EMERGENCY', 'FOLLOW_UP'].map((type) => (
                <button
                  key={type}
                  onClick={() => setVisitType(type)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                    visitType === type
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {type === 'OPD' && '🏥 OPD'}
                  {type === 'EMERGENCY' && '🚨 Emergency'}
                  {type === 'FOLLOW_UP' && '📋 Follow-up'}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Chief Complaint"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Brief description of symptoms..."
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowQueueModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleAddToQueue} loading={addingToQueue}>
              Add to Queue
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
