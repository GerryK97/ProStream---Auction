import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Quotation, Customer } from '@/types/invoicing';

// Create styles (similar to invoice but with quotation-specific colors)
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  quotationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  column: {
    flexDirection: 'column',
    width: '48%',
  },
  label: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    color: '#111827',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderBottom: '2px solid #10B981',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #E5E7EB',
    padding: 8,
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCellText: {
    fontSize: 10,
    color: '#111827',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 250,
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2px solid #10B981',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  notesSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#374151',
  },
  notesText: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  statusAccepted: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusSent: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  statusDraft: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  statusExpired: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  validityBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 4,
    border: '1px solid #10B981',
  },
  validityText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: 'bold',
  },
});

interface QuotationTemplateProps {
  quotation: Quotation;
  customer: Customer;
}

export const QuotationTemplate: React.FC<QuotationTemplateProps> = ({ quotation, customer }) => {
  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusStyle = () => {
    switch (quotation.status) {
      case 'accepted':
        return styles.statusAccepted;
      case 'sent':
        return styles.statusSent;
      case 'rejected':
        return styles.statusRejected;
      case 'expired':
        return styles.statusExpired;
      default:
        return styles.statusDraft;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ProStream</Text>
          <Text style={styles.tagline}>AUCTION PLATFORM</Text>
        </View>

        {/* Quotation Title and Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.quotationTitle}>QUOTATION</Text>
          <View style={[styles.statusBadge, getStatusStyle()]}>
            <Text>{quotation.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Quotation Details and Customer Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Quotation Details</Text>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>Quotation Number</Text>
              <Text style={styles.value}>{quotation.quotationNumber}</Text>
            </View>
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>Issue Date</Text>
              <Text style={styles.value}>{formatDate(quotation.issueDate)}</Text>
            </View>
            <View>
              <Text style={styles.label}>Valid Until</Text>
              <Text style={styles.value}>{formatDate(quotation.validUntil)}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Prepared For</Text>
            <Text style={[styles.value, { fontWeight: 'bold', marginBottom: 4 }]}>{customer.name}</Text>
            {customer.companyName && (
              <Text style={[styles.value, { marginBottom: 4 }]}>{customer.companyName}</Text>
            )}
            <Text style={styles.value}>{customer.email}</Text>
            {customer.phone && (
              <Text style={styles.value}>{customer.phone}</Text>
            )}
          </View>
        </View>

        {/* Validity Notice */}
        <View style={styles.validityBox}>
          <Text style={styles.validityText}>
            This quotation is valid until {formatDate(quotation.validUntil)}
          </Text>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableCol1}>
              <Text style={styles.tableHeaderText}>Description</Text>
            </View>
            <View style={styles.tableCol2}>
              <Text style={styles.tableHeaderText}>Qty</Text>
            </View>
            <View style={styles.tableCol3}>
              <Text style={styles.tableHeaderText}>Unit Price</Text>
            </View>
            <View style={styles.tableCol4}>
              <Text style={styles.tableHeaderText}>Total</Text>
            </View>
          </View>

          {quotation.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text style={styles.tableCellText}>{item.description}</Text>
              </View>
              <View style={styles.tableCol2}>
                <Text style={styles.tableCellText}>{item.quantity}</Text>
              </View>
              <View style={styles.tableCol3}>
                <Text style={styles.tableCellText}>{formatCurrency(item.unitPrice)}</Text>
              </View>
              <View style={styles.tableCol4}>
                <Text style={styles.tableCellText}>{formatCurrency(item.total)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.subtotal)}</Text>
          </View>

          {quotation.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({quotation.taxRate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(quotation.tax)}</Text>
            </View>
          )}

          {quotation.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={[styles.totalValue, { color: '#DC2626' }]}>
                -{formatCurrency(quotation.discount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(quotation.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {quotation.terms && (
          <View style={[styles.notesSection, { marginTop: 10 }]}>
            <Text style={styles.notesTitle}>Terms & Conditions</Text>
            <Text style={styles.notesText}>{quotation.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by ProStream InvoiceIt • {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
};
