import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import {
  SizeQuantityPickerOptions,
  SizeQuantityPickerResult,
  SizeQuantityPickerRow,
} from './size-quantity-picker.model';
import {
  clampPickerQuantity,
  validatePickerRows,
} from './size-quantity-picker.util';

@Component({
  selector: 'app-size-quantity-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputNumberModule],
  templateUrl: './size-quantity-picker.component.html',
  styleUrl: './size-quantity-picker.component.css',
})
export class SizeQuantityPickerComponent implements OnChanges {
  @Input() visible = false;
  @Input() header = 'Seleccionar variants';
  @Input() confirmLabel = 'Confirmar';
  @Input() rows: SizeQuantityPickerRow[] = [];
  @Input() options: SizeQuantityPickerOptions = {};
  /** `table` = llistat (moviments stock); `grid` = targetes (p. ex. POS) */
  @Input() layout: 'table' | 'grid' = 'table';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirm = new EventEmitter<SizeQuantityPickerResult[]>();
  @Output() cancel = new EventEmitter<void>();

  editableRows: SizeQuantityPickerRow[] = [];
  validation = validatePickerRows([], {});

  private confirmedClose = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.confirmedClose = false;
      this.editableRows = this.rows.map((row) => ({ ...row }));
      this.recalculateValidation();
    }
    if (changes['rows'] && this.visible) {
      this.editableRows = this.rows.map((row) => ({ ...row }));
      this.recalculateValidation();
    }
  }

  get showAvailableColumn(): boolean {
    return this.editableRows.some(
      (row) => row.maxQuantity !== undefined && row.maxQuantity !== null,
    );
  }

  onDialogHide(): void {
    if (!this.confirmedClose) {
      this.cancel.emit();
    }
    this.confirmedClose = false;
  }

  onCancelClick(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  /** Graella POS: un toc = 1 unitat d’aquesta variant i tancar. */
  onGridVariantSelect(index: number): void {
    this.editableRows.forEach((row, idx) => {
      row.quantity = idx === index ? 1 : 0;
    });
    this.recalculateValidation();
    if (this.validation.valid) {
      this.onConfirmClick();
    }
  }

  onConfirmClick(): void {
    this.recalculateValidation();
    if (!this.validation.valid) {
      return;
    }
    const emitZero = this.options.emitZeroRows === true;
    const payload: SizeQuantityPickerResult[] = this.editableRows
      .filter((row) => emitZero || row.quantity > 0)
      .map((row) => ({
        articleVariantId: row.articleVariantId,
        label: row.label,
        quantity: row.quantity,
      }));
    this.confirmedClose = true;
    this.visible = false;
    this.visibleChange.emit(false);
    this.confirm.emit(payload);
  }

  stepQuantity(index: number, delta: number): void {
    const row = this.editableRows[index];
    if (!row) {
      return;
    }
    row.quantity = clampPickerQuantity(row.quantity + delta, row.maxQuantity);
    this.recalculateValidation();
  }

  onQuantityChange(index: number): void {
    const row = this.editableRows[index];
    if (!row) {
      return;
    }
    row.quantity = clampPickerQuantity(row.quantity, row.maxQuantity);
    this.recalculateValidation();
  }

  inputId(index: number): string {
    return `size-picker-qty-${index}`;
  }

  private recalculateValidation(): void {
    this.validation = validatePickerRows(this.editableRows, this.options);
  }
}
