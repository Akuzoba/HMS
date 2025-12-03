import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  FlaskConical, Search, Clock, AlertTriangle, CheckCircle, 
  User, FileText, Beaker, ChevronRight, X, Plus, Eye,
  Droplets, TestTube, ClipboardCheck
} from 'lucide-react';
import { useLabStore } from '@/store/labStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';

export default function LabPage() {
  const { user } = useAuthStore();
  const { 
    pendingOrders, 
    labTests,
    loading, 
    getPendingOrders,
    listLabTests,
    collectSample,
    submitResults,
    verifyAllResults 
  } = useLabStore();

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultEntries, setResultEntries] = useState([]);

  useEffect(() => {
    getPendingOrders();
    listLabTests();
  }, [getPendingOrders, listLabTests]);

  const filteredOrders = (pendingOrders || []).filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.patient?.firstName?.toLowerCase().includes(term) ||
      order.patient?.lastName?.toLowerCase().includes(term) ||
      order.orderNumber?.toLowerCase().includes(term) ||
      order.patient?.patientNumber?.toLowerCase().includes(term)
    );
  });

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    // Initialize result entries based on order items
    setResultEntries(
      order.items?.map(item => ({
        testName: item.labTest?.testName || '',
        result: '',
        unit: item.labTest?.unit || '',
        normalRange: item.labTest?.normalRange || '',
        flag: 'NORMAL',
        notes: '',
      })) || []
    );
  };

  const handleCollectSample = async (orderId) => {
    try {
      const updatedOrder = await collectSample(orderId);
      toast.success('Sample collected successfully');
      // Update the selected order with the new data
      setSelectedOrder(updatedOrder);
      getPendingOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to collect sample');
    }
  };

  const handleSubmitResults = async () => {
    if (!selectedOrder) return;

    // Validate all results have values
    const emptyResults = resultEntries.filter(r => !r.result.trim());
    if (emptyResults.length > 0) {
      toast.error('Please fill in all test results');
      return;
    }

    try {
      await submitResults({
        labOrderId: selectedOrder.id,
        results: resultEntries,
        performedBy: `${user.firstName} ${user.lastName}`,
      });
      toast.success('Results submitted successfully');
      setShowResultModal(false);
      // Refresh the selected order to show the new status
      const refreshedOrders = await getPendingOrders();
      const updatedOrder = refreshedOrders?.find(o => o.id === selectedOrder.id);
      if (updatedOrder) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit results');
    }
  };

  const handleVerifyResults = async (orderId) => {
    try {
      const result = await verifyAllResults(orderId, `${user.firstName} ${user.lastName}`);
      const doctorName = result?.consultation?.doctor 
        ? `Dr. ${result.consultation.doctor.firstName} ${result.consultation.doctor.lastName}`
        : 'the doctor';
      toast.success(`Results verified! Patient routed back to ${doctorName}`);
      setSelectedOrder(null);
      getPendingOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify results');
    }
  };

  const updateResultEntry = (index, field, value) => {
    setResultEntries(prev => 
      prev.map((entry, i) => i === index ? { ...entry, [field]: value } : entry)
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'STAT': 'bg-red-100 text-red-800 border-red-200',
      'URGENT': 'bg-orange-100 text-orange-800 border-orange-200',
      'ROUTINE': 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[priority] || colors.ROUTINE;
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SAMPLE_COLLECTED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <FlaskConical className="text-cyan-600" />
          Laboratory
        </h1>
        <p className="text-gray-600">Manage lab orders, collect samples, and enter results</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock size={18} />
            Pending Orders
            {(pendingOrders?.length || 0) > 0 && (
              <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs">
                {pendingOrders?.length || 0}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'tests'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <TestTube size={18} />
            Test Catalog
          </div>
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Lab Queue</h2>
                <span className="text-sm text-gray-500">{filteredOrders.length} orders</span>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FlaskConical className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No pending orders</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {filteredOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelectOrder(order)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedOrder?.id === order.id
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-gray-200 hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.patient?.firstName} {order.patient?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {order.orderNumber}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {order.items?.length || 0} tests
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            {!selectedOrder ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <Beaker className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Select an order to view details</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}
                      </h3>
                      <p className="text-cyan-100 text-sm">
                        {selectedOrder.orderNumber} • {selectedOrder.patient?.patientNumber}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedOrder.priority)}`}>
                        {selectedOrder.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Status & Actions */}
                  <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {selectedOrder.status === 'PENDING' && (
                        <Button
                          onClick={() => handleCollectSample(selectedOrder.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                          icon={<Droplets size={16} />}
                        >
                          Collect Sample
                        </Button>
                      )}
                      {selectedOrder.status === 'SAMPLE_COLLECTED' && (
                        <Button
                          onClick={() => setShowResultModal(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                          icon={<FileText size={16} />}
                        >
                          Enter Results
                        </Button>
                      )}
                      {selectedOrder.status === 'IN_PROGRESS' && selectedOrder.results?.length > 0 && (
                        <Button
                          onClick={() => handleVerifyResults(selectedOrder.id)}
                          className="bg-green-600 hover:bg-green-700"
                          icon={<ClipboardCheck size={16} />}
                        >
                          Verify & Complete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  {selectedOrder.clinicalNotes && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Clinical Notes</h4>
                      <p className="text-gray-600 text-sm bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        {selectedOrder.clinicalNotes}
                      </p>
                    </div>
                  )}

                  {/* Ordered Tests */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Ordered Tests</h4>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                              <TestTube className="w-4 h-4 text-cyan-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.labTest?.testName}</p>
                              <p className="text-xs text-gray-500">
                                {item.labTest?.category} • {item.labTest?.sampleType}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            item.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Results (if any) */}
                  {selectedOrder.results?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Results</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Test</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Result</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Normal Range</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-700">Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedOrder.results.map((result) => (
                              <tr key={result.id}>
                                <td className="px-4 py-3 font-medium">{result.testName}</td>
                                <td className="px-4 py-3">
                                  {result.result} {result.unit}
                                </td>
                                <td className="px-4 py-3 text-gray-500">{result.normalRange || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    result.flag === 'NORMAL' ? 'bg-green-100 text-green-700' :
                                    result.flag === 'HIGH' ? 'bg-red-100 text-red-700' :
                                    result.flag === 'LOW' ? 'bg-blue-100 text-blue-700' :
                                    result.flag === 'CRITICAL' ? 'bg-red-200 text-red-800' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {result.flag || 'NORMAL'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Order Info */}
                  <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                    <p>
                      Ordered by: {selectedOrder.orderedBy?.firstName} {selectedOrder.orderedBy?.lastName}
                    </p>
                    <p>
                      Ordered at: {new Date(selectedOrder.orderedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Catalog</span>
              <Button icon={<Plus size={16} />} size="sm">Add Test</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(labTests || []).map((test) => (
                <div
                  key={test.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{test.testName}</p>
                      <p className="text-xs text-gray-500 font-mono">{test.testCode}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs">
                      {test.category}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>Sample: {test.sampleType || '-'}</p>
                    <p>Normal Range: {test.normalRange || '-'}</p>
                    <p>Price: GH₵ {test.price?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
              {(labTests || []).length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No tests in catalog. Add some tests to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enter Results Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Enter Lab Results"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="font-medium">{selectedOrder?.patient?.firstName} {selectedOrder?.patient?.lastName}</p>
            <p className="text-sm text-gray-500">{selectedOrder?.orderNumber}</p>
          </div>

          {resultEntries.map((entry, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900">{entry.testName}</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Result"
                  value={entry.result}
                  onChange={(e) => updateResultEntry(index, 'result', e.target.value)}
                  placeholder="Enter result value"
                  required
                />
                <Input
                  label="Unit"
                  value={entry.unit}
                  onChange={(e) => updateResultEntry(index, 'unit', e.target.value)}
                  placeholder="e.g., mg/dL"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Normal Range"
                  value={entry.normalRange}
                  onChange={(e) => updateResultEntry(index, 'normalRange', e.target.value)}
                  placeholder="e.g., 70-100"
                />
                <Select
                  label="Flag"
                  value={entry.flag}
                  onChange={(e) => updateResultEntry(index, 'flag', e.target.value)}
                  options={[
                    { value: 'NORMAL', label: 'Normal' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'LOW', label: 'Low' },
                    { value: 'CRITICAL', label: 'Critical' },
                  ]}
                />
              </div>
              <Textarea
                label="Notes"
                value={entry.notes}
                onChange={(e) => updateResultEntry(index, 'notes', e.target.value)}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowResultModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResults} loading={loading}>
              Submit Results
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
