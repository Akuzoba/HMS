import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  Clock, 
  TrendingUp, 
  UserPlus, 
  ClipboardList,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { usePatientStore } from '@/store/patientStore';
import { useVisitStore } from '@/store/visitStore';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, title, value, change, color, onClick }) => (
  <Card hover className="cursor-pointer" onClick={onClick}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-neutral-600">{title}</p>
        <h3 className="text-3xl font-bold text-neutral-900 mt-2">{value}</h3>
        {change && (
          <p className="text-sm text-success-600 mt-1 flex items-center gap-1">
            <TrendingUp size={14} />
            {change}
          </p>
        )}
      </div>
      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </Card>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { patients, loading: patientsLoading, listPatients } = usePatientStore();
  const { visits, loading: visitsLoading, listVisits } = useVisitStore();
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayPatients: 0,
    activeVisits: 0,
    pendingVisits: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load patients and visits
      await Promise.all([
        listPatients({ limit: 100 }),
        listVisits({ limit: 50 })
      ]);

      // Calculate stats from store data after loading
      setTimeout(() => {
        const today = new Date().toDateString();
        const todayPatients = patients?.filter(p => 
          new Date(p.createdAt).toDateString() === today
        ).length || 0;

        setStats({
          totalPatients: patients?.length || 0,
          todayPatients,
          activeVisits: visits?.filter(v => v.status === 'IN_PROGRESS').length || 0,
          pendingVisits: visits?.filter(v => v.status === 'PENDING').length || 0
        });
      }, 100);
    } catch (error) {
      console.error('Dashboard data error:', error);
      // Don't show error toast for initial load, use default stats
    }
  };

  const recentPatients = patients?.slice(0, 5) || [];
  const recentVisits = visits?.slice(0, 5) || [];

  // Role-based dashboard content
  const isFrontDesk = user?.role?.name === 'FRONT_DESK';
  const isDoctor = user?.role?.name === 'DOCTOR';
  const isNurse = user?.role?.name === 'NURSE';
  const isPharmacist = user?.role?.name === 'PHARMACIST';
  const isLabTech = user?.role?.name === 'LAB_TECH';
  const isAdmin = user?.role?.name === 'ADMIN';

  // Front Desk specific dashboard
  if (isFrontDesk || isAdmin) {

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">
            Front Desk Dashboard
          </h1>
          <p className="text-neutral-600 mt-1">
            Welcome back, {user?.firstName}! Manage patient registrations and visits
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            title="Total Patients"
            value={stats.totalPatients}
            color="bg-primary-500"
            onClick={() => navigate('/patients/lookup')}
          />
          <StatCard
            icon={UserPlus}
            title="Today's Registrations"
            value={stats.todayPatients}
            color="bg-secondary-500"
            onClick={() => navigate('/patients/register')}
          />
          <StatCard
            icon={Activity}
            title="Active Visits"
            value={stats.activeVisits}
            color="bg-success-500"
          />
          <StatCard
            icon={Clock}
            title="Pending Check-ins"
            value={stats.pendingVisits}
            color="bg-warning-500"
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/patients/register')}
                className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-center transition-colors border-2 border-transparent hover:border-primary-200"
              >
                <UserPlus className="text-primary-500 mb-2 mx-auto" size={28} />
                <p className="font-medium text-neutral-900">Register Patient</p>
                <p className="text-xs text-neutral-600 mt-1">New registration</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/patients/lookup')}
                className="p-4 bg-secondary-50 hover:bg-secondary-100 rounded-lg text-center transition-colors border-2 border-transparent hover:border-secondary-200"
              >
                <Search className="text-secondary-500 mb-2 mx-auto" size={28} />
                <p className="font-medium text-neutral-900">Find Patient</p>
                <p className="text-xs text-neutral-600 mt-1">Search records</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Open new visit modal - we'll create this
                  toast.info('Visit creation coming soon');
                }}
                className="p-4 bg-success-50 hover:bg-success-100 rounded-lg text-center transition-colors border-2 border-transparent hover:border-success-200"
              >
                <ClipboardList className="text-success-600 mb-2 mx-auto" size={28} />
                <p className="font-medium text-neutral-900">New Visit</p>
                <p className="text-xs text-neutral-600 mt-1">Check-in patient</p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  toast.info('Appointments feature coming soon');
                }}
                className="p-4 bg-warning-50 hover:bg-warning-100 rounded-lg text-center transition-colors border-2 border-transparent hover:border-warning-200"
              >
                <Calendar className="text-warning-600 mb-2 mx-auto" size={28} />
                <p className="font-medium text-neutral-900">Appointments</p>
                <p className="text-xs text-neutral-600 mt-1">View schedule</p>
              </motion.button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Patients */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Registered Patients</CardTitle>
            </CardHeader>
            <CardContent>
              {patientsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : recentPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No patients registered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPatients.map((patient, i) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-medium text-sm">
                            {patient.firstName?.[0]}{patient.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-sm text-neutral-500">{patient.patientNumber}</p>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Visits */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {visitsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : recentVisits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No visits today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentVisits.map((visit, i) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-neutral-900">
                            {visit.patient?.firstName} {visit.patient?.lastName}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              visit.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : visit.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-500">{visit.visitNumber}</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {visit.visitType?.replace('_', ' ')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Important Notices */}
        <Card>
          <CardHeader>
            <CardTitle>Important Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">System Maintenance</p>
                  <p className="text-sm text-blue-700">
                    Scheduled maintenance on Nov 20, 2025 from 2:00 AM - 4:00 AM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">New Feature</p>
                  <p className="text-sm text-green-700">
                    Patient appointment scheduling is now available!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default dashboard for other roles
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">
          Welcome back, {user?.firstName}! ({user?.role?.name})
        </p>
      </div>

      {/* Generic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients}
          color="bg-primary-500"
        />
        <StatCard
          icon={Activity}
          title="Active Visits"
          value={stats.activeVisits}
          color="bg-secondary-500"
        />
        <StatCard
          icon={Clock}
          title="Pending"
          value={stats.pendingVisits}
          color="bg-warning-500"
        />
        <StatCard
          icon={CheckCircle2}
          title="Completed Today"
          value={0}
          color="bg-success-500"
        />
      </div>

      {/* Role-specific message */}
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-primary-500" />
          <h3 className="text-xl font-semibold mb-2">
            {user?.role?.name} Dashboard
          </h3>
          <p className="text-gray-600">
            Role-specific dashboard content will be available here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
