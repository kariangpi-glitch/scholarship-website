const STATUS_MAP = {
  pending: { label: 'Awaiting decision', className: 'badge-pending' },
  'institution-review': { label: 'With institution', className: 'badge-review' },
  verified: { label: 'Verified', className: 'badge-verified' },
  approved: { label: 'Approved', className: 'badge-approved' },
  rejected: { label: 'Declined', className: 'badge-rejected' },
  active: { label: 'Active', className: 'badge-approved' },
  inactive: { label: 'Inactive', className: 'badge-rejected' },
  forwarded: { label: 'Forwarded to admin', className: 'badge-forwarded' },
  'fund-sent': { label: 'Fund sent', className: 'badge-review' },
  'fund-received': { label: 'Fund received', className: 'badge-approved' },
  'pending-approval': { label: 'Pending approval', className: 'badge-pending' },
  withdrawn: { label: 'Withdrawn', className: 'badge-rejected' },
};

export default function StatusBadge({ status, label }) {
  const info = STATUS_MAP[status] || { label: status, className: 'badge-pending' };
  const text = label ?? info.label;
  return <span className={`badge ${info.className}`}>{text}</span>;
}
