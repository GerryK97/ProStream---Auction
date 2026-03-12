'use client';

import React from 'react';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface LineItemsTableProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  readonly?: boolean;
}

export default function LineItemsTable({ items, onChange, readonly = false }: LineItemsTableProps) {
  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];

    if (field === 'description') {
      newItems[index][field] = value as string;
    } else {
      const numValue = value === '' ? 0 : (typeof value === 'string' ? parseFloat(value) : value);
      newItems[index][field] = value === '' ? ('' as any) : numValue;

      // Auto-calculate total
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(newItems[index].quantity) || 0;
        const price = Number(newItems[index].unitPrice) || 0;
        newItems[index].total = qty * price;
      }
    }

    onChange(newItems);
  };

  const handleAddItem = () => {
    onChange([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
              <th className="text-left p-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Description
              </th>
              <th className="text-right p-3 text-sm font-semibold w-24" style={{ color: 'var(--text-primary)' }}>
                Quantity
              </th>
              <th className="text-right p-3 text-sm font-semibold w-32" style={{ color: 'var(--text-primary)' }}>
                Unit Price (LKR)
              </th>
              <th className="text-right p-3 text-sm font-semibold w-32" style={{ color: 'var(--text-primary)' }}>
                Total (LKR)
              </th>
              {!readonly && (
                <th className="w-12"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={readonly ? 4 : 5} className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  No items added yet
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr
                  key={index}
                  style={{ borderBottom: '1px solid var(--border-primary)' }}
                  className="hover:bg-surface-hover transition"
                >
                  <td className="p-3">
                    {readonly ? (
                      <span style={{ color: 'var(--text-primary)' }}>{item.description}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'var(--surface-card)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)',
                          '--tw-ring-color': 'var(--brand-primary)',
                        } as React.CSSProperties}
                      />
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {readonly ? (
                      <span style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                    ) : (
                      <input
                        type="number"
                        value={item.quantity === 0 && item.quantity.toString() !== '0' ? '' : item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 rounded-lg border text-right focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'var(--surface-card)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)',
                          '--tw-ring-color': 'var(--brand-primary)',
                        } as React.CSSProperties}
                      />
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {readonly ? (
                      <span style={{ color: 'var(--text-primary)' }}>
                        {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={item.unitPrice === 0 && item.unitPrice.toString() !== '0' ? '' : item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 rounded-lg border text-right focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'var(--surface-card)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)',
                          '--tw-ring-color': 'var(--brand-primary)',
                        } as React.CSSProperties}
                      />
                    )}
                  </td>
                  <td className="p-3 text-right font-semibold" style={{ color: 'var(--brand-primary)' }}>
                    {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {!readonly && (
                    <td className="p-3">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition"
                        style={{ color: 'var(--status-error)' }}
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!readonly && (
        <button
          onClick={handleAddItem}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition hover:border-solid"
          style={{
            borderColor: 'var(--brand-primary)',
            color: 'var(--brand-primary)',
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Line Item
        </button>
      )}
    </div>
  );
}
