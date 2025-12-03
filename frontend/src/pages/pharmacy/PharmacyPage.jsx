import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Package, 
  AlertTriangle, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Calendar,
  Box,
  FileCheck,
  Receipt,
  ArrowRight,
  User,
  Clock,
  Plus,
  X
} from 'lucide-react';
import { usePrescriptionStore } from '../../store/prescriptionStore';
import { usePharmacyStore } from '../../store/prescriptionStore';
import { useVisitStore } from '../../store/visitStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PharmacyPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    pendingPrescriptions,
    currentPrescription,
    loading: prescriptionLoading,
    getPendingPrescriptions,
    dispensePrescription,
    getPrescription
  } = usePrescriptionStore();
  
  const {
    drugs,
    lowStockDrugs,
    loading: pharmacyLoading,
    listDrugs,
    getLowStockDrugs,
    updateStock,
    createDrug
  } = usePharmacyStore();

  const { updateVisit } = useVisitStore();

  const [activeTab, setActiveTab] = useState('pending'); // pending, inventory, low-stock
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispenseModal, setDispenseModal] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [addDrugModal, setAddDrugModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [completeSessionModal, setCompleteSessionModal] = useState(false);
  const [dispensedPrescription, setDispensedPrescription] = useState(null);
  const [newDrug, setNewDrug] = useState({
    drugName: '',
    genericName: '',
    category: '',
    dosageForm: '',
    strength: '',
    unitPrice: '',
    stockQuantity: '',
    reorderLevel: '10',
    manufacturer: '',
    expiryDate: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all'
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'pending') {
      try {
        const result = await getPendingPrescriptions();
        console.log('Pending prescriptions loaded:', result);
      } catch (err) {
        console.error('Error loading pending prescriptions:', err);
      }
    } else if (activeTab === 'inventory') {
      await listDrugs();
    } else if (activeTab === 'low-stock') {
      await getLowStockDrugs();
    }
  };

  const handleDispense = async (prescriptionId) => {
    const prescription = (pendingPrescriptions || []).find(p => p.id === prescriptionId);
    if (!prescription) return;
    
    setSelectedPrescription(prescription);
    setDispenseModal(true);
  };

  const confirmDispense = async () => {
    if (!selectedPrescription) return;

    try {
      await dispensePrescription(selectedPrescription.id);
      toast.success('Prescription dispensed successfully');
      setDispenseModal(false);
      
      // Store the dispensed prescription and show completion modal
      setDispensedPrescription(selectedPrescription);
      setSelectedPrescription(null);
      setCompleteSessionModal(true);
      
      await getPendingPrescriptions();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to dispense prescription';
      
      // Check for stock-related errors and provide helpful message
      if (errorMessage.toLowerCase().includes('insufficient stock')) {
        toast.error(
          <div>
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-sm mt-1">Please add stock in the Inventory tab before dispensing.</p>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleAddDrug = async () => {
    if (!newDrug.drugName || !newDrug.category || !newDrug.unitPrice || !newDrug.stockQuantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createDrug({
        ...newDrug,
        unitPrice: parseFloat(newDrug.unitPrice),
        stockQuantity: parseInt(newDrug.stockQuantity),
        reorderLevel: parseInt(newDrug.reorderLevel) || 10,
      });
      toast.success('Drug added successfully');
      setAddDrugModal(false);
      setNewDrug({
        drugName: '',
        genericName: '',
        category: '',
        dosageForm: '',
        strength: '',
        unitPrice: '',
        stockQuantity: '',
        reorderLevel: '10',
        manufacturer: '',
        expiryDate: ''
      });
      await listDrugs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add drug');
    }
  };

  const handleCompleteSession = async (goToBilling = false) => {
    const visitId = dispensedPrescription?.consultation?.visit?.id;
    if (!visitId) {
      setCompleteSessionModal(false);
      setDispensedPrescription(null);
      return;
    }

    try {
      if (goToBilling) {
        // Update visit status to BILLING so billing clerk can see it
        await updateVisit(visitId, { status: 'BILLING' });
        toast.success('Patient sent to billing!');
        // Navigate to billing page with patient info
        navigate('/billing', { 
          state: { 
            patientId: dispensedPrescription.patient?.id,
            visitId: visitId 
          }
        });
      } else {
        // Just complete the session
        await updateVisit(visitId, { status: 'COMPLETED' });
        toast.success('Patient session completed successfully!');
      }
    } catch (error) {
      toast.error('Failed to complete session');
    } finally {
      setCompleteSessionModal(false);
      setDispensedPrescription(null);
    }
  };

  const handleUpdateStock = async (drug) => {
    setSelectedDrug(drug);
    setStockQuantity('');
    setStockModal(true);
  };

  const confirmUpdateStock = async () => {
    if (!selectedDrug || !stockQuantity) return;

    try {
      await updateStock(selectedDrug.id, parseInt(stockQuantity));
      toast.success('Stock updated successfully');
      setStockModal(false);
      setSelectedDrug(null);
      setStockQuantity('');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const filteredPrescriptions = (pendingPrescriptions || []).filter(prescription => {
    const searchLower = searchTerm.toLowerCase();
    return (
      prescription.patient?.firstName?.toLowerCase().includes(searchLower) ||
      prescription.patient?.lastName?.toLowerCase().includes(searchLower) ||
      prescription.prescriptionNumber?.toLowerCase().includes(searchLower)
    );
  });

  const filteredDrugs = (drugs || []).filter(drug => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      drug.name?.toLowerCase().includes(searchLower) ||
      drug.genericName?.toLowerCase().includes(searchLower) ||
      drug.code?.toLowerCase().includes(searchLower);
    
    const matchesCategory = filters.category === 'all' || drug.category === filters.category;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pharmacy</h1>
        <p className="text-gray-600">Manage prescriptions and drug inventory</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Pill className="w-4 h-4" />
            <span>Pending Prescriptions</span>
            {(pendingPrescriptions?.length || 0) > 0 && (
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {pendingPrescriptions?.length || 0}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Drug Inventory</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('low-stock')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'low-stock'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Low Stock Alert</span>
            {(lowStockDrugs?.length || 0) > 0 && (
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                {lowStockDrugs?.length || 0}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              activeTab === 'pending' 
                ? 'Search by patient name or prescription number...'
                : 'Search drugs by name, generic name, or code...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {activeTab === 'inventory' && (
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="tablet">Tablets</option>
            <option value="capsule">Capsules</option>
            <option value="syrup">Syrups</option>
            <option value="injection">Injections</option>
            <option value="ointment">Ointments</option>
            <option value="suspension">Suspensions</option>
            <option value="other">Other</option>
          </select>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {prescriptionLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Pill className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No pending prescriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prescription #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prescribed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription) => (
                    <motion.tr
                      key={prescription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {prescription.prescriptionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {prescription.patient?.firstName} {prescription.patient?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {prescription.patient?.patientNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {prescription.doctor?.firstName} {prescription.doctor?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(prescription.prescribedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prescription.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prescription.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : prescription.status === 'DISPENSED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {prescription.status === 'PENDING' && (
                          <button
                            onClick={() => handleDispense(prescription.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Dispense
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Add Drug Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setAddDrugModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Drug
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
          {pharmacyLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredDrugs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No drugs found</p>
              <button
                onClick={() => setAddDrugModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Add your first drug
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drug Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generic Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrugs.map((drug) => (
                    <motion.tr
                      key={drug.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {drug.id?.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drug.drugName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drug.genericName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="capitalize">{drug.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            drug.stockQuantity <= drug.reorderLevel
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}>
                            {drug.stockQuantity} {drug.dosageForm || 'units'}
                          </span>
                          {drug.stockQuantity <= drug.reorderLevel && (
                            <AlertTriangle className="w-4 h-4 ml-2 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${drug.unitPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {drug.expiryDate ? new Date(drug.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleUpdateStock(drug)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Update Stock
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      )}

      {activeTab === 'low-stock' && (
        <div className="space-y-4">
          {pharmacyLoading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Loading...
            </div>
          ) : (lowStockDrugs?.length || 0) === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <p>All drugs are sufficiently stocked</p>
            </div>
          ) : (
            (lowStockDrugs || []).map((drug) => (
              <motion.div
                key={drug.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <h3 className="text-lg font-semibold text-gray-900">{drug.drugName}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{drug.genericName || '-'}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Code:</span>
                        <span className="ml-2 font-medium text-gray-900">{drug.id?.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Current Stock:</span>
                        <span className="ml-2 font-medium text-red-600">
                          {drug.stockQuantity} {drug.dosageForm || 'units'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Reorder Level:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {drug.reorderLevel} {drug.dosageForm || 'units'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2 font-medium text-gray-900 capitalize">
                          {drug.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateStock(drug)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Restock
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Dispense Modal */}
      {dispenseModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Dispense Prescription</h2>
              <button
                onClick={() => setDispenseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Prescription Number</h3>
                <p className="text-lg font-semibold">{selectedPrescription.prescriptionNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Patient</h3>
                  <p className="font-medium">
                    {selectedPrescription.patient?.firstName} {selectedPrescription.patient?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedPrescription.patient?.patientNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Prescribed By</h3>
                  <p className="font-medium">
                    {selectedPrescription.doctor?.firstName} {selectedPrescription.doctor?.lastName}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Prescription Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Drug</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Dosage</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Frequency</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duration</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty Needed</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">In Stock</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPrescription.items?.map((item, index) => {
                        const inStock = item.drug?.stockQuantity || 0;
                        const needsStock = inStock < item.quantity;
                        return (
                        <tr key={index} className={needsStock ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 text-sm font-medium">{item.drug?.drugName || item.drugName || 'Unknown Drug'}</td>
                          <td className="px-4 py-2 text-sm">{item.dosage}</td>
                          <td className="px-4 py-2 text-sm">{item.frequency}</td>
                          <td className="px-4 py-2 text-sm">{item.duration}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`font-medium ${needsStock ? 'text-red-600' : 'text-green-600'}`}>
                              {inStock}
                            </span>
                            {needsStock && (
                              <span className="ml-2 text-xs text-red-500">
                                (need {item.quantity - inStock} more)
                              </span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Stock Warning */}
                {selectedPrescription.items?.some(item => (item.drug?.stockQuantity || 0) < item.quantity) && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Insufficient Stock</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Some items don't have enough stock. Please add stock in the Inventory tab before dispensing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedPrescription.instructions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Instructions</h3>
                  <p className="text-sm text-gray-700">{selectedPrescription.instructions}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDispenseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDispense}
                disabled={prescriptionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prescriptionLoading ? 'Dispensing...' : 'Confirm Dispense'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Update Stock Modal */}
      {stockModal && selectedDrug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Update Stock</h2>
              <button
                onClick={() => setStockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Drug</h3>
                <p className="font-medium">{selectedDrug.drugName}</p>
                <p className="text-sm text-gray-500">{selectedDrug.genericName || '-'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Current Stock</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedDrug.stockQuantity} {selectedDrug.dosageForm || 'units'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Quantity ({selectedDrug.dosageForm || 'units'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quantity to add"
                />
              </div>

              {stockQuantity && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">New Stock Level:</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {selectedDrug.stockQuantity + parseInt(stockQuantity)} {selectedDrug.dosageForm || 'units'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setStockModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdateStock}
                disabled={!stockQuantity || pharmacyLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pharmacyLoading ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete Session Modal */}
      <AnimatePresence>
        {completeSessionModal && dispensedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Prescription Dispensed!</h2>
                <p className="text-gray-600">
                  Medications have been successfully dispensed to the patient.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {dispensedPrescription.patient?.firstName} {dispensedPrescription.patient?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dispensedPrescription.patient?.patientNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Pill className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      {dispensedPrescription.prescriptionNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dispensedPrescription.items?.length || 0} items dispensed
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  What would you like to do next?
                </p>
                
                <button
                  onClick={() => handleCompleteSession(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Receipt className="w-5 h-5" />
                  <span>Complete Session & Go to Billing</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleCompleteSession(false)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FileCheck className="w-5 h-5" />
                  <span>Complete Session</span>
                </button>

                <button
                  onClick={() => {
                    setCompleteSessionModal(false);
                    setDispensedPrescription(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continue Without Completing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Drug Modal */}
      <AnimatePresence>
        {addDrugModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Add New Drug</h2>
                </div>
                <button
                  onClick={() => setAddDrugModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drug Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newDrug.drugName}
                      onChange={(e) => setNewDrug({ ...newDrug, drugName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Amoxicillin 500mg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      value={newDrug.genericName}
                      onChange={(e) => setNewDrug({ ...newDrug, genericName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Amoxicillin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newDrug.category}
                      onChange={(e) => setNewDrug({ ...newDrug, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select category</option>
                      <option value="tablet">Tablets</option>
                      <option value="capsule">Capsules</option>
                      <option value="syrup">Syrups</option>
                      <option value="injection">Injections</option>
                      <option value="ointment">Ointments</option>
                      <option value="suspension">Suspensions</option>
                      <option value="drops">Drops</option>
                      <option value="inhaler">Inhalers</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price (GHS) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newDrug.unitPrice}
                      onChange={(e) => setNewDrug({ ...newDrug, unitPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newDrug.stockQuantity}
                      onChange={(e) => setNewDrug({ ...newDrug, stockQuantity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newDrug.reorderLevel}
                      onChange={(e) => setNewDrug({ ...newDrug, reorderLevel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={newDrug.expiryDate}
                      onChange={(e) => setNewDrug({ ...newDrug, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={newDrug.manufacturer}
                      onChange={(e) => setNewDrug({ ...newDrug, manufacturer: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Pfizer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage Form
                    </label>
                    <select
                      value={newDrug.dosageForm}
                      onChange={(e) => setNewDrug({ ...newDrug, dosageForm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select form...</option>
                      <option value="TABLET">Tablet</option>
                      <option value="CAPSULE">Capsule</option>
                      <option value="SYRUP">Syrup</option>
                      <option value="INJECTION">Injection</option>
                      <option value="CREAM">Cream</option>
                      <option value="OINTMENT">Ointment</option>
                      <option value="DROPS">Drops</option>
                      <option value="INHALER">Inhaler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strength
                    </label>
                    <input
                      type="text"
                      value={newDrug.strength}
                      onChange={(e) => setNewDrug({ ...newDrug, strength: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 500mg, 250mg/5ml"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  onClick={() => setAddDrugModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDrug}
                  disabled={pharmacyLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {pharmacyLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Drug
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PharmacyPage;
