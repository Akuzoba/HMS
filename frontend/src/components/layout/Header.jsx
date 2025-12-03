import { Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function Header() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Welcome back, {user?.firstName} 👋
        </h2>
        <p className="text-sm text-neutral-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 text-neutral-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 h-2 w-2 bg-error-500 rounded-full"></span>
        </motion.button>

        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut size={16} />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
