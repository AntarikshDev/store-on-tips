import { useState } from 'react';
import { useSubscribeNewsletter } from '@/hooks/useNewsletterSubscribers';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

interface Props {
  storeId: string;
  title?: string;
  subtitle?: string;
  colors: any;
  borderRadius: number;
}

const NewsletterSection = ({ storeId, title, subtitle, colors, borderRadius }: Props) => {
  const [email, setEmail] = useState('');
  const subscribe = useSubscribeNewsletter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate(
      { store_id: storeId, email },
      {
        onSuccess: () => {
          toast.success('Subscribed! 🎉');
          setEmail('');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to subscribe'),
      }
    );
  };

  return (
    <section className="py-12 px-4" style={{ backgroundColor: colors.secondary }}>
      <div className="max-w-md mx-auto text-center">
        <Mail className="h-8 w-8 mx-auto mb-3 opacity-60" />
        <h2 className="text-xl font-bold mb-2">{title || 'Stay Updated'}</h2>
        <p className="text-sm opacity-60 mb-6">{subtitle || 'Subscribe to our newsletter for the latest updates and offers.'}</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-2.5 text-sm border-0 outline-none"
            style={{ backgroundColor: colors.card, color: colors.text, borderRadius: `${borderRadius}px` }}
          />
          <button
            type="submit"
            disabled={subscribe.isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white shrink-0"
            style={{ backgroundColor: colors.primary, borderRadius: `${borderRadius}px` }}
          >
            {subscribe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSection;
