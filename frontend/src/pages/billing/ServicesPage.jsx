import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Stethoscope, Plus, Search, Edit, DollarSign, 
  Check, X, Tag, ListFilter, Settings
} from 'lucide-react';
import { useServicesStore } from '@/store/servicesStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';

export default function ServicesPage() {
  const {
    services,
    servicesByCategory,
    categories,
    loading,
    getServices,
    createService,
    updateService,
  } = useServicesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    serviceCode: '',
    serviceName: '',
    category: 'CONSULTATION',
    description: '',
    unitPrice: '',
  });

  useEffect(() => {
    getServices();
  }, [getServices]);

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || 
      service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddService = async () => {
    if (!formData.serviceCode || !formData.serviceName || !formData.unitPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createService({
        ...formData,
        unitPrice: parseFloat(formData.unitPrice),
      });
      toast.success('Service created successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create service');
    }
  };

  const handleEditService = async () => {
    if (!formData.serviceName || !formData.unitPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updateService(editingService.id, {
        serviceName: formData.serviceName,
        category: formData.category,
        description: formData.description,
        unitPrice: parseFloat(formData.unitPrice),
        isActive: editingService.isActive,
      });
      toast.success('Service updated successfully');
      setShowEditModal(false);
      setEditingService(null);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update service');
    }
  };

  const handleToggleActive = async (service) => {
    try {
      await updateService(service.id, {
        isActive: !service.isActive,
      });
      toast.success(`Service ${service.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update service status');
    }
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      category: service.category,
      description: service.description || '',
      unitPrice: service.unitPrice.toString(),
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      serviceCode: '',
      serviceName: '',
      category: 'CONSULTATION',
      description: '',
      unitPrice: '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount || 0);
  };

  const getCategoryColor = (category) => {
    const colors = {
      CONSULTATION: 'bg-blue-100 text-blue-800',
      LABORATORY: 'bg-purple-100 text-purple-800',
      PHARMACY: 'bg-green-100 text-green-800',
      PROCEDURE: 'bg-orange-100 text-orange-800',
      NURSING: 'bg-pink-100 text-pink-800',
      RADIOLOGY: 'bg-indigo-100 text-indigo-800',
      ADMISSION: 'bg-yellow-100 text-yellow-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="text-blue-600" />
            Hospital Services
          </h1>
          <p className="text-gray-600">Manage services and pricing for billing</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          icon={<Plus size={18} />}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Services</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold">{services.filter(s => s.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-2xl font-bold">{Object.keys(servicesByCategory).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Price</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(services.reduce((sum, s) => sum + s.unitPrice, 0) / (services.length || 1))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ListFilter className="w-5 h-5 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`hover:shadow-md transition-shadow ${!service.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{service.serviceCode}</span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {service.serviceName}
                  </h3>
                  
                  {service.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(service.unitPrice)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(service)}
                        className={`p-2 rounded-lg transition-colors ${
                          service.isActive 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={service.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {service.isActive ? <Check size={16} /> : <X size={16} />}
                      </button>
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No services found</p>
        </div>
      )}

      {/* Add Service Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Service"
      >
        <div className="space-y-4">
          <Input
            label="Service Code *"
            placeholder="e.g., CONS-GEN"
            value={formData.serviceCode}
            onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value.toUpperCase() })}
          />
          <Input
            label="Service Name *"
            placeholder="e.g., General Consultation"
            value={formData.serviceName}
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
          />
          <Select
            label="Category *"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>
          <Input
            label="Description"
            placeholder="Brief description of the service"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Unit Price (GHS) *"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService} disabled={loading}>
              {loading ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingService(null);
        }}
        title="Edit Service"
      >
        <div className="space-y-4">
          <Input
            label="Service Code"
            value={formData.serviceCode}
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Service Name *"
            placeholder="e.g., General Consultation"
            value={formData.serviceName}
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
          />
          <Select
            label="Category *"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>
          <Input
            label="Description"
            placeholder="Brief description of the service"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Unit Price (GHS) *"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditService} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
