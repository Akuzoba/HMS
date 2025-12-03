import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Search,
  Activity,
  Stethoscope,
  Pill,
  FlaskConical,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FileText,
  Send,
  Plus,
  BedDouble
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useConsultationUIStore } from '@/store/consultationUIStore';
import { cn } from '@/lib/utils';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ALL'] },
  { name: 'Patient Lookup', path: '/patients/lookup', icon: Search, roles: ['ALL'] },
  { name: 'Register Patient', path: '/patients/register', icon: UserPlus, roles: ['FRONT_DESK', 'ADMIN'] },
  { name: 'Triage', path: '/triage', icon: Activity, roles: ['NURSE', 'ADMIN'] },
  { 
    name: 'Consultation', 
    path: '/consultation', 
    icon: Stethoscope, 
    roles: ['DOCTOR', 'ADMIN'],
    subItems: [
      { name: 'Add Diagnosis', action: 'diagnosis', icon: Plus },
      { name: 'Prescribe', action: 'prescription', icon: Pill },
      { name: 'Order Labs', action: 'labs', icon: FlaskConical },
      { name: 'Route Patient', action: 'route', icon: Send },
    ]
  },
  { name: 'Pharmacy', path: '/pharmacy', icon: Pill, roles: ['PHARMACIST', 'ADMIN'] },
  { name: 'Laboratory', path: '/lab', icon: FlaskConical, roles: ['LAB_TECH', 'ADMIN'] },
  { name: 'IPD', path: '/ipd', icon: BedDouble, roles: ['DOCTOR', 'NURSE', 'ADMIN'] },
  { name: 'Billing', path: '/billing', icon: Receipt, roles: ['BILLING_CLERK', 'ADMIN'] },
  { name: 'Services', path: '/services', icon: ClipboardList, roles: ['BILLING_CLERK', 'ADMIN'] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const { user } = useAuthStore();
  const { triggerAction, isConsultationActive } = useConsultationUIStore();
  const location = useLocation();

  const filteredNavigation = navigationItems.filter(
    item => item.roles.includes('ALL') || item.roles.includes(user?.role?.name)
  );

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const isConsultationPage = location.pathname === '/consultation';

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3 }}
      className="bg-white border-r border-neutral-200 flex flex-col shadow-sm"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-neutral-900">HIS</h1>
              <p className="text-xs text-neutral-500">Hospital System</p>
            </div>
          )}
        </motion.div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedItems[item.name];
          const isActive = location.pathname === item.path;
          
          return (
            <div key={item.path}>
              {hasSubItems ? (
                <>
                  {/* Parent item with sub-items */}
                  <div className="flex flex-col">
                    <NavLink
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        'hover:bg-primary-50 group',
                        isActive
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'text-neutral-700'
                      )}
                    >
                      <Icon
                        size={20}
                        className={cn(
                          'flex-shrink-0',
                          isActive ? 'text-white' : 'text-neutral-500 group-hover:text-primary-500'
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="font-medium text-sm flex-1">{item.name}</span>
                          {isActive && isConsultationPage && isConsultationActive && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleExpanded(item.name);
                              }}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                            >
                              <ChevronDown 
                                size={16} 
                                className={cn(
                                  'transition-transform duration-200',
                                  isExpanded ? 'rotate-180' : ''
                                )}
                              />
                            </button>
                          )}
                        </>
                      )}
                    </NavLink>
                    
                    {/* Sub-items - Only show when on consultation page, active, and expanded */}
                    <AnimatePresence>
                      {!collapsed && isActive && isConsultationPage && isConsultationActive && isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-4 mt-1 space-y-1 border-l-2 border-primary-200 pl-3"
                        >
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <button
                                key={subItem.action}
                                onClick={() => triggerAction(subItem.action)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <SubIcon size={16} className="flex-shrink-0" />
                                <span>{subItem.name}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      'hover:bg-primary-50 group',
                      isActive
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'text-neutral-700'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={cn(
                          'flex-shrink-0',
                          isActive ? 'text-white' : 'text-neutral-500 group-hover:text-primary-500'
                        )}
                      />
                      {!collapsed && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-medium text-sm">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.role?.name}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
