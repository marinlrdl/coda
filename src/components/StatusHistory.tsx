import React from 'react';
import { Clock, User } from 'lucide-react';
import type { StatusHistoryEntry } from '../types/supabase';
import StatusBadge from './StatusBadge';

interface StatusHistoryProps {
  history: StatusHistoryEntry[];
  className?: string;
}

export default function StatusHistory({ history, className = '' }: StatusHistoryProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start space-x-3 text-sm">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusBadge status={entry.current_status} />
                {entry.previous_status && (
                  <span className="text-gray-500">
                    from <StatusBadge status={entry.previous_status} />
                  </span>
                )}
              </div>
              <time className="text-gray-500">
                {new Date(entry.created_at).toLocaleString()}
              </time>
            </div>
            {entry.changed_by && (
              <div className="flex items-center text-gray-500">
                <User className="h-4 w-4 mr-1" />
                <span>Changed by {entry.changed_by}</span>
              </div>
            )}
            {entry.notes && (
              <p className="text-gray-700 mt-1">{entry.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}