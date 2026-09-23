import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, switchMap, finalize, of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SalesService } from '../../services/sales.service';
import { ArticlesService } from '../../../articles/services/articles.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { SalesPointsService } from '../../../sales-points/services/sales-points.service';
import { FairsService } from '../../../fairs/services/fairs.service';
import { ConfigService } from '../../../config/services/config.service';
import { CreateSaleDto, PaymentType } from '../../models/sale.model';
import { Article } from '../../../articles/models/article.model';
import { Client } from '../../../clients/models/client.model';
import { SizeQuantityPickerComponent } from '../../../../shared/components/size-quantity-picker/size-quantity-picker.component';
import {
  SizeQuantityPickerResult,
  SizeQuantityPickerRow,
} from '../../../../shared/components/size-quantity-picker/size-quantity-picker.model';
import { map } from 'rxjs/operators';
import { resolveAssetUrl } from '../../../../core/utils/asset-url.util';
import { StockVariantLineItem } from '../../../sales-points/models/sales-point.model';

type SalesPointStockItemLike = {
  articleId: string;
  quantity: number;
  variants?: StockVariantLineItem[];
  article?: {
    id: string;
    ownReference: string;
    name: string;
    pvp?: number;
    hasVariants?: boolean;
    photo?: string | null;
    collectionId?: string | null;
    articleTypeId?: string | null;
  };
};

export interface SaleGridArticle {
  articleId: string;
  ownReference: string;
  name: string;
  pvp: number;
  hasVariants: boolean;
  stockAtLocation: number;
  photoPath: string | null;
  collectionId: string | null;
  articleTypeId: string | null;
  variants?: StockVariantLineItem[];
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DialogModule,
    ButtonModule,
    SizeQuantityPickerComponent,
  ],
  providers: [MessageService],
  templateUrl: './sale-form.component.html',
  styleUrl: './sale-form.component.css',
})
export class SaleFormComponent implements OnInit {
  form: FormGroup;
  saleId: string | null = null;
  loading = false;
  articles = signal<Article[]>([]);
  clients: Client[] = [];
  locationLabel = signal('');
  locationLocked = signal(false);
  collections: { id: string; name: string }[] = [];
  articleTypes: { id: string; name: string }[] = [];
  articleSearchQuery = signal('');
  articleSearchCollectionId = signal<string | null>(null);
  articleSearchTypeId = signal<string | null>(null);
  articleSearchResults = signal<Article[]>([]);
  articleSearchLoading = signal(false);
  selectedArticleForAdd = signal<Article | null>(null);
  private articleSearch$ = new Subject<void>();
  paymentTypes = [
    { label: 'Efectiu', value: PaymentType.CASH },
    { label: 'Targeta', value: PaymentType.CARD },
    { label: 'Transferència', value: PaymentType.TRANSFER },
    { label: 'Bizum', value: PaymentType.BIZUM },
  ];

