import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number;
  image?: string | null;
  images?: string[] | null;
  inventory_count?: number | null;
}

interface Props {
  storeSlug: string;
  product: Product;
  primaryColor?: string;
  primaryFg?: string;
  borderRadius?: string | number;
  compact?: boolean;
}

/**
 * Add to Cart + Buy Now buttons rendered on shop / listing product cards.
 * Clicking either stops parent <Link> navigation. Buy Now adds the item then
 * routes straight to the store checkout.
 */
const ProductCardActions = ({ storeSlug, product, primaryColor = 'hsl(var(--primary))', primaryFg = '#fff', borderRadius = '8px', compact = false }: Props) => {
  const navigate = useNavigate();
  const { addItem } = useCart(storeSlug);

  const title = product.title || product.name || 'Product';
  const image = product.image ?? product.images?.[0] ?? null;
  const isOutOfStock = product.inventory_count !== null && product.inventory_count !== undefined && product.inventory_count <= 0;
  const radius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;

  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleAdd = (e: React.MouseEvent) => {
    stop(e);
    if (isOutOfStock) { toast.error('Out of stock'); return; }
    addItem({ productId: product.id, title, price: Number(product.price), image }, 1);
    toast.success(`${title} added to cart`);
  };

  const handleBuy = (e: React.MouseEvent) => {
    stop(e);
    if (isOutOfStock) { toast.error('Out of stock'); return; }
    addItem({ productId: product.id, title, price: Number(product.price), image }, 1);
    navigate(`/store/${storeSlug}/checkout`);
  };

  const pad = compact ? 'py-1.5 text-[11px]' : 'py-2 text-xs';

  return (
    <div className="flex gap-2 mt-2.5" onClick={stop}>
      <button
        type="button"
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`flex-1 ${pad} font-semibold inline-flex items-center justify-center gap-1 border-2 transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ borderColor: primaryColor, color: primaryColor, background: 'transparent', borderRadius: radius }}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Add</span>
      </button>
      <button
        type="button"
        onClick={handleBuy}
        disabled={isOutOfStock}
        className={`flex-1 ${pad} font-semibold inline-flex items-center justify-center gap-1 transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed`}
        style={{ background: primaryColor, color: primaryFg, borderRadius: radius }}
      >
        <Zap className="h-3.5 w-3.5" />
        <span>Buy Now</span>
      </button>
    </div>
  );
};

export default ProductCardActions;
