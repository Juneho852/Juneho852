import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-2xl font-bold tracking-tight">MatchAI</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-brand-100 transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-white text-brand-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          AI-Powered Helper Matching Platform
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Find the Perfect<br />Domestic Helper in HK
        </h1>
        <p className="text-xl text-brand-100 max-w-2xl mx-auto mb-10">
          AI matching, secure payments via Stripe, and privacy-first communication.
          Trusted by hundreds of Hong Kong families.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register?role=EMPLOYER" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors text-lg">
            I'm an Employer
          </Link>
          <Link href="/register?role=HELPER" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-lg">
            I'm a Helper
          </Link>
          <Link href="/register?role=BROKER" className="border-2 border-white/50 text-white/80 font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-lg">
            Agency / Broker
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: '🤖',
            title: 'AI Matching Engine',
            desc: 'GPT-4o scores 50+ helpers against your requirements — personality, skills, and languages.',
          },
          {
            icon: '🔒',
            title: 'Privacy First',
            desc: 'Phone numbers are never exposed. Twilio Proxy masks real numbers like Uber does for drivers.',
          },
          {
            icon: '💳',
            title: 'Stripe Escrow',
            desc: 'Funds held securely until visa confirmation. Automatic broker payouts after 30-day hold.',
          },
          {
            icon: '📄',
            title: 'Document Automation',
            desc: 'Auto-fill ID407 government forms. e-Sign service agreements via DocuSign.',
          },
          {
            icon: '🎤',
            title: 'Voice Interviews',
            desc: 'AI-powered voice vetting via Vapi. In-app video interviews with recording.',
          },
          {
            icon: '🏢',
            title: 'Two Business Lines',
            desc: 'Domestic helpers and confinement nannies. Both fully supported on one platform.',
          },
        ].map((f) => (
          <div key={f.title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-brand-100 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
