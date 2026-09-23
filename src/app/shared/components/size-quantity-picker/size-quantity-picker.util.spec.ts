import {
  clampPickerQuantity,
  sumPickerQuantities,
  validatePickerRows,
} from './size-quantity-picker.util';
import { SizeQuantityPickerRow } from './size-quantity-picker.model';

describe('size-quantity-picker.util', () => {
  const baseRows: SizeQuantityPickerRow[] = [
    { articleVariantId: 'a', label: 'S', quantity: 1 },
    { articleVariantId: 'b', label: 'M', quantity: 2 },
  ];

  describe('sumPickerQuantities', () => {
    it('sums row quantities', () => {
      expect(sumPickerQuantities(baseRows)).toBe(3);
    });
  });

  describe('clampPickerQuantity', () => {
    it('clamps to max when defined', () => {
      expect(clampPickerQuantity(5, 3)).toBe(3);
    });

    it('allows any non-negative when no max', () => {
      expect(clampPickerQuantity(5)).toBe(5);
    });
  });

  describe('validatePickerRows', () => {
    it('accepts valid rows without max', () => {
      const result = validatePickerRows(baseRows);
      expect(result.valid).toBe(true);
      expect(result.total).toBe(3);
      expect(result.errors).toEqual([]);
    });

    it('rejects when quantity exceeds max', () => {
      const rows: SizeQuantityPickerRow[] = [
        { articleVariantId: 'a', label: 'L', quantity: 4, maxQuantity: 3 },
      ];
      const result = validatePickerRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('L'))).toBe(true);
    });

    it('rejects when total is zero', () => {
      const rows: SizeQuantityPickerRow[] = [
        { articleVariantId: 'a', label: 'S', quantity: 0 },
      ];
      const result = validatePickerRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Selecciona almenys una unitat');
    });

    it('accepts zero total when minTotal is 0', () => {
      const rows: SizeQuantityPickerRow[] = [
        { articleVariantId: 'a', label: 'S', quantity: 0 },
      ];
      const result = validatePickerRows(rows, { minTotal: 0 });
      expect(result.valid).toBe(true);
    });
  });
});
