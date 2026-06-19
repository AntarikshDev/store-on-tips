import { useStoreSiteOffer, isOfferActive } from '@/hooks/useSiteOffer';
import { Sparkles } from 'lucide-react';

const SiteOfferBanner = ({ storeId }: { storeId: string | undefined }) => {
  const { data: offer } = useStoreSiteOffer(storeId);
  if (!offer || !isOfferActive(offer) || !offer.show_banner) return null;
  const text =
    offer.banner_text ||
    `${offer.label || 'Festive Sale'} — Flat ${Number(offer.percent_off)}% off everything!`;
  return (
    <div
      className="w-full text-center text-xs sm:text-sm font-semibold py-2 px-3 flex items-center justify-center gap-2"
      style={{
        backgroundColor: offer.banner_bg_color || '#F97316',
        color: offer.banner_text_color || '#FFFFFF',
      }}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>{text}</span>
    </div>
  );
};

export default SiteOfferBanner;
