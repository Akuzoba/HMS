import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const VisitStatusBadge = ({ visit }) => {
  const badges = [];

  // Vitals status
  if (visit.vitalsCompleted) {
    badges.push({
      key: 'vitals',
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Vitals Recorded',
      color: 'bg-green-100 text-green-800',
    });
  } else {
    badges.push({
      key: 'vitals',
      icon: <AlertCircle className="w-3 h-3" />,
      text: 'No Vitals',
      color: 'bg-yellow-100 text-yellow-800',
    });
  }

  // Consultation status
  if (visit.consultationCompleted) {
    badges.push({
      key: 'consultation',
      icon: <CheckCircle className="w-3 h-3" />,
      text: 'Consultation Done',
      color: 'bg-green-100 text-green-800',
    });
  } else {
    badges.push({
      key: 'consultation',
      icon: <AlertCircle className="w-3 h-3" />,
      text: 'Awaiting Consultation',
      color: 'bg-blue-100 text-blue-800',
    });
  }

  // Prescription status (only show if consultation is done)
  if (visit.consultationCompleted) {
    if (visit.prescriptionCompleted) {
      badges.push({
        key: 'prescription',
        icon: <CheckCircle className="w-3 h-3" />,
        text: 'Prescription Dispensed',
        color: 'bg-green-100 text-green-800',
      });
    } else {
      badges.push({
        key: 'prescription',
        icon: <AlertCircle className="w-3 h-3" />,
        text: 'Prescription Pending',
        color: 'bg-orange-100 text-orange-800',
      });
    }
  }

  // Lab order status (only if there are lab orders)
  const hasLabOrders = visit.consultations?.some(c => c.labOrders?.length > 0);
  if (hasLabOrders) {
    if (visit.labOrderCompleted) {
      badges.push({
        key: 'lab',
        icon: <CheckCircle className="w-3 h-3" />,
        text: 'Lab Results Ready',
        color: 'bg-green-100 text-green-800',
      });
    } else {
      badges.push({
        key: 'lab',
        icon: <AlertCircle className="w-3 h-3" />,
        text: 'Lab Pending',
        color: 'bg-purple-100 text-purple-800',
      });
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
        >
          {badge.icon}
          {badge.text}
        </span>
      ))}
    </div>
  );
};

export default VisitStatusBadge;
