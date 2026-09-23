export interface SizeQuantityPickerRow {
  articleVariantId: string;
  label: string;
  quantity: number;
  /** Stock disponible a l'origen. Si definit, quantity no pot superar-lo. */
  maxQuantity?: number;
}

export interface SizeQuantityPickerResult {
  articleVariantId: string;
  label: string;
  quantity: number;
}

export interface SizeQuantityPickerOptions {
  /** Mínim total per permetre confirmar (default 1). */
  minTotal?: number;
  /** Si true, emit confirm inclou files amb quantity 0 (default false). */
  emitZeroRows?: boolean;
}
