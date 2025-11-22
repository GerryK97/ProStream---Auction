import BackgroundAnimation from '@/components/landing/BackgroundAnimation';
import Navigation from '@/components/Navigation';

const contactChannels = [
  {
    title: 'Email Support',
    description: 'Reach out for product questions, account access, or technical help. We reply within one business day.',
    action: 'prostream.contact@gmail.com',
    href: 'mailto:prostream.contact@gmail.com',
    badge: 'Primary',
    gradientColor: 'var(--brand-primary)',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp Hotline',
    description: 'Live coordination support during auctions. Save our number for quick voice or text help.',
    action: 'Message Us',
    href: 'https://wa.me/94772801110',
    badge: 'Live',
    gradientColor: 'var(--brand-secondary)',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 13.487l-.045-.026a5.273 5.273 0 01-1.561-.983 8.054 8.054 0 01-1.267-1.4 5.291 5.291 0 01-.91-1.812l-.014-.05a1.185 1.185 0 00-1.12-.852c-.434 0-.847.018-1.24.054-.394.036-.668.34-.751.744-.266 1.305-.111 2.49.465 3.554.576 1.065 1.356 1.944 2.34 2.636.982.69 2.138 1.144 3.468 1.36.395.064.79-.088 1.013-.404.223-.317.28-.736.143-1.122z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 10-4.5 7.794L19 21l-.793-2.5A8.966 8.966 0 0021 12z" />
      </svg>
    ),
  },
  {
    title: 'Facebook Community',
    description: 'Follow announcements, feature drops, and production tips from other broadcasters running ProStream.',
    action: 'ProStream Auction',
    href: 'https://www.facebook.com/profile.php?id=61582866560051',
    badge: 'Community',
    gradientColor: 'var(--accent-color)',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 9H15V6h-1.5C11.015 6 10 7.657 10 9.75V11H8v3h2v6h3v-6h2.143L15.5 11H13v-1.25c0-.414.336-.75.75-.75z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}>
      <BackgroundAnimation />
      <Navigation />

      <main className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.6em]" style={{ color: 'var(--brand-secondary)' }}>Contact</p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl" style={{ color: 'var(--text-primary)' }}>We're here whenever you go live</h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Whether you need onboarding help, auction-night support, or want to join the broadcast community, choose the
            channel that suits you best.
          </p>
        </section>

        <section className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">
          {contactChannels.map((channel) => (
            <div
              key={channel.title}
              className="rounded-3xl border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur"
              style={{
                borderColor: 'var(--border-primary)',
                background: `linear-gradient(to bottom right, color-mix(in oklab, ${channel.gradientColor} 20%, var(--surface-card)), color-mix(in oklab, ${channel.gradientColor} 5%, var(--surface-card)))`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}>{channel.icon}</div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]" style={{
                  backgroundColor: 'var(--surface-card)',
                  color: 'var(--text-tertiary)'
                }}>
                  {channel.badge}
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{channel.title}</h2>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{channel.description}</p>
              <div className="mt-6">
                <a
                  href={channel.href}
                  target={channel.href.startsWith('http') ? '_blank' : undefined}
                  rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--surface-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {channel.action}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-16 max-w-3xl rounded-3xl p-8 text-center" style={{
          borderColor: 'var(--border-primary)',
          border: `1px solid var(--border-primary)`,
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text-secondary)'
        }}>
          <p>
            Need a tailored onboarding session or enterprise support plan? Email us with your tournament dates and we'll
            schedule a walkthrough within 48 hours.
          </p>
        </section>
      </main>
    </div>
  );
}
