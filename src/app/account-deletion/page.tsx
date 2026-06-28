import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Account Deletion – ProStream',
  description: 'Request deletion of your ProStream account and associated personal data.',
};

const deletionSteps = [
  {
    title: '1. Send your request',
    body: 'Email us from the email address linked to your ProStream account. Include your username and registered phone number, if available.',
  },
  {
    title: '2. We verify ownership',
    body: 'For your safety, we may ask you to confirm your account email, username, or phone number before processing deletion.',
  },
  {
    title: '3. Account and personal data are deleted',
    body: 'After verification, we delete or anonymize your account profile and personal identifiers from our active systems.',
  },
];

const deletedData = [
  'Account profile information such as username, email address, display name, role, and phone number.',
  'Authentication data associated with your ProStream account.',
  'Device notification tokens linked to your account, if any.',
  'Tournament access assignments directly tied to your user account.',
];

const retainedData = [
  'Transaction, invoice, wallet, or audit records that must be retained for security, fraud prevention, dispute handling, tax, or legal compliance.',
  'Tournament, team, player, auction, scoring, and overlay records created by or shared with other users may be retained where needed to preserve tournament history and service integrity.',
  'Backups may retain deleted information for a limited period before automatic rotation removes it.',
];

export default function AccountDeletionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      <Navigation />

      <main className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.6em]" style={{ color: 'var(--brand-secondary)' }}>Account Deletion</p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl" style={{ color: 'var(--text-primary)' }}>
            Request deletion of your ProStream account
          </h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            You can request deletion of your ProStream account and associated personal data at any time.
            This page explains how to submit a request and what data may be retained where required.
          </p>
        </section>

        <section className="mx-auto mt-14 max-w-4xl rounded-3xl border p-6 sm:p-8" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-secondary)' }}>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>How to request account deletion</h2>
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
            Send an email to the address below with the subject line <strong>Account Deletion Request</strong>.
          </p>

          <a
            href="mailto:prostream.contact@gmail.com?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20ProStream%20account.%0A%0AUsername%3A%20%0ARegistered%20email%3A%20%0ARegistered%20phone%20number%3A%20%0AReason%20(optional)%3A%20"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-on-brand)' }}
          >
            Email deletion request
          </a>

          <p className="mt-4 font-mono text-sm" style={{ color: 'var(--text-tertiary)' }}>
            prostream.contact@gmail.com
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-3">
          {deletionSteps.map((step) => (
            <div key={step.title} className="rounded-3xl border p-6" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-card)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
              <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{step.body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-card)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Data deleted or anonymized</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {deletedData.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>

          <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-card)' }}>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Data that may be retained</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
              {retainedData.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-4xl rounded-3xl border p-6 text-sm leading-6" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Processing timeline</h2>
          <p className="mt-3">
            We aim to acknowledge requests within 7 days and complete verified deletion requests within 30 days,
            unless retention is required for legal, security, or dispute-resolution reasons.
          </p>
          <p className="mt-3">
            For privacy questions, read our <a href="/privacy" className="font-semibold underline" style={{ color: 'var(--brand-secondary)' }}>Privacy Policy</a>.
          </p>
        </section>
      </main>
    </div>
  );
}
