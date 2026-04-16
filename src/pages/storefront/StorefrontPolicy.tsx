import { useParams, Link } from 'react-router-dom';
import { useStorefront } from '@/hooks/useStorefront';
import StorefrontLayout, { resolveTheme } from '@/components/storefront/StorefrontLayout';
import SEOHead from '@/components/storefront/SEOHead';
import { Loader2, ChevronLeft } from 'lucide-react';

const POLICIES = {
  'return-policy': {
    title: 'Return & Refund Policy',
    sections: [
      { heading: 'Returns', body: 'We want you to be completely satisfied with your purchase. If you are not happy with your product, you may request a return within 7 days of delivery.' },
      { heading: 'Return Conditions', body: 'Items must be unused, in original packaging, and with all tags attached. Perishable goods, intimate items, and gift cards are non-returnable.' },
      { heading: 'Refund Process', body: 'Once we receive and inspect your return, we will notify you via email. Approved refunds will be processed to your original payment method within 5-7 business days.' },
      { heading: 'Exchanges', body: 'If you need a different size or variant, please contact us. We will arrange an exchange subject to availability.' },
      { heading: 'Damaged or Defective Items', body: 'If your item arrives damaged or defective, contact us within 48 hours with photos. We will arrange a replacement or full refund at no extra cost.' },
    ],
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    sections: [
      { heading: 'Processing Time', body: 'Orders are processed within 1-2 business days after payment confirmation. You will receive a tracking number once your order ships.' },
      { heading: 'Delivery Timeframes', body: 'Standard delivery takes 3-7 business days depending on your location. Metro cities typically receive deliveries faster.' },
      { heading: 'Shipping Charges', body: 'Shipping charges are calculated at checkout based on your location and order weight. Free shipping may be available on orders above a certain value.' },
      { heading: 'Tracking Your Order', body: 'Once shipped, you will receive tracking details via email/SMS. You can also check your order status from your account page.' },
      { heading: 'Failed Deliveries', body: 'If delivery fails due to incorrect address or unavailability, the courier will attempt re-delivery. Additional charges may apply for re-attempts.' },
    ],
  },
  'contact': {
    title: 'Contact Us',
    sections: [
      { heading: 'Get in Touch', body: 'We love hearing from our customers! Whether you have a question about our products, need help with an order, or just want to say hello — we are here for you.' },
      { heading: 'Response Time', body: 'We typically respond within 24 hours during business days. For urgent order-related queries, please include your order number.' },
    ],
  },
};

type PolicyType = keyof typeof POLICIES;

const StorefrontPolicy = () => {
  const { slug, policyType } = useParams<{ slug: string; policyType: string }>();
  const { store, loading } = useStorefront(slug || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Store not found</h1>
      </div>
    );
  }

  const policy = POLICIES[policyType as PolicyType];
  if (!policy) {
    return (
      <StorefrontLayout store={store}>
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <Link to={`/store/${slug}`} className="text-sm underline">Back to store</Link>
        </div>
      </StorefrontLayout>
    );
  }

  const theme = resolveTheme(store.theme);
  const { colors, fonts } = theme;

  // Pull seller's store info for contact page
  const settings = (store as any).settings || {};
  const storeInfo = settings.store_info || {};

  return (
    <StorefrontLayout store={store}>
      <SEOHead
        title={`${policy.title} | ${store.name}`}
        description={`${policy.title} for ${store.name}`}
        url={`${window.location.origin}/store/${slug}/${policyType}`}
      />
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link
          to={`/store/${slug}`}
          className="inline-flex items-center gap-1 text-sm opacity-60 hover:opacity-100 mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Back to store
        </Link>

        <h1
          className="text-2xl md:text-3xl font-bold mb-8"
          style={{ fontFamily: fonts.heading }}
        >
          {policy.title}
        </h1>

        <div className="space-y-6">
          {policy.sections.map((section, i) => (
            <div key={i}>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: fonts.heading }}
              >
                {section.heading}
              </h2>
              <p className="text-sm leading-relaxed opacity-70">{section.body}</p>
            </div>
          ))}

          {/* Contact page extras */}
          {policyType === 'contact' && (
            <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: colors.secondary }}>
              <h3 className="font-semibold mb-3" style={{ fontFamily: fonts.heading }}>Store Details</h3>
              <div className="space-y-2 text-sm opacity-70">
                <p><strong>Store:</strong> {store.name}</p>
                {storeInfo.email && <p><strong>Email:</strong> {storeInfo.email}</p>}
                {storeInfo.phone && <p><strong>Phone:</strong> {storeInfo.phone}</p>}
                {storeInfo.address && <p><strong>Address:</strong> {storeInfo.address}</p>}
              </div>
            </div>
          )}
        </div>

        <p className="mt-10 text-xs opacity-40">
          Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </StorefrontLayout>
  );
};

export default StorefrontPolicy;
