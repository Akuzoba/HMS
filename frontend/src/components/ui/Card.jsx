import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Card({ children, className, hover = false, ...props }) {
  return (
    <motion.div
      className={cn(
        'bg-white rounded-lg shadow-md border border-neutral-200 p-6',
        hover && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn('mb-4 pb-4 border-b border-neutral-200', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn('text-lg font-semibold text-neutral-900', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}
