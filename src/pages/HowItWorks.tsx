import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import SEOHead from '@/components/storefront/SEOHead';
import { merchantJourney, merchantFAQs } from '@/lib/merchantJourney';
import { useEffect } from 'react';
import { trackMarketing } from '@/lib/marketingAnalytics';

const HowItWorks = () => {
  useEffect(() => {
    trackMarketing({ event: 'how_it_works_page_view', section: 'how-it-works-page' });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="How Pic to Cart Works — Launch Your Store in 5 Steps"
        description="See exactly how merchants go from sign-up to first sale on Pic to Cart. Step-by-step walkthrough, FAQs and a free 5-minute setup."
        url="https://pictocart.in/how-it-works"
        type="website"
      />

      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">Pic to Cart</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Home</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="py-16 sm:py-24 bg-gradient-to-b from-orange-50 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold mb-4">
            How It Works
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
            From sign-up to first sale —{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">in 5 steps</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A walkthrough of every screen you'll touch as a merchant on Pic to Cart. No surprises, no setup calls, no developers.
          </p>
        </div>
      </header>

      {/* STEPS */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
          {merchantJourney.map((s) => (
            <article key={s.step} className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-6 w-6 ${s.iconText}`} />
                  </div>
                  <span className="text-sm font-mono font-semibold text-slate-400">STEP {s.step}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">{s.title}</h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-5">{s.long ?? s.desc}</p>
                {s.bullets && (
                  <ul className="space-y-2.5">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700">
                        <Check className={`h-5 w-5 ${s.iconText} shrink-0 mt-0.5`} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="order-1 lg:order-2 relative">
                <div className={`absolute -inset-4 bg-gradient-to-br ${s.accent} rounded-3xl opacity-20 blur-2xl`} />
                <div className="relative rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-xl bg-white">
                  <img src={s.image} alt={`Step ${s.step}: ${s.title}`} loading="lazy" width={1024} height={768} className="w-full h-auto" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold mb-4">FAQs</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Common questions, answered</h2>
            <p className="text-slate-600">Everything you'd ask before signing up.</p>
          </div>
          <Accordion type="single" collapsible className="bg-white rounded-2xl border border-slate-200 px-2 sm:px-4">
            {merchantFAQs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-slate-100">
                <AccordionTrigger
                  className="text-left text-base sm:text-lg font-semibold text-slate-900 py-5 hover:no-underline"
                  onClick={() => trackMarketing({ event: 'faq_open', section: 'how-it-works-page', label: f.q })}
                >
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-slate-600 leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">Ready to launch?</h2>
          <p className="text-lg text-white/80 mb-8">Free forever plan. No credit card. 5-minute setup.</p>
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-white text-indigo-600 hover:bg-slate-100 font-bold text-lg px-10 py-6"
              onClick={() => trackMarketing({ event: 'cta_click', section: 'how-it-works-page', label: 'final-cta' })}
            >
              Start Your Store Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
