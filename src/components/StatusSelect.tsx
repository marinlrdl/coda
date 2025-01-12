import React from 'react';
import type { OrderStatus } from '../types/supabase';

interface StatusSelectProps {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
  className?: string;
}

export default function StatusSelect({ value, onChange, disabled = false, className = '' }: StatusSelectProps) {
  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'completed', label: 'Completed' }
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OrderStatus)}
      disabled={disabled}
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 ${className}`}
    >
      {statusOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}