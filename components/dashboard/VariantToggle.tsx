'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { BIOMARKER_METADATA } from '@/lib/biomarker-metadata';

interface VariantToggleProps {
  metric: string;
  variants?: string[];
  selectedVariants: string[];
  onChange: (variants: string[]) => void;
}

export function VariantToggle({
  metric,
  variants,
  selectedVariants,
  onChange,
}: VariantToggleProps) {
  if (!variants || variants.length === 0) {
    return null;
  }

  const metadata = BIOMARKER_METADATA[metric];

  const handleVariantToggle = (variant: string) => {
    if (selectedVariants.includes(variant)) {
      onChange(selectedVariants.filter((v) => v !== variant));
    } else {
      onChange([...selectedVariants, variant]);
    }
  };

  return (
    <div className="mt-3 pl-4 space-y-2 border-l-2 border-gray-200">
      <p className="text-sm font-medium text-gray-700">
        {metadata?.label || metric} - Variants
      </p>
      {variants.map((variant) => {
        const variantMetadata = BIOMARKER_METADATA[variant];
        const isSelected = selectedVariants.includes(variant);

        return (
          <div key={variant} className="flex items-center space-x-2">
            <Checkbox
              id={`variant-${variant}`}
              checked={isSelected}
              onCheckedChange={() => handleVariantToggle(variant)}
            />
            <label
              htmlFor={`variant-${variant}`}
              className="text-sm text-gray-600 cursor-pointer flex items-center gap-2"
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  backgroundColor: isSelected
                    ? `hsl(${Math.random() * 360}, 70%, 60%)`
                    : '#e5e7eb',
                }}
              />
              {variantMetadata?.label || variant}
              <span className="text-xs text-gray-500">
                ({variantMetadata?.unit})
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
