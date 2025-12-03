import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(({ 
  label, 
  error, 
  className, 
  containerClassName,
  icon,
  ...props 
}, ref) => {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-neutral-900 placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors duration-200',
            error && 'border-error-500 focus:ring-error-500',
            !error && 'border-neutral-300',
            icon && 'pl-10',
            props.disabled && 'bg-neutral-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Select = forwardRef(({ 
  label, 
  error, 
  options = [], 
  className, 
  containerClassName,
  placeholder = 'Select...',
  ...props 
}, ref) => {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-neutral-900',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-colors duration-200',
          error && 'border-error-500 focus:ring-error-500',
          !error && 'border-neutral-300',
          props.disabled && 'bg-neutral-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export const Textarea = forwardRef(({ 
  label, 
  error, 
  className, 
  containerClassName,
  ...props 
}, ref) => {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3 py-2 border rounded-lg text-neutral-900 placeholder:text-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-colors duration-200 resize-none',
          error && 'border-error-500 focus:ring-error-500',
          !error && 'border-neutral-300',
          props.disabled && 'bg-neutral-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
