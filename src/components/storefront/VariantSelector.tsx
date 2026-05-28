import { VariantOption, getValueText, getValueImages } from '@/lib/productMedia';

interface Props {
  variants: VariantOption[];
  selected: Record<string, string>;
  onChange: (name: string, value: string) => void;
  colors: any;
  borderRadius: number;
}

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', black: '#111', white: '#fff',
  yellow: '#eab308', pink: '#ec4899', purple: '#a855f7', orange: '#f97316',
  brown: '#92400e', grey: '#6b7280', gray: '#6b7280', navy: '#1e3a5f',
  maroon: '#7f1d1d', beige: '#d4c5a9', cream: '#fffdd0', gold: '#d4a017',
  silver: '#c0c0c0', teal: '#14b8a6', coral: '#f87171', olive: '#84cc16',
  lavender: '#b497d6',
};

const isColorVariant = (name: string) => /colou?r/i.test(name);

const VariantSelector = ({ variants, selected, onChange, colors, borderRadius }: Props) => {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {variants.map((variant, idx) => {
        const isColor = isColorVariant(variant.name);
        return (
          <div key={variant.name || idx}>
            <span className="text-sm font-medium">
              {variant.name}: <span className="font-normal opacity-60">{selected[variant.name] || 'Select'}</span>
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {variant.values.map((rawValue, i) => {
                const value = getValueText(rawValue);
                const images = getValueImages(rawValue);
                const displayLabel = value || `Option ${i + 1}`;
                const isSelected = selected[variant.name] === value;
                const colorHex = isColor && value ? COLOR_MAP[value.toLowerCase()] : null;
                const thumb = images[0];

                // Image thumb chip (when this value has its own photo) — most informative.
                if (thumb) {
                  return (
                    <button
                      key={`${value}-${i}`}
                      onClick={() => onChange(variant.name, value)}
                      title={displayLabel}
                      className="relative overflow-hidden border-2 transition-all duration-200"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: `${borderRadius / 2}px`,
                        borderColor: isSelected ? colors.primary : colors.secondary,
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? `0 0 0 2px ${colors.primary}40` : 'none',
                      }}
                    >
                      <img src={thumb} alt={displayLabel} className="w-full h-full object-cover" />
                      {value && (
                        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] leading-tight px-1 py-0.5 truncate">
                          {value}
                        </span>
                      )}
                    </button>
                  );
                }

                if (colorHex) {
                  return (
                    <button
                      key={`${value}-${i}`}
                      onClick={() => onChange(variant.name, value)}
                      title={value}
                      className="w-8 h-8 rounded-full border-2 transition-all duration-200"
                      style={{
                        backgroundColor: colorHex,
                        borderColor: isSelected ? colors.primary : colors.secondary,
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: isSelected ? `0 0 0 2px ${colors.primary}40` : 'none',
                      }}
                    />
                  );
                }

                return (
                  <button
                    key={`${value}-${i}`}
                    onClick={() => onChange(variant.name, value)}
                    className="px-4 py-2 text-sm font-medium border transition-all duration-200"
                    style={{
                      borderColor: isSelected ? colors.primary : colors.secondary,
                      backgroundColor: isSelected ? colors.primary + '10' : 'transparent',
                      color: isSelected ? colors.primary : colors.text,
                      borderRadius: `${borderRadius / 2}px`,
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VariantSelector;
