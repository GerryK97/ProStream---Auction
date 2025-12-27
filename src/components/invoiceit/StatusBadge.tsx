'use client';

import React from 'react';
import { InvoiceStatus, QuotationStatus } from '@/types/invoicing';

interface StatusBadgeProps {
  status: InvoiceStatus | QuotationStatus;
  type: 'invoice' | 'quotation';
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === 'invoice') {
      switch (status as InvoiceStatus) {
        case 'draft':
          return {
            label: 'Draft',
            bgColor: 'rgba(107, 114, 128, 0.1)',
            textColor: 'var(--text-tertiary)',
          };
        case 'sent':
          return {
            label: 'Sent',
            bgColor: 'rgba(59, 130, 246, 0.1)',
            textColor: '#3b82f6',
          };
        case 'paid':
          return {
            label: 'Paid',
            bgColor: 'rgba(16, 185, 129, 0.1)',
            textColor: 'var(--brand-secondary)',
          };
        case 'overdue':
          return {
            label: 'Overdue',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            textColor: 'var(--status-error)',
          };
        case 'cancelled':
          return {
            label: 'Cancelled',
            bgColor: 'rgba(107, 114, 128, 0.1)',
            textColor: 'var(--text-tertiary)',
          };
        default:
          return {
            label: status,
            bgColor: 'rgba(107, 114, 128, 0.1)',
            textColor: 'var(--text-tertiary)',
          };
      }
    } else {
      switch (status as QuotationStatus) {
        case 'draft':
          return {
            label: 'Draft',
            bgColor: 'rgba(107, 114, 128, 0.1)',
            textColor: 'var(--text-tertiary)',
          };
        case 'sent':
          return {
            label: 'Sent',
            bgColor: 'rgba(59, 130, 246, 0.1)',
            textColor: '#3b82f6',
          };
        case 'accepted':
          return {
            label: 'Accepted',
            bgColor: 'rgba(16, 185, 129, 0.1)',
            textColor: 'var(--brand-secondary)',
          };
        case 'rejected':
          return {
            label: 'Rejected',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            textColor: 'var(--status-error)',
          };
        case 'expired':
          return {
            label: 'Expired',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            textColor: 'var(--status-warning)',
          };
        default:
          return {
            label: status,
            bgColor: 'rgba(107, 114, 128, 0.1)',
            textColor: 'var(--text-tertiary)',
          };
      }
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
    >
      {config.label}
    </span>
  );
}
