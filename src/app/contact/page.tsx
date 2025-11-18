import BackgroundAnimation from '@/components/landing/BackgroundAnimation';
import Navigation from '@/components/Navigation';

const contactChannels = [
  {
    title: 'Email Support',
    description: 'Reach out for product questions, account access, or technical help. We reply within one business day.',
    action: 'support@prostream.com',
    href: 'mailto:support@prostream.com',
    badge: 'Primary',
    color: 'from-brand-primary/20 to-brand-primary/5 border-brand-primary/40',
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
    action: '+94 71 555 8899',
    href: 'https://wa.me/94715558899',
    badge: 'Live',
    color: 'from-brand-secondary/20 to-brand-secondary/5 border-brand-secondary/40',
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
    action: 'facebook.com/ProStreamAuction',
    href: 'https://facebook.com/ProStreamAuction',
    badge: 'Community',
    color: 'from-status-purple/20 to-status-purple/5 border-status-purple/40',
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 9H15V6h-1.5C11.015 6 10 7.657 10 9.75V11H8v3h2v6h3v-6h2.143L15.5 11H13v-1.25c0-.414.336-.75.75-.75z" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <BackgroundAnimation />
      <Navigation />

      <main className="relative z-10 px-4 py-20 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.6em] text-brand-secondary">Contact</p>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">We’re here whenever you go live</h1>
          <p className="mt-4 text-lg text-neutral-300">
            Whether you need onboarding help, auction-night support, or want to join the broadcast community, choose the
            channel that suits you best.
          </p>
        </section>

        <section className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">
          {contactChannels.map((channel) => (
            <div
              key={channel.title}
              className={`rounded-3xl border bg-gradient-to-br p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur ${channel.color}`}
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-white/10 p-3 text-white">{channel.icon}</div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  {channel.badge}
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-bold">{channel.title}</h2>
              <p className="mt-3 text-sm text-neutral-200">{channel.description}</p>
              <div className="mt-6">
                <a
                  href={channel.href}
                  target={channel.href.startsWith('http') ? '_blank' : undefined}
                  rel={channel.href.startsWith('http') ? 'noreferrer' : undefined}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
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

        <section className="mx-auto mt-16 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-neutral-200">
          <p>
            Need a tailored onboarding session or enterprise support plan? Email us with your tournament dates and we’ll
            schedule a walkthrough within 48 hours.
          </p>
        </section>
      </main>
    </div>
  );
}
