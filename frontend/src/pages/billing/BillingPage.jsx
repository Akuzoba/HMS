import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  CreditCard, Search, Clock, DollarSign, Receipt, User,
  Plus, CheckCircle, AlertCircle, Banknote, Printer, X,
  TrendingUp, FileText, Calculator, FileCheck, ClipboardList, History
} from 'lucide-react';
import { useBillingStore } from '@/store/billingStore';
import { usePatientStore } from '@/store/patientStore';
import { useVisitStore } from '@/store/visitStore';
import { useServicesStore } from '@/store/servicesStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';

export default function BillingPage() {
  const { user } = useAuthStore();
  const { 
    pendingBills, 
    stats,
    paymentHistory,
    paymentsPagination,
    loading, 
    getPendingBills,
    getBillingStats,
    recordPayment,
    createBill,
    getVisitCharges,
    generateBillFromVisit,
    getPaymentHistory
  } = useBillingStore();
  const { searchPatients, searchResults } = usePatientStore();
  const { visits, listVisits } = useVisitStore();
  const { services, getServices, visitCharges, getVisitCharges: fetchVisitCharges } = useServicesStore();

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [showVisitBillModal, setShowVisitBillModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitChargesData, setVisitChargesData] = useState([]);
  
  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');

  // Create bill form
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [billItems, setBillItems] = useState([
    { itemType: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0 }
  ]);

  useEffect(() => {
    getPendingBills();
    getBillingStats();
    listVisits({ status: 'BILLING' }); // Get visits at billing stage
    getServices();
    getPaymentHistory();
  }, [getPendingBills, getBillingStats, listVisits, getServices, getPaymentHistory]);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      searchPatients(patientSearch);
    }
  }, [patientSearch, searchPatients]);

  const filteredBills = (pendingBills || []).filter(bill => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      bill.patient?.firstName?.toLowerCase().includes(term) ||
      bill.patient?.lastName?.toLowerCase().includes(term) ||
      bill.billNumber?.toLowerCase().includes(term)
    );
  });

  const handleRecordPayment = async () => {
    if (!selectedBill || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > selectedBill.balance) {
      toast.error('Amount exceeds bill balance');
      return;
    }

    try {
      await recordPayment({
        billId: selectedBill.id,
        amount,
        paymentMethod,
        reference: paymentReference || undefined,
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReference('');
      setSelectedBill(null);
      getPendingBills();
      getBillingStats();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  // View visit charges and prepare for billing
  const handleViewVisitCharges = async (visit) => {
    setSelectedVisit(visit);
    try {
      const result = await fetchVisitCharges(visit.id);
      // Handle both formats: array or { charges, total } object
      const charges = Array.isArray(result) ? result : (result?.charges || []);
      setVisitChargesData(charges);
      setShowVisitBillModal(true);
    } catch (error) {
      toast.error('Failed to fetch visit charges');
      setVisitChargesData([]);
    }
  };

  // Generate bill from visit charges
  const handleGenerateBillFromVisit = async () => {
    if (!selectedVisit) return;

    try {
      await generateBillFromVisit(selectedVisit.id);
      toast.success('Bill generated successfully from visit charges');
      setShowVisitBillModal(false);
      setSelectedVisit(null);
      setVisitChargesData([]);
      getPendingBills();
      getBillingStats();
      listVisits({ status: 'BILLING' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    }
  };

  const calculateVisitTotal = () => {
    return (visitChargesData || [])
      .filter(c => c.status === 'PENDING')
      .reduce((sum, charge) => sum + (charge.totalPrice || 0), 0);
  };

  // Filter visits ready for billing
  const billingVisits = (visits || []).filter(v => v.status === 'BILLING');

  const handleCreateBill = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    const validItems = billItems.filter(item => 
      item.description && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    try {
      await createBill({
        patientId: selectedPatient.id,
        items: validItems,
      });
      toast.success('Bill created successfully');
      setShowCreateBillModal(false);
      setSelectedPatient(null);
      setPatientSearch('');
      setBillItems([{ itemType: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0 }]);
      getPendingBills();
      getBillingStats();
    } catch (error) {
      toast.error('Failed to create bill');
    }
  };

  const addBillItem = () => {
    setBillItems([...billItems, { itemType: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateBillItem = (index, field, value) => {
    setBillItems(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  };

  const removeBillItem = (index) => {
    if (billItems.length > 1) {
      setBillItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateBillTotal = () => {
    return billItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'UNPAID': 'bg-red-100 text-red-800',
      'PARTIALLY_PAID': 'bg-yellow-100 text-yellow-800',
      'PAID': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CreditCard className="text-green-600" />
            Billing & Payments
          </h1>
          <p className="text-gray-600">Manage patient bills and record payments</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateBillModal(true)}
            icon={<Plus size={18} />}
            variant="outline"
          >
            Manual Bill
          </Button>
          {billingVisits.length > 0 && (
            <Button
              onClick={() => setActiveTab('visits')}
              icon={<FileCheck size={18} />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Visits Ready ({billingVisits.length})
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Pending Bills ({pendingBills?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'visits'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ClipboardList className="inline w-4 h-4 mr-1" />
          Visits for Billing ({billingVisits.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <History className="inline w-4 h-4 mr-1" />
          Payment History ({paymentHistory?.length || 0})
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Today's Collections</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.todayCollections)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Pending Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalPending)}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Pending Bills</p>
                <p className="text-2xl font-bold">{stats?.pendingCount || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalPaid)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Conditional based on tab */}
      {activeTab === 'pending' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bills List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pending Bills</h2>
              <span className="text-sm text-gray-500">{filteredBills.length} bills</span>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No pending bills</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {filteredBills.map((bill) => (
                  <motion.div
                    key={bill.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedBill(bill)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedBill?.id === bill.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {bill.patient?.firstName} {bill.patient?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{bill.billNumber}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(bill.status)}`}>
                        {bill.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-gray-500">Balance:</span>
                      <span className="font-bold text-red-600">{formatCurrency(bill.balance)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="lg:col-span-2">
          {!selectedBill ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Select a bill to view details</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              {/* Bill Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedBill.patient?.firstName} {selectedBill.patient?.lastName}
                    </h3>
                    <p className="text-green-100 text-sm">{selectedBill.billNumber}</p>
                  </div>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-white text-green-600 hover:bg-green-50"
                    icon={<Banknote size={18} />}
                  >
                    Record Payment
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedBill.totalAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedBill.amountPaid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedBill.balance)}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Bill Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
                          <th className="px-4 py-2 text-center font-medium text-gray-700">Qty</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Unit Price</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedBill.items?.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded mr-2">
                                {item.itemType}
                              </span>
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payments */}
                {selectedBill.payments?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Payment History</h4>
                    <div className="space-y-2">
                      {selectedBill.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-green-600">
                                {payment.paymentMethod} • {new Date(payment.paymentDate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {payment.reference && (
                            <span className="text-xs text-gray-500">Ref: {payment.reference}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 pt-4 border-t flex gap-2">
                  <Button variant="outline" icon={<Printer size={16} />}>
                    Print Receipt
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Visits Ready for Billing
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Generate bills from services provided during patient visits
            </p>
          </div>
          
          {billingVisits.length === 0 ? (
            <div className="p-12 text-center">
              <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No visits ready for billing</p>
              <p className="text-sm text-gray-400 mt-1">
                Visits will appear here when they reach the billing stage
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {billingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {visit.patient?.firstName} {visit.patient?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {visit.visitNumber} • {new Date(visit.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <p className="text-sm text-gray-500">Visit Type</p>
                        <p className="font-medium capitalize">{visit.visitType?.toLowerCase()}</p>
                      </div>
                      <Button
                        onClick={() => handleViewVisitCharges(visit)}
                        icon={<Receipt size={16} />}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        View Charges
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Payment History
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              All payment transactions recorded in the system
            </p>
          </div>
          
          {(!paymentHistory || paymentHistory.length === 0) ? (
            <div className="p-12 text-center">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No payment history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(payment.paymentDate).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {payment.bill?.patient?.firstName} {payment.bill?.patient?.lastName}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {payment.bill?.patient?.patientNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">
                        {payment.bill?.billNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                          payment.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-800' :
                          payment.paymentMethod === 'MOBILE_MONEY' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {payment.paymentMethod?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.reference || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
        size="sm"
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{selectedBill.patient?.firstName} {selectedBill.patient?.lastName}</p>
              <p className="text-sm text-gray-500">{selectedBill.billNumber}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span>Balance:</span>
                <span className="font-bold text-red-600">{formatCurrency(selectedBill.balance)}</span>
              </div>
            </div>

            <Input
              label="Payment Amount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              required
            />

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'CARD', label: 'Card' },
                { value: 'MOBILE_MONEY', label: 'Mobile Money' },
                { value: 'INSURANCE', label: 'Insurance' },
              ]}
            />

            <Input
              label="Reference (Optional)"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Transaction reference"
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleRecordPayment} loading={loading}>
                Record Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Bill Modal */}
      <Modal
        isOpen={showCreateBillModal}
        onClose={() => setShowCreateBillModal(false)}
        title="Create New Bill"
        size="lg"
      >
        <div className="space-y-4">
          {/* Patient Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedPatient.patientNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient by name or ID..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
                {searchResults.length > 0 && patientSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientSearch('');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50"
                      >
                        <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                        <p className="text-sm text-gray-500">{patient.patientNumber}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bill Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <button
                onClick={addBillItem}
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {billItems.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Select
                      value={item.itemType}
                      onChange={(e) => updateBillItem(index, 'itemType', e.target.value)}
                      options={[
                        { value: 'CONSULTATION', label: 'Consultation' },
                        { value: 'MEDICATION', label: 'Medication' },
                        { value: 'LAB_TEST', label: 'Lab Test' },
                        { value: 'PROCEDURE', label: 'Procedure' },
                      ]}
                      className="w-40"
                    />
                    <Input
                      value={item.description}
                      onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1"
                    />
                    {billItems.length > 1 && (
                      <button
                        onClick={() => removeBillItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateBillItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="w-20"
                      min={1}
                    />
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateBillItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="Unit Price"
                      className="flex-1"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">{formatCurrency(calculateBillTotal())}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateBillModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleCreateBill} loading={loading}>
              Create Bill
            </Button>
          </div>
        </div>
      </Modal>

      {/* Visit Charges Modal */}
      <Modal
        isOpen={showVisitBillModal}
        onClose={() => {
          setShowVisitBillModal(false);
          setSelectedVisit(null);
          setVisitChargesData([]);
        }}
        title="Visit Charges"
        size="lg"
      >
        {selectedVisit && (
          <div className="space-y-4">
            {/* Visit Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedVisit.patient?.firstName} {selectedVisit.patient?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedVisit.visitNumber} • {new Date(selectedVisit.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Charges List */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Services Provided</h4>
              {visitChargesData.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border rounded-lg">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No charges recorded for this visit</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Service</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-700">Qty</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Unit Price</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Total</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(visitChargesData || []).map((charge) => (
                        <tr key={charge.id}>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded mr-2">
                              {charge.service?.category}
                            </span>
                            {charge.service?.serviceName}
                          </td>
                          <td className="px-4 py-3 text-center">{charge.quantity}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(charge.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-medium">{formatCurrency(charge.totalPrice)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              charge.status === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : charge.status === 'BILLED'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {charge.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Total */}
            {(visitChargesData || []).length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Unbilled Charges</p>
                    <p className="font-medium">
                      {(visitChargesData || []).filter(c => c.status === 'PENDING').length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateVisitTotal())}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setShowVisitBillModal(false);
                  setSelectedVisit(null);
                  setVisitChargesData([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={handleGenerateBillFromVisit} 
                loading={loading}
                disabled={visitChargesData.filter(c => c.status === 'PENDING').length === 0}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Generate Bill
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

