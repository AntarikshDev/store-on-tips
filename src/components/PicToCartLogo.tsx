import logo from '@/assets/pictocart-logo.png';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  size?: number;
  /** Deprecated: wordmark is baked into the logo image now. Kept for backwards compatibility. */
  withWordmark?: boolean;
  wordmarkClassName?: string;
}

const PicToCartLogo = ({ className, size = 48, withWordmark, wordmarkClassName }: Props) => {
  // Wordmark is part of the logo artwork itself, so the image is wider than tall (~3:1).
  const width = withWordmark ? Math.round(size * 3) : Math.round(size * 3);
  return (
    <span className={cn('inline-flex items-center', className)}>
      <img
        src={logo}
        alt="Pic to Cart"
        width={width}
        height={size}
        loading="lazy"
        className="object-contain"
        style={{ height: size, width: 'auto', maxWidth: '100%' }}
      />
    </span>
  );
};

export default PicToCartLogo;
export { logo as picToCartLogoSrc };
