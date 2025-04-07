import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader } from 'lucide-react';
import type { ContentPlan } from '../lib/types';

interface ScheduleModalProps {
  plan: ContentPlan;
  onSchedule: any;
  onClose: () => void;
}

export function ScheduleModal({ plan, onSchedule, onClose }: ScheduleModalProps) {
 
  const getDefaultDateTime = () => {
    const now = new Date();
   
    now.setHours(now.getHours() );
 
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [scheduledFor, setScheduledFor] = useState(getDefaultDateTime());
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPastDate, setIsPastDate] = useState(false);

  useEffect(() => {
    if (scheduledFor) {
      const selectedDate = new Date(scheduledFor);
      const currentDate = new Date();
      setIsPastDate(selectedDate <= currentDate);
    } else {
      setIsPastDate(false);
    }
  }, [scheduledFor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (isPastDate) {
      setError("Cannot schedule for a past date or time");
      return;
    }
    
    setScheduling(true);
    setError(null);
    try {
      await onSchedule(scheduledFor);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Schedule the Post</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm bg-red-900 bg-opacity-20 p-2 rounded">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-300 mb-1">
              Date and Time
            </label>
            <input
              type="datetime-local"
              id="scheduledFor"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
              required
            />
            {isPastDate && (
              <p className="text-red-400 text-xs mt-1">
                Cannot schedule for a past date or time
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduling || isPastDate || !scheduledFor}
              className={`px-4 py-2 ${
                isPastDate || !scheduledFor
                  ? 'bg-purple-600/50 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white rounded-md flex items-center space-x-1`}
            >
              {scheduling ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  <span>Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}