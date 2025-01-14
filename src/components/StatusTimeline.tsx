import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { OrderStatus } from '../types/supabase';

interface StatusTimelineProps {
  status: OrderStatus;
  className?: string;
}

export default function StatusTimeline({ status, className = '' }: StatusTimelineProps) {
  const steps = [
    { key: 'new', label: 'New' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'In Review' },
    { key: 'completed', label: 'Completed' }
  ] as const;

  const currentStepIndex = steps.findIndex(step => step.key === status);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute left-0 top-4 h-0.5 w-full bg-gray-200">
          <div
            className="absolute h-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.key} className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                  {isCompleted ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : isCurrent ? (
                    <Clock className="h-8 w-8 text-indigo-600" />
                  ) : (
                    <div className={`h-8 w-8 rounded-full ${isPending ? 'border-2 border-gray-300' : 'bg-indigo-600'}`} />
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