  addItemModalVisible = false;
  confirmModalVisible = false;
  variantPickerVisible = false;
  variantPickerRows: SizeQuantityPickerRow[] = [];
  variantPickerHeader = 'Seleccionar variants';
  private pendingVariantArticle: Article | null = null;
  private variantPickerFromGrid = false;
  gridArticles = signal<SaleGridArticle[]>([]);
  gridLoading = signal(false);
  gridSearchQuery = signal('');
  gridCollectionId = signal<string | null>(null);
  gridTypeId = signal<string | null>(null);
  filteredGridArticles = computed(() => {
    const q = this.gridSearchQuery().trim().toLowerCase();
    const collectionId = this.gridCollectionId();
    const typeId = this.gridTypeId();
    return this.gridArticles().filter((a) => {
      if (collectionId && a.collectionId !== collectionId) {
        return false;
      }
      if (typeId && a.articleTypeId !== typeId) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = `${a.ownReference} ${a.name}`.toLowerCase();
      return haystack.includes(q);
    });
  });
  itemModalForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private salesService: SalesService,
    private articlesService: ArticlesService,
    private clientsService: ClientsService,
    private salesPointsService: SalesPointsService,
    private fairsService: FairsService,
    private configService: ConfigService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      salesPointId: [null],
      fairId: [null],
      ticketNumber: [{ value: '', disabled: false }],
      clientId: [null],
      saleDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      saleTime: [new Date().toTimeString().split(' ')[0]],
      paymentType: [PaymentType.CARD, [Validators.required]],
      totalDiscount: [0, [Validators.min(0)]],
      totalAmount: [0, [Validators.required, Validators.min(0)]],
      items: this.fb.array([]),
    });

    this.itemModalForm = this.fb.group({
      articleId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
    });
    this.itemModalForm.get('articleId')?.valueChanges.subscribe((id) => {
      if (id) {
        const article = this.articleSearchResults().find((a) => a.id === id)
          ?? this.articles().find((a) => a.id === id);
        if (article) {
          this.itemModalForm.patchValue({ unitPrice: article.pvp }, { emitEvent: false });
        }
      }
    });
  }

  private setupArticleSearch() {
    this.articleSearch$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          const q = this.articleSearchQuery().trim();
          const collectionId = this.articleSearchCollectionId();
          const articleTypeId = this.articleSearchTypeId();
          const hasFilters = q || collectionId || articleTypeId;
          if (!hasFilters) {
            return of([]);
          }
          this.articleSearchLoading.set(true);
          return this.articlesService
            .search({
              q: q || undefined,
              collectionId: collectionId ?? undefined,
              articleTypeId: articleTypeId ?? undefined,
            })
            .pipe(finalize(() => this.articleSearchLoading.set(false)));
        }),
      )
      .subscribe({
        next: (data) => this.articleSearchResults.set(data),
        error: () => {},
      });
  }

  get modalItemSubtotal(): number {
    const q = Number(this.itemModalForm?.get('quantity')?.value) || 0;
    const p = Number(this.itemModalForm?.get('unitPrice')?.value) || 0;
    return q * p;
  }

  get modalItemTotal(): number {
    const d = Number(this.itemModalForm?.get('discount')?.value) || 0;
    return Math.max(0, this.modalItemSubtotal - d);
  }

  get itemsFormArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  /** Ruta `sales/new` (sense `:id`). */
  get isNewSale(): boolean {
    return !this.saleId;
  }

  ngOnInit() {
    this.setupArticleSearch();
    this.loadArticles();
    this.loadCollectionsAndTypes();

    this.saleId = this.route.snapshot.paramMap.get('id');
    if (this.isNewSale) {
      this.initSaleLocation();
    } else {
      this.loadClients();
      this.loadSale();
    }
  }

  private initSaleLocation() {
    const qp = this.route.snapshot.queryParamMap;
    const fairId = qp.get('fairId');
    const salesPointId = qp.get('salesPointId');

    if (fairId && salesPointId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ubicació de venda invàlida (fira i punt alhora)',
      });
      void this.router.navigate(['/sales']);
      return;
    }

    if (fairId) {
      this.form.patchValue({ fairId, salesPointId: null });
      this.locationLocked.set(true);
      this.fairsService.getById(fairId).subscribe({
        next: (fair) => this.locationLabel.set(`Fira: ${fair.name}`),
        error: () => this.locationLabel.set('Fira'),
      });
      this.loadSaleGridArticles();
      return;
    }

    if (salesPointId) {
      this.form.patchValue({ salesPointId, fairId: null });
      this.locationLocked.set(true);
      this.salesPointsService.getById(salesPointId).subscribe({
        next: (sp) =>
          this.locationLabel.set(
            sp.isDefaultWarehouse
              ? `Magatzem: ${sp.name}`
              : `Punt de venda: ${sp.name}`,
          ),
        error: () => this.locationLabel.set('Punt de venda'),
      });
      this.loadSaleGridArticles();
      return;
    }

    this.salesPointsService.getDefaultWarehouse().subscribe({
      next: (warehouse) => {
        if (!warehouse) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No hi ha magatzem per defecte configurat',
          });
          return;
        }
        this.form.patchValue({ salesPointId: warehouse.id, fairId: null });
        this.locationLabel.set(`Magatzem: ${warehouse.name}`);
        this.locationLocked.set(true);
        this.loadSaleGridArticles();
      },
    });
  }

  private loadSaleGridArticles() {
    if (!this.isNewSale) {
      return;
    }
    const fairId = this.form.get('fairId')?.value as string | null;
    const salesPointId = this.form.get('salesPointId')?.value as string | null;

    if (!fairId && !salesPointId) {
      this.gridArticles.set([]);
      return;
    }

    this.gridLoading.set(true);
    const mapRows = (items: SalesPointStockItemLike[]): SaleGridArticle[] => {
      const out: SaleGridArticle[] = [];
      for (const item of items) {
        const art = item.article;
        if (!art) {
          continue;
        }
        const variantQty =
          item.variants?.reduce((sum, v) => sum + (v.quantity ?? 0), 0) ?? 0;
        const stockAtLocation = art.hasVariants ? variantQty : item.quantity;
        if (stockAtLocation <= 0) {
          continue;
        }
        out.push({
          articleId: art.id,
          ownReference: art.ownReference,
          name: art.name,
          pvp: Number(art.pvp ?? 0),
          hasVariants: !!art.hasVariants,
          stockAtLocation,
          photoPath: art.photo ?? null,
          collectionId: art.collectionId ?? null,
          articleTypeId: art.articleTypeId ?? null,
          variants: item.variants,
        });
      }
      return out.sort((a, b) => a.name.localeCompare(b.name, 'ca'));
    };

    if (fairId) {
      this.fairsService
        .getStock(fairId)
        .pipe(finalize(() => this.gridLoading.set(false)))
        .subscribe({
          next: (items) => this.gridArticles.set(mapRows(items)),
          error: () => this.gridArticles.set([]),
        });
      return;
    }

    this.salesPointsService
      .getStock(salesPointId!)
      .pipe(finalize(() => this.gridLoading.set(false)))
      .subscribe({
        next: (items) => this.gridArticles.set(mapRows(items)),
        error: () => this.gridArticles.set([]),
      });
  }

  private rememberGridArticle(row: SaleGridArticle) {
    const a = this.gridRowAsArticle(row);
    this.articles.update((prev) =>
      prev.some((x) => x.id === a.id) ? prev : [...prev, a],
    );
  }

  onGridArticleClick(row: SaleGridArticle) {
    if (!this.hasSaleLocation()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenció',
        detail: 'Espera que es carregui la ubicació de venda',
      });
      return;
    }

    if (row.hasVariants) {
      const pickerRows: SizeQuantityPickerRow[] = (row.variants ?? [])
        .filter((v) => v.quantity > 0)
        .map((v) => ({
          articleVariantId: v.articleVariantId,
          label: v.label,
          quantity: 0,
          maxQuantity: v.quantity,
        }));
      if (pickerRows.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Atenció',
          detail: 'No hi ha stock de variants disponible',
        });
        return;
      }
      this.pendingVariantArticle = this.gridRowAsArticle(row);
      this.variantPickerFromGrid = true;
      this.variantPickerRows = pickerRows;
      this.variantPickerHeader = `Variants — ${row.name}`;
      this.variantPickerVisible = true;
      this.rememberGridArticle(row);
      return;
    }

    this.rememberGridArticle(row);
    this.addOrIncrementCartLine(row.articleId, null, '', 1, row.pvp);
  }

  private gridRowAsArticle(row: SaleGridArticle): Article {
    return {
      id: row.articleId,
      ownReference: row.ownReference,
      name: row.name,
      cost: null,
      pvp: row.pvp,
      stock: row.stockAtLocation,
      hasVariants: row.hasVariants,
      observations: null,
      photo: row.photoPath,
      collectionId: row.collectionId,
      articleTypeId: row.articleTypeId,
      collection: null,
      articleType: null,
      createdAt: '',
      updatedAt: '',
    };
  }

  addOrIncrementCartLine(
    articleId: string,
    articleVariantId: string | null,
    variantLabel: string,
    qty: number,
    unitPrice: number,
  ) {
    const idx = this.itemsFormArray.controls.findIndex(
      (c) =>
        c.get('articleId')?.value === articleId &&
        (c.get('articleVariantId')?.value ?? null) === articleVariantId,
    );
    if (idx >= 0) {
      const ctrl = this.itemsFormArray.at(idx) as FormGroup;
      const newQty = (Number(ctrl.get('quantity')?.value) || 0) + qty;
      ctrl.patchValue({ quantity: newQty });
      this.calculateItemTotal(ctrl);
      return;
    }
    this.addItem(
      articleId,
      qty,
      unitPrice,
      0,
      articleVariantId ?? undefined,
      variantLabel,
    );
  }

  adjustCartQuantity(index: number, delta: number) {
    const ctrl = this.itemsFormArray.at(index) as FormGroup;
    const next = (Number(ctrl.get('quantity')?.value) || 0) + delta;
    if (next < 1) {
      this.removeItem(index);
      return;
    }
    ctrl.patchValue({ quantity: next });
    this.calculateItemTotal(ctrl);
  }

  articlePhotoUrl(path: string | null): string {
    return path ? resolveAssetUrl(path) : '';
  }

  private hasSaleLocation(): boolean {
    const v = this.form.value;
    return !!(v.salesPointId?.trim?.() || v.salesPointId) || !!(v.fairId?.trim?.() || v.fairId);
  }

  loadArticles() {
    this.articlesService.getAll().subscribe({
      next: (data) => this.articles.set(data),
      error: (error) => console.error('Error loading articles:', error),
    });
  }

  loadCollectionsAndTypes() {
    this.configService.getCollections().subscribe({
      next: (data) => (this.collections = data),
    });
    this.configService.getArticleTypes().subscribe({
      next: (data) => (this.articleTypes = data),
    });
  }

  triggerArticleSearch() {
    this.articleSearch$.next();
  }

  selectArticleForAdd(article: Article) {
    this.selectedArticleForAdd.set(article);
    this.itemModalForm.patchValue({
      articleId: article.id,
      unitPrice: article.pvp,
    });
  }

  clearArticleSelection() {
    this.selectedArticleForAdd.set(null);
    this.itemModalForm.patchValue({ articleId: null });
  }

  loadClients() {
    this.clientsService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      },
    });
  }

  generateTicketNumber() {
    this.salesService.generateTicketNumber().subscribe({
      next: (data) => {
        this.form.get('ticketNumber')?.setValue(data.ticketNumber);
      },
      error: (error) => {
        console.error('Error generating ticket number:', error);
      },
    });
  }

  loadSale() {
    if (!this.saleId) return;

    this.loading = true;
    this.salesService.getById(this.saleId).subscribe({
      next: (sale) => {
        // Limpiar items existentes
        while (this.itemsFormArray.length !== 0) {
          this.itemsFormArray.removeAt(0);
        }

        // Cargar items
        sale.items.forEach((item) => {
          this.addItem(
            item.articleId,
            item.quantity,
            item.unitPrice,
            item.discount,
            item.articleVariantId ?? undefined,
          );
        });

        if (sale.fairId) {
          this.locationLabel.set(sale.fair?.name ? `Fira: ${sale.fair.name}` : 'Fira');
        } else if (sale.salesPoint) {
          this.locationLabel.set(
            sale.salesPoint.isDefaultWarehouse
              ? `Magatzem: ${sale.salesPoint.name}`
              : `Punt de venda: ${sale.salesPoint.name}`,
          );
        }

        this.form.patchValue({
          salesPointId: sale.salesPointId,
          fairId: sale.fairId ?? null,
          ticketNumber: sale.ticketNumber || '',
          clientId: sale.clientId,
          saleDate: sale.saleDate.split('T')[0],
          saleTime: sale.saleTime || '',
          paymentType: sale.paymentType,
          totalDiscount: sale.totalDiscount,
          totalAmount: sale.totalAmount,
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sale:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error en carregar la venda',
        });
        this.loading = false;
      },
    });
  }

  openAddItemModal() {
    this.itemModalForm.reset({
      articleId: null,
      quantity: 1,
      unitPrice: 0,
      discount: 0,
    });
    this.articleSearchQuery.set('');
    this.articleSearchCollectionId.set(null);
    this.articleSearchTypeId.set(null);
    this.selectedArticleForAdd.set(null);
    this.articleSearchResults.set([]);
    this.addItemModalVisible = true;
    this.articleSearch$.next();
  }

  closeAddItemModal() {
    this.addItemModalVisible = false;
  }


  confirmAddItem() {
    if (this.itemModalForm.invalid) {
      this.itemModalForm.markAllAsTouched();
      return;
    }
    const v = this.itemModalForm.value;
    const article = this.selectedArticleForAdd();
    if (!article) {
      return;
    }
    this.articles.update((prev) =>
      prev.some((a) => a.id === article.id) ? prev : [...prev, article],
    );

    if (article.hasVariants) {
      this.pendingVariantArticle = article;
      this.loadVariantPickerRows(article.id).subscribe({
        next: (rows) => {
          if (rows.length === 0) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Atenció',
              detail: 'No hi ha stock de variants en aquesta ubicació',
            });
            return;
          }
          this.variantPickerRows = rows;
          this.variantPickerHeader = `Variants — ${article.name}`;
          this.addItemModalVisible = false;
          this.variantPickerVisible = true;
        },
      });
      return;
    }

    this.addItem(v.articleId, v.quantity, v.unitPrice, v.discount);
    this.closeAddItemModal();
  }

  private loadVariantPickerRows(articleId: string) {
    const fairId = this.form.get('fairId')?.value as string | null;
    const salesPointId = this.form.get('salesPointId')?.value as string | null;

    if (fairId) {
      return this.fairsService.getStock(fairId).pipe(
        map((items) => {
          const row = items.find((i) => i.articleId === articleId);
          return (row?.variants ?? [])
            .filter((v) => v.quantity > 0)
            .map((v) => ({
              articleVariantId: v.articleVariantId,
              label: v.label,
              quantity: 0,
              maxQuantity: v.quantity,
            }));
        }),
      );
    }

    if (!salesPointId) {
      return of([] as SizeQuantityPickerRow[]);
    }

    return this.salesPointsService.getStock(salesPointId).pipe(
      map((items) => {
        const row = items.find((i) => i.articleId === articleId);
        return (row?.variants ?? [])
          .filter((v) => v.quantity > 0)
          .map((v) => ({
            articleVariantId: v.articleVariantId,
            label: v.label,
            quantity: 0,
            maxQuantity: v.quantity,
          }));
      }),
    );
  }

  onVariantPickerConfirm(lines: SizeQuantityPickerResult[]) {
    const article = this.pendingVariantArticle;
    if (!article) {
      return;
    }
    const fromGrid = this.variantPickerFromGrid;
    const unitPrice = fromGrid
      ? article.pvp
      : Number(this.itemModalForm.get('unitPrice')?.value) || article.pvp;
    const discount = fromGrid
      ? 0
      : Number(this.itemModalForm.get('discount')?.value) || 0;
    const perLineDiscount =
      lines.length > 0 ? discount / lines.length : 0;

    if (fromGrid && article) {
      this.articles.update((prev) =>
        prev.some((x) => x.id === article.id) ? prev : [...prev, article],
      );
    }

    for (const line of lines) {
      if (line.quantity <= 0) {
        continue;
      }
      if (fromGrid) {
        this.addOrIncrementCartLine(
          article.id,
          line.articleVariantId,
          line.label,
          line.quantity,
          unitPrice,
        );
      } else {
        this.addItem(
          article.id,
          line.quantity,
          unitPrice,
          perLineDiscount,
          line.articleVariantId,
          line.label,
        );
      }
    }
    this.variantPickerVisible = false;
    this.variantPickerFromGrid = false;
    this.pendingVariantArticle = null;
    if (!fromGrid) {
      this.closeAddItemModal();
    }
  }

  onVariantPickerCancel() {
    this.variantPickerVisible = false;
    const fromGrid = this.variantPickerFromGrid;
    this.variantPickerFromGrid = false;
    this.pendingVariantArticle = null;
    if (!fromGrid) {
      this.addItemModalVisible = true;
    }
  }

  addItem(
    articleId?: string,
    quantity: number = 1,
    unitPrice?: number,
    discount: number = 0,
    articleVariantId?: string,
    variantLabel?: string,
  ) {
    const itemForm = this.fb.group({
      articleId: [articleId || null, [Validators.required]],
      articleVariantId: [articleVariantId ?? null],
      variantLabel: [variantLabel ?? ''],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      unitPrice: [unitPrice || 0, [Validators.required, Validators.min(0)]],
      discount: [discount, [Validators.min(0)]],
      totalPrice: [0, [Validators.required, Validators.min(0)]],
    });

    // Calcular total cuando cambian los valores
    itemForm.get('quantity')?.valueChanges.subscribe(() => this.calculateItemTotal(itemForm));
    itemForm.get('unitPrice')?.valueChanges.subscribe(() => this.calculateItemTotal(itemForm));
    itemForm.get('discount')?.valueChanges.subscribe(() => this.calculateItemTotal(itemForm));
    itemForm.get('articleId')?.valueChanges.subscribe((id) => {
      if (id) {
        const article =
          this.articles().find((a) => a.id === id) ??
          this.articleSearchResults().find((a) => a.id === id);
        if (article) {
          itemForm.patchValue({ unitPrice: article.pvp }, { emitEvent: false });
        }
      }
    });

    this.itemsFormArray.push(itemForm);
    this.calculateItemTotal(itemForm);
  }

  removeItem(index: number) {
    this.itemsFormArray.removeAt(index);
    this.calculateTotals();
  }

  calculateItemTotal(itemForm: FormGroup) {
    const quantity = itemForm.get('quantity')?.value || 0;
    const unitPrice = itemForm.get('unitPrice')?.value || 0;
    const discount = itemForm.get('discount')?.value || 0;
    const subtotal = quantity * unitPrice;
    const total = subtotal - discount;
    itemForm.patchValue({ totalPrice: Math.max(0, total) }, { emitEvent: false });
    this.calculateTotals();
  }

  calculateTotals() {
    let totalAmount = 0;
    this.itemsFormArray.controls.forEach((control) => {
      const totalPrice = control.get('totalPrice')?.value || 0;
      totalAmount += totalPrice;
    });

    const totalDiscount = this.form.get('totalDiscount')?.value || 0;
    const finalTotal = totalAmount - totalDiscount;

    this.form.patchValue(
      {
        totalAmount: Math.max(0, finalTotal),
      },
      { emitEvent: false },
    );
  }

  onSubmit(event?: Event) {
    if (this.form.invalid || this.itemsFormArray.length === 0) {
      this.form.markAllAsTouched();
      if (this.itemsFormArray.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Atenció',
          detail: 'Has d\'afegir almenys un article a la venda',
        });
      }
      return;
    }

    if (!this.hasSaleLocation()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ubicació de venda no definida',
      });
      return;
    }

    const formValue = this.form.value;

    if (!this.isNewSale) {
      this.doUpdate(formValue);
    } else {
      event?.preventDefault();
      this.confirmModalVisible = true;
    }
  }

  closeConfirmModal() {
    if (!this.loading) {
      this.confirmModalVisible = false;
    }
  }

  confirmSale() {
    if (this.form.invalid || this.itemsFormArray.length === 0) return;
    if (!this.hasSaleLocation()) return;
    this.doCreate(this.form.value);
  }

  private doUpdate(formValue: any) {
    this.loading = true;
    const createSaleDto = this.buildCreateSaleDto(formValue);
    this.salesService.update(this.saleId!, createSaleDto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Èxit', detail: 'Venda actualitzada correctament' });
        this.router.navigate(['/sales']);
      },
      error: (error) => {
        console.error('Error updating sale:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Error en actualitzar la venda' });
        this.loading = false;
      },
    });
  }

  private doCreate(formValue: any) {
    this.loading = true;
    const createSaleDto = this.buildCreateSaleDto(formValue);
    this.salesService.create(createSaleDto).subscribe({
      next: () => {
        this.loading = false;
        this.confirmModalVisible = false;
        this.messageService.add({ severity: 'success', summary: 'Èxit', detail: 'Venda creada correctament' });
        this.router.navigate(['/sales']);
      },
      error: (error) => {
        console.error('Error creating sale:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Error en crear la venda' });
        this.loading = false;
      },
    });
  }

  private buildCreateSaleDto(formValue: any): CreateSaleDto {
    const dto: CreateSaleDto = {
      clientId: formValue.clientId || undefined,
      saleDate: formValue.saleDate,
      saleTime: formValue.saleTime || undefined,
      paymentType: formValue.paymentType,
      totalDiscount: Number(formValue.totalDiscount) || 0,
      totalAmount: Number(formValue.totalAmount),
      items: formValue.items.map((item: any) => ({
        articleId: item.articleId,
        articleVariantId: item.articleVariantId || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount) || 0,
        totalPrice: Number(item.totalPrice),
      })),
    };
    if (formValue.fairId) {
      dto.fairId = formValue.fairId;
    } else if (formValue.salesPointId) {
      dto.salesPointId = formValue.salesPointId;
    }
    return dto;
  }

  getClientName(id: string | null): string {
    if (!id) return '';
    const c = this.clients.find((x) => x.id === id);
    return c ? `${c.name} ${c.surname}` : '';
  }

  getPaymentTypeLabel(value: string | null): string {
    const t = this.paymentTypes.find((x) => x.value === value);
    return t?.label ?? '-';
  }

  getTicketSubtotal(): number {
    let sum = 0;
    this.itemsFormArray.controls.forEach((c) => {
      sum += Number(c.get('totalPrice')?.value) || 0;
    });
    return sum;
  }

  cancel() {
    this.router.navigate(['/sales']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  getArticleName(articleId: string, variantLabel?: string): string {
    const article =
      this.articleSearchResults().find((a) => a.id === articleId) ??
      this.articles().find((a) => a.id === articleId);
    const base = article ? `${article.ownReference} - ${article.name}` : '';
    if (variantLabel) {
      return `${base} (${variantLabel})`;
    }
    return base;
  }

  getItemVariantLabel(index: number): string {
    return this.itemsFormArray.at(index)?.get('variantLabel')?.value ?? '';
  }

  getArticleDisplayLabel(article: Article): string {
    const parts = [article.ownReference, article.name];
    if (article.collection?.name) parts.push(`[${article.collection.name}]`);
    if (article.articleType?.name) parts.push(`(${article.articleType.name})`);
    return parts.join(' · ');
  }
}

