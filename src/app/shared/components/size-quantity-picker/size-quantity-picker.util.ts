import {
  SizeQuantityPickerOptions,
  SizeQuantityPickerRow,
} from './size-quantity-picker.model';

export function sumPickerQuantities(rows: SizeQuantityPickerRow[]): number {
  return rows.reduce((sum, row) => sum + (Number.isFinite(row.quantity) ? row.quantity : 0), 0);
}

export function clampPickerQuantity(value: number, maxQuantity?: number): number {
  const safe = Number.isFinite(value) ? Math.floor(value) : 0;
  const nonNegative = Math.max(0, safe);
  if (maxQuantity === undefined || maxQuantity === null) {
    return nonNegative;
  }
  return Math.min(nonNegative, maxQuantity);
}

export function validatePickerRows(
  rows: SizeQuantityPickerRow[],
  options: SizeQuantityPickerOptions = {},
): { valid: boolean; errors: string[]; total: number } {
  const minTotal = options.minTotal ?? 1;
  const errors: string[] = [];

  for (const row of rows) {
    const qty = row.quantity;
    if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 0) {
      errors.push('La quantitat ha de ser un enter igual o superior a 0');
      break;
    }
    if (row.maxQuantity !== undefined && row.maxQuantity !== null && qty > row.maxQuantity) {
      errors.push(
        `La quantitat de «${row.label}» no pot superar ${row.maxQuantity}`,
      );
    }
  }

  const total = sumPickerQuantities(rows);
  if (total < minTotal) {
    errors.push('Selecciona almenys una unitat');
  }

  const uniqueErrors = [...new Set(errors)];
  return {
    valid: uniqueErrors.length === 0,
    errors: uniqueErrors,
    total,
  };
}
