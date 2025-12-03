import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  User, 
  Phone, 
  Calendar, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCircle2
} from 'lucide-react';
import { usePatientStore } from '@/store/patientStore';
import { toast } from 'sonner';

export default function PatientLookupPage() {
  const navigate = useNavigate();
  const { patients, loading, listPatients } = usePatientStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const loadPatients = async () => {
    try {
      await listPatients({ limit: 100 }); // Load first 100 patients
    } catch (error) {
      toast.error('Failed to load patients');
    }
  };

  const filterPatients = () => {
    if (!patients) {
      setFilteredPatients([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      setCurrentPage(1);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = patients.filter(patient => {
      const fullName = `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.toLowerCase();
      const patientNumber = patient.patientNumber?.toLowerCase() || '';
      const phoneNumber = patient.phoneNumber?.toLowerCase() || '';
      const email = patient.email?.toLowerCase() || '';

      return (
        fullName.includes(searchLower) ||
        patientNumber.includes(searchLower) ||
        phoneNumber.includes(searchLower) ||
        email?.includes(searchLower)
      );
    });

    setFilteredPatients(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Lookup</h1>
        <p className="text-gray-600">Search and view patient records</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, patient number, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
        </div>
        
        {/* Search Stats */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {currentPatients.length} of {filteredPatients.length} patients
            {searchTerm && ` (filtered from ${patients?.length || 0} total)`}
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading patients...</p>
        </div>
      ) : currentPatients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No patients found' : 'No patients registered'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Start by registering your first patient'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/patients/register')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Register New Patient
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {currentPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.firstName} {patient.middleName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{patient.patientNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${patient.id}`);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Patient Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(patient.dateOfBirth).toLocaleDateString()} 
                        <span className="ml-2 text-gray-500">
                          ({calculateAge(patient.dateOfBirth)} years old)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="capitalize">{patient.gender}</span>
                      {patient.bloodGroup && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                          {patient.bloodGroup}
                        </span>
                      )}
                    </div>

                    {patient.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{patient.phoneNumber}</span>
                      </div>
                    )}

                    {(patient.city || patient.region) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {patient.city}
                          {patient.city && patient.region && ', '}
                          {patient.region}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Tags */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {patient.allergies && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Allergies
                      </span>
                    )}
                    {patient.chronicConditions && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                        Chronic Conditions
                      </span>
                    )}
                    {patient.insuranceProvider && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Insured
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-1 rounded-lg ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Jump to Page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value);
                      if (page >= 1 && page <= totalPages) {
                        handlePageChange(page);
                      }
                    }}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
