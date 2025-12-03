import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BedDouble,
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  AlertTriangle,
  Activity,
  Clock,
  ArrowRight,
  CheckCircle,
  X,
  User,
  Calendar,
  FileText,
  Stethoscope,
  Heart,
} from 'lucide-react';
import { toast } from 'sonner';
import { useIPDStore } from '../../store/ipdStore';
import { usePatientStore } from '../../store/patientStore';

const IPDPage = () => {
  const {
    wards,
    beds,
    admissions,
    stats,
    loading,
    listWards,
    getAvailableBeds,
    listAdmissions,
    getCurrentAdmissions,
    createAdmission,
    dischargePatient,
    getStats,
    createWard,
    createBed,
    createMultipleBeds,
  } = useIPDStore();

  const { patients, searchPatients } = usePatientStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [admitModal, setAdmitModal] = useState(false);
  const [dischargeModal, setDischargeModal] = useState(false);
  const [wardModal, setWardModal] = useState(false);
  const [bedModal, setBedModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [newAdmission, setNewAdmission] = useState({
    patientId: '',
    wardId: '',
    bedId: '',
    admissionType: 'ELECTIVE',
    admissionReason: '',
    diagnosis: '',
    expectedDischargeDate: '',
  });

  const [newWard, setNewWard] = useState({
    wardName: '',
    wardType: 'GENERAL',
    floor: 1,
    totalBeds: 0,
    chargePerDay: 0,
    description: '',
  });

  const [newBed, setNewBed] = useState({
    wardId: '',
    bedType: 'STANDARD',
    dailyRate: 0,
    count: 1,
  });

  const [dischargeData, setDischargeData] = useState({
    dischargeType: 'NORMAL',
    dischargeSummary: '',
    dischargeInstructions: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'overview') {
      await Promise.all([getStats(), getCurrentAdmissions()]);
    } else if (activeTab === 'wards') {
      await listWards();
    } else if (activeTab === 'beds') {
      await getAvailableBeds();
    } else if (activeTab === 'admissions') {
      await listAdmissions({ status: 'ADMITTED' });
    }
  };

  useEffect(() => {
    if (patientSearch.length >= 2) {
      searchPatients(patientSearch);
    }
  }, [patientSearch]);

  useEffect(() => {
    if (newAdmission.wardId) {
      getAvailableBeds(newAdmission.wardId);
    }
  }, [newAdmission.wardId]);

  const handleAdmit = async () => {
    if (!newAdmission.patientId || !newAdmission.bedId || !newAdmission.admissionReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createAdmission(newAdmission);
      toast.success('Patient admitted successfully');
      setAdmitModal(false);
      resetAdmissionForm();
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to admit patient');
    }
  };

  const handleDischarge = async () => {
    if (!selectedAdmission || !dischargeData.dischargeSummary) {
      toast.error('Please provide a discharge summary');
      return;
    }

    try {
      await dischargePatient(selectedAdmission.id, dischargeData);
      toast.success('Patient discharged successfully');
      setDischargeModal(false);
      setSelectedAdmission(null);
      resetDischargeForm();
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to discharge patient');
    }
  };

  const handleCreateWard = async () => {
    if (!newWard.wardName || !newWard.wardType) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createWard(newWard);
      toast.success('Ward created successfully');
      setWardModal(false);
      setNewWard({
        wardName: '',
        wardType: 'GENERAL',
        floor: 1,
        totalBeds: 0,
        chargePerDay: 0,
        description: '',
      });
      await listWards();
    } catch (error) {
      toast.error(error.message || 'Failed to create ward');
    }
  };

  const handleCreateBeds = async () => {
    if (!newBed.wardId || newBed.count < 1) {
      toast.error('Please select a ward and specify the number of beds');
      return;
    }

    try {
      await createMultipleBeds(newBed.wardId, { bedType: newBed.bedType, dailyRate: newBed.dailyRate }, newBed.count);
      toast.success(`${newBed.count} beds created successfully`);
      setBedModal(false);
      setNewBed({
        wardId: '',
        bedType: 'STANDARD',
        dailyRate: 0,
        count: 1,
      });
      await getAvailableBeds();
    } catch (error) {
      toast.error(error.message || 'Failed to create beds');
    }
  };

  const resetAdmissionForm = () => {
    setNewAdmission({
      patientId: '',
      wardId: '',
      bedId: '',
      admissionType: 'ELECTIVE',
      admissionReason: '',
      diagnosis: '',
      expectedDischargeDate: '',
    });
    setSelectedPatient(null);
    setPatientSearch('');
  };

  const resetDischargeForm = () => {
    setDischargeData({
      dischargeType: 'NORMAL',
      dischargeSummary: '',
      dischargeInstructions: '',
    });
  };

  const openDischargeModal = (admission) => {
    setSelectedAdmission(admission);
    setDischargeModal(true);
  };

  const filteredAdmissions = (admissions || []).filter((admission) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admission.patient?.firstName?.toLowerCase().includes(searchLower) ||
      admission.patient?.lastName?.toLowerCase().includes(searchLower) ||
      admission.admissionNumber?.toLowerCase().includes(searchLower) ||
      admission.ward?.wardName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inpatient Department (IPD)</h1>
          <p className="text-gray-600">Manage ward admissions, beds, and inpatient care</p>
        </div>
        <button
          onClick={() => setAdmitModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Admit Patient</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'admissions', label: 'Current Admissions', icon: Users },
          { id: 'wards', label: 'Wards', icon: Building2 },
          { id: 'beds', label: 'Beds', icon: BedDouble },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-medium transition-colors flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Beds"
              value={stats?.totalBeds || 0}
              subtitle="Hospital capacity"
              icon={BedDouble}
              color="blue"
            />
            <StatCard
              title="Occupied Beds"
              value={stats?.occupiedBeds || 0}
              subtitle={`${stats?.occupancyRate || 0}% occupancy`}
              icon={Users}
              color="purple"
            />
            <StatCard
              title="Available Beds"
              value={stats?.availableBeds || 0}
              subtitle="Ready for admission"
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Critical Patients"
              value={stats?.criticalPatients || 0}
              subtitle="Require attention"
              icon={AlertTriangle}
              color="red"
            />
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Today's Activity</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Admissions</span>
                  <span className="text-xl font-bold text-blue-600">{stats?.todayAdmissions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discharges</span>
                  <span className="text-xl font-bold text-green-600">{stats?.todayDischarges || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Admissions</span>
                  <span className="text-xl font-bold text-purple-600">{stats?.currentAdmissions || 0}</span>
                </div>
              </div>
            </div>

            {/* Occupancy Chart Placeholder */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Bed Occupancy by Ward</h3>
              <div className="space-y-3">
                {(wards || []).slice(0, 5).map((ward) => {
                  const total = ward.beds?.length || 0;
                  const occupied = ward.beds?.filter((b) => b.status === 'OCCUPIED').length || 0;
                  const percentage = total > 0 ? Math.round((occupied / total) * 100) : 0;

                  return (
                    <div key={ward.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{ward.wardName}</span>
                        <span>
                          {occupied}/{total} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Admissions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Current Admissions</h3>
              <button
                onClick={() => setActiveTab('admissions')}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ward / Bed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(admissions || []).slice(0, 5).map((admission) => (
                    <tr key={admission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {admission.patient?.firstName} {admission.patient?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{admission.admissionNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium">{admission.ward?.wardName}</div>
                          <div className="text-gray-500">{admission.bed?.bedNumber}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(admission.admissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{admission.diagnosis || '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDischargeModal(admission)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Discharge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admissions' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by patient name, admission number..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Admissions List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ward / Bed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No admissions found
                    </td>
                  </tr>
                ) : (
                  filteredAdmissions.map((admission) => (
                    <tr key={admission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {admission.patient?.firstName} {admission.patient?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{admission.admissionNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium">{admission.ward?.wardName}</div>
                          <div className="text-gray-500">{admission.bed?.bedNumber}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            admission.admissionType === 'EMERGENCY'
                              ? 'bg-red-100 text-red-700'
                              : admission.admissionType === 'TRANSFER'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {admission.admissionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(admission.admissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{admission.diagnosis || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            admission.status === 'ADMITTED'
                              ? 'bg-green-100 text-green-700'
                              : admission.status === 'DISCHARGED'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {admission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {admission.status === 'ADMITTED' && (
                          <button
                            onClick={() => openDischargeModal(admission)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Discharge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'wards' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setWardModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Ward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(wards || []).map((ward) => {
              const total = ward.beds?.length || ward._count?.beds || 0;
              const occupied = ward.beds?.filter((b) => b.status === 'OCCUPIED').length || 0;
              const available = ward.beds?.filter((b) => b.status === 'AVAILABLE').length || total - occupied;

              return (
                <motion.div
                  key={ward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{ward.wardName}</h3>
                      <p className="text-sm text-gray-500">{ward.wardCode}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        ward.wardType === 'ICU'
                          ? 'bg-red-100 text-red-700'
                          : ward.wardType === 'PEDIATRIC'
                          ? 'bg-purple-100 text-purple-700'
                          : ward.wardType === 'MATERNITY'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {ward.wardType}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Floor</span>
                      <span className="font-medium">{ward.floor || 1}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Beds</span>
                      <span className="font-medium">{total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Occupied</span>
                      <span className="font-medium text-red-600">{occupied}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Available</span>
                      <span className="font-medium text-green-600">{available}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Charge/Day</span>
                      <span className="font-medium">${ward.chargePerDay || 0}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'beds' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setBedModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Beds</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Available Beds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(beds || []).map((bed) => (
                <div
                  key={bed.id}
                  className={`p-4 rounded-lg border-2 ${
                    bed.status === 'AVAILABLE'
                      ? 'border-green-200 bg-green-50'
                      : bed.status === 'OCCUPIED'
                      ? 'border-red-200 bg-red-50'
                      : bed.status === 'MAINTENANCE'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <BedDouble
                        className={`w-5 h-5 mr-2 ${
                          bed.status === 'AVAILABLE'
                            ? 'text-green-600'
                            : bed.status === 'OCCUPIED'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      />
                      <span className="font-medium">{bed.bedNumber}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        bed.status === 'AVAILABLE'
                          ? 'bg-green-200 text-green-800'
                          : bed.status === 'OCCUPIED'
                          ? 'bg-red-200 text-red-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>{bed.ward?.wardName}</div>
                    <div>{bed.bedType}</div>
                    {bed.dailyRate > 0 && <div>${bed.dailyRate}/day</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admit Patient Modal */}
      <AnimatePresence>
        {admitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setAdmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Admit Patient</h2>
                  <button onClick={() => setAdmitModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Patient Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient <span className="text-red-500">*</span>
                    </label>
                    {selectedPatient ? (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium">
                            {selectedPatient.firstName} {selectedPatient.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{selectedPatient.patientNumber}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPatient(null);
                            setNewAdmission((prev) => ({ ...prev, patientId: '' }));
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search patient by name or ID..."
                          className="w-full p-2 border rounded-lg"
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                        />
                        {patientSearch.length >= 2 && patients && patients.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {patients.map((patient) => (
                              <button
                                key={patient.id}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setNewAdmission((prev) => ({ ...prev, patientId: patient.id }));
                                  setPatientSearch('');
                                }}
                              >
                                <div className="font-medium">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{patient.patientNumber}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ward Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ward <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newAdmission.wardId}
                      onChange={(e) => setNewAdmission((prev) => ({ ...prev, wardId: e.target.value, bedId: '' }))}
                    >
                      <option value="">Select Ward</option>
                      {(wards || []).map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.wardName} ({ward.wardType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bed Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bed <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newAdmission.bedId}
                      onChange={(e) => setNewAdmission((prev) => ({ ...prev, bedId: e.target.value }))}
                      disabled={!newAdmission.wardId}
                    >
                      <option value="">Select Bed</option>
                      {(beds || [])
                        .filter((bed) => bed.status === 'AVAILABLE')
                        .map((bed) => (
                          <option key={bed.id} value={bed.id}>
                            {bed.bedNumber} - {bed.bedType}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Admission Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Type</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newAdmission.admissionType}
                      onChange={(e) => setNewAdmission((prev) => ({ ...prev, admissionType: e.target.value }))}
                    >
                      <option value="ELECTIVE">Elective</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="TRANSFER">Transfer</option>
                    </select>
                  </div>

                  {/* Admission Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admission Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg"
                      rows="3"
                      placeholder="Reason for admission..."
                      value={newAdmission.admissionReason}
                      onChange={(e) => setNewAdmission((prev) => ({ ...prev, admissionReason: e.target.value }))}
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                    <textarea
                      className="w-full p-2 border rounded-lg"
                      rows="2"
                      placeholder="Initial diagnosis..."
                      value={newAdmission.diagnosis}
                      onChange={(e) => setNewAdmission((prev) => ({ ...prev, diagnosis: e.target.value }))}
                    />
                  </div>

                  {/* Expected Discharge Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Discharge Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-lg"
                      value={newAdmission.expectedDischargeDate}
                      onChange={(e) =>
                        setNewAdmission((prev) => ({ ...prev, expectedDischargeDate: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setAdmitModal(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdmit}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Admitting...' : 'Admit Patient'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discharge Modal */}
      <AnimatePresence>
        {dischargeModal && selectedAdmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDischargeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Discharge Patient</h2>
                  <button onClick={() => setDischargeModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="font-medium">
                    {selectedAdmission.patient?.firstName} {selectedAdmission.patient?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedAdmission.ward?.wardName} - {selectedAdmission.bed?.bedNumber}
                  </div>
                  <div className="text-sm text-gray-500">
                    Admitted: {new Date(selectedAdmission.admissionDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Type</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={dischargeData.dischargeType}
                      onChange={(e) => setDischargeData((prev) => ({ ...prev, dischargeType: e.target.value }))}
                    >
                      <option value="NORMAL">Normal Discharge</option>
                      <option value="LAMA">Left Against Medical Advice (LAMA)</option>
                      <option value="TRANSFER">Transfer to Another Facility</option>
                      <option value="DECEASED">Deceased</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discharge Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg"
                      rows="4"
                      placeholder="Summary of patient's stay and treatment..."
                      value={dischargeData.dischargeSummary}
                      onChange={(e) => setDischargeData((prev) => ({ ...prev, dischargeSummary: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Instructions</label>
                    <textarea
                      className="w-full p-2 border rounded-lg"
                      rows="3"
                      placeholder="Follow-up care instructions..."
                      value={dischargeData.dischargeInstructions}
                      onChange={(e) =>
                        setDischargeData((prev) => ({ ...prev, dischargeInstructions: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setDischargeModal(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDischarge}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Discharge Patient'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Ward Modal */}
      <AnimatePresence>
        {wardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setWardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Add New Ward</h2>
                  <button onClick={() => setWardModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ward Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      placeholder="e.g., General Ward A"
                      value={newWard.wardName}
                      onChange={(e) => setNewWard((prev) => ({ ...prev, wardName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ward Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newWard.wardType}
                      onChange={(e) => setNewWard((prev) => ({ ...prev, wardType: e.target.value }))}
                    >
                      <option value="GENERAL">General</option>
                      <option value="ICU">ICU</option>
                      <option value="PEDIATRIC">Pediatric</option>
                      <option value="MATERNITY">Maternity</option>
                      <option value="SURGICAL">Surgical</option>
                      <option value="PSYCHIATRIC">Psychiatric</option>
                      <option value="ISOLATION">Isolation</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg"
                        value={newWard.floor}
                        onChange={(e) => setNewWard((prev) => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Charge Per Day ($)</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg"
                        value={newWard.chargePerDay}
                        onChange={(e) =>
                          setNewWard((prev) => ({ ...prev, chargePerDay: parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      className="w-full p-2 border rounded-lg"
                      rows="2"
                      placeholder="Ward description..."
                      value={newWard.description}
                      onChange={(e) => setNewWard((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setWardModal(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWard}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Ward'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Beds Modal */}
      <AnimatePresence>
        {bedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setBedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Add Beds to Ward</h2>
                  <button onClick={() => setBedModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Ward <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newBed.wardId}
                      onChange={(e) => setNewBed((prev) => ({ ...prev, wardId: e.target.value }))}
                    >
                      <option value="">Select Ward</option>
                      {(wards || []).map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.wardName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newBed.bedType}
                      onChange={(e) => setNewBed((prev) => ({ ...prev, bedType: e.target.value }))}
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="SEMI_PRIVATE">Semi Private</option>
                      <option value="PRIVATE">Private</option>
                      <option value="ICU">ICU</option>
                      <option value="VENTILATOR">Ventilator</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg"
                        min="1"
                        max="50"
                        value={newBed.count}
                        onChange={(e) => setNewBed((prev) => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate ($)</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg"
                        value={newBed.dailyRate}
                        onChange={(e) =>
                          setNewBed((prev) => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setBedModal(false)}
                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateBeds}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : `Create ${newBed.count} Bed(s)`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default IPDPage;
