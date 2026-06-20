import Navigation from '@/components/Navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – ProStream',
  description: 'Privacy policy for the ProStream mobile app and platform.',
};

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        heading: 'Account Information',
        body: 'When you register, we collect your username, email address, and password (stored as a secure hash — never plain text). You may optionally provide a mobile phone number, used solely for OTP identity verification.',
      },
      {
        heading: 'Usage Data',
        body: 'We collect information about your interactions with the platform, including match scoring activity, auction participation, and wallet credit history associated with your account.',
      },
      {
        heading: 'Device Information',
        body: 'We may collect basic device identifiers (OS version, device type) for debugging and compatibility purposes when using the ProStream mobile app.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    items: [
      'To create and manage your ProStream account',
      'To send OTP verification codes to your mobile number when you request them (e.g. to verify your phone or confirm a password change)',
      'To display live cricket scores and auction data relevant to your account',
      'To manage wallet credits and auction participation',
      'To communicate important account or service updates',
    ],
  },
  {
    title: '3. SMS / OTP',
    content: [
      {
        heading: '',
        body: 'If you provide a mobile number, we use a third-party SMS gateway (text.lk) solely to deliver OTP verification codes that you explicitly request. We do not send unsolicited marketing SMS messages. Your number is never sold or shared with advertisers.',
      },
    ],
  },
  {
    title: '4. Sharing of Information',
    content: [
      {
        heading: '',
        body: 'We do not sell, trade, or rent your personal information to third parties. We may share data only in the following limited cases:',
      },
    ],
    items: [
      'With our SMS provider (text.lk) to deliver OTP codes you request',
      'With our hosting infrastructure provider (Vercel) to operate the service',
      'If required by law or to protect our legal rights',
    ],
  },
  {
    title: '5. Data Retention',
    content: [
      {
        heading: '',
        body: 'We retain your account information for as long as your account is active. OTP verification records are deleted or marked as used immediately after verification. You may request deletion of your account by contacting us at the email below.',
      },
    ],
  },
  {
    title: '6. Security',
    content: [
      {
        heading: '',
        body: 'We implement industry-standard security measures including password hashing (bcrypt), HTTPS encryption for all data in transit, and token-based authentication. No method of transmission over the internet is 100% secure, but we strive to protect your data.',
      },
    ],
  },
  {
    title: "7. Children's Privacy",
    content: [
      {
        heading: '',
        body: 'The ProStream platform is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete it promptly.',
      },
    ],
  },
  {
    title: '8. Your Rights',
    content: [
      {
        heading: '',
        body: 'You have the right to access, correct, or request deletion of the personal information we hold about you. To exercise these rights, contact us at the email address below.',
      },
    ],
    items: [
      'Access the personal information we hold about you',
      'Request correction of inaccurate data',
      'Request deletion of your account and associated data',
    ],
  },
  {
    title: '9. Third-Party Services',
    content: [
      {
        heading: '',
        body: 'The ProStream platform is hosted on Vercel. Their privacy practices are governed by Vercel\'s Privacy Policy (vercel.com/legal/privacy-policy). SMS delivery is handled by text.lk.',
      },
    ],
  },
  {
    title: '10. Changes to This Policy',
    content: [
      {
        heading: '',
        body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the date at the top of this page. Continued use of the platform after changes constitutes acceptance of the revised policy.',
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      <Navigation />

      <main className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.6em]" style={{ color: 'var(--brand-secondary)' }}>Legal</p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            How ProStream collects, uses, and protects your information.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Last updated: 17 June 2025</p>
        </section>

        {/* Sections */}
        <div className="mx-auto mt-16 max-w-3xl space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-3xl border p-8 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
              style={{
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--surface-card)',
              }}
            >
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{section.title}</h2>

              {section.content?.map((block, i) => (
                <div key={i} className="mt-4">
                  {block.heading && (
                    <h3 className="text-sm font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--brand-secondary)' }}>
                      {block.heading}
                    </h3>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{block.body}</p>
                </div>
              ))}

              {section.items && (
                <ul className="mt-4 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Contact */}
          <div
            className="rounded-3xl border p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'linear-gradient(to bottom right, color-mix(in oklab, var(--brand-primary) 20%, var(--surface-card)), color-mix(in oklab, var(--brand-primary) 5%, var(--surface-card)))',
            }}
          >
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>11. Contact Us</h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please reach out:
            </p>
            <a
              href="mailto:prostream.contact@gmail.com"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition hover:opacity-80"
              style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
            >
              prostream.contact@gmail.com
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
