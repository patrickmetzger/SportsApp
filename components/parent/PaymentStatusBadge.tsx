type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-600',
  },
  paid: {
    label: 'Paid',
    className: 'bg-teal-100 text-teal-700',
  },
  partial: {
    label: 'Partial',
    className: 'bg-amber-100 text-amber-700',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-700',
  },
};

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
