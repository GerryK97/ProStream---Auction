'use client';

import React, { useState, useEffect } from 'react';
import { Customer } from '@/types/invoicing';

interface CustomerSelectorProps {
  value: string;
  onChange: (customerId: string) => void;
  onCustomerSelect?: (customer: Customer | null) => void;
}

export default function CustomerSelector({ value, onChange, onCustomerSelect }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (onCustomerSelect) {
      const customer = customers.find((c) => c._id === value) || null;
      onCustomerSelect(customer);
    }
  }, [value, customers, onCustomerSelect]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      alert('Name and email are required');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers([...customers, data.customer]);
        onChange(data.customer._id);
        setShowCreateForm(false);
        setNewCustomer({ name: '', email: '', phone: '', companyName: '' });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create customer');
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      alert('Failed to create customer');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center" style={{ color: 'var(--text-tertiary)' }}>
        Loading customers...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Customer *
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--surface-card)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--brand-primary)',
          } as React.CSSProperties}
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name} {customer.companyName ? `(${customer.companyName})` : ''} - {customer.email}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: 'var(--brand-secondary)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {showCreateForm ? 'Cancel' : 'Add New Customer'}
      </button>

      {showCreateForm && (
        <div
          className="p-4 rounded-lg border space-y-3"
          style={{
            backgroundColor: 'var(--surface-elevated)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            New Customer
          </h3>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as React.CSSProperties}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Email *
            </label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface-card)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--brand-primary)',
              } as React.CSSProperties}
              placeholder="john@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Phone
              </label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--brand-primary)',
                } as React.CSSProperties}
                placeholder="+94 77 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Company
              </label>
              <input
                type="text"
                value={newCustomer.companyName}
                onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-card)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--brand-primary)',
                } as React.CSSProperties}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateCustomer}
            className="w-full px-4 py-2 rounded-lg font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-secondary)' }}
          >
            Create Customer
          </button>
        </div>
      )}
    </div>
  );
}
