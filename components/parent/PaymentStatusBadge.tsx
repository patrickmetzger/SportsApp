type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  partial: {
    label: 'Partial',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
};

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
