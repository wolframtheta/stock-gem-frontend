import { Component, OnInit, signal } from '@angular/core';
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
import { ConfigService } from '../../../config/services/config.service';
import { CreateSaleDto, CreateSaleItemDto, PaymentType } from '../../models/sale.model';
import { Article } from '../../../articles/models/article.model';
import { Client } from '../../../clients/models/client.model';
import { SalesPoint } from '../../../sales-points/models/sales-point.model';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    DialogModule,
    ButtonModule,
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
  salesPoints: SalesPoint[] = [];
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
  itemModalForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private salesService: SalesService,
    private articlesService: ArticlesService,
    private clientsService: ClientsService,
    private salesPointsService: SalesPointsService,
    private configService: ConfigService,
    private messageService: MessageService,
  ) {
    this.form = this.fb.group({
      salesPointId: [null, Validators.required],
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

  ngOnInit() {
    this.setupArticleSearch();
    this.loadArticles();
    this.loadClients();
    this.loadSalesPoints();
    this.loadCollectionsAndTypes();

    this.saleId = this.route.snapshot.paramMap.get('id');
    if (this.saleId && this.saleId !== 'new') {
      this.loadSale();
    } else {
      // Generar número de ticket automáticamente
      this.generateTicketNumber();
    }
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

  loadSalesPoints() {
    this.salesPointsService.getAll().subscribe({
      next: (data) => {
        this.salesPoints = data;
        if (!this.saleId) {
          this.salesPointsService.getDefaultWarehouse().subscribe({
            next: (warehouse) => {
              if (warehouse) {
                this.form.patchValue({ salesPointId: warehouse.id });
              } else if (data.length === 1) {
                this.form.patchValue({ salesPointId: data[0].id });
              }
            },
          });
        }
      },
      error: (error) => {
        console.error('Error loading sales points:', error);
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
          this.addItem(item.articleId, item.quantity, item.unitPrice, item.discount);
        });

        this.form.patchValue({
          salesPointId: sale.salesPointId,
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
    if (article) {
      this.articles.update((prev) =>
        prev.some((a) => a.id === article.id) ? prev : [...prev, article],
      );
    }
    this.addItem(v.articleId, v.quantity, v.unitPrice, v.discount);
    this.closeAddItemModal();
  }

  addItem(articleId?: string, quantity: number = 1, unitPrice?: number, discount: number = 0) {
    const itemForm = this.fb.group({
      articleId: [articleId || null, [Validators.required]],
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

    const formValue = this.form.value;
    const salesPointId = formValue.salesPointId?.trim?.() || formValue.salesPointId;
    if (!salesPointId || typeof salesPointId !== 'string') {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Selecciona un punt de venta vàlid',
      });
      this.form.get('salesPointId')?.markAsTouched();
      return;
    }

    if (this.saleId && this.saleId !== 'new') {
      this.doUpdate(salesPointId, formValue);
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
    const formValue = this.form.value;
    const salesPointId = formValue.salesPointId?.trim?.() || formValue.salesPointId;
    if (!salesPointId || typeof salesPointId !== 'string') return;
    this.doCreate(salesPointId, formValue);
  }

  private doUpdate(salesPointId: string, formValue: any) {
    this.loading = true;
    const createSaleDto = this.buildCreateSaleDto(salesPointId, formValue);
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

  private doCreate(salesPointId: string, formValue: any) {
    this.loading = true;
    const createSaleDto = this.buildCreateSaleDto(salesPointId, formValue);
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

  private buildCreateSaleDto(salesPointId: string, formValue: any): CreateSaleDto {
    return {
      salesPointId,
      clientId: formValue.clientId || undefined,
      saleDate: formValue.saleDate,
      saleTime: formValue.saleTime || undefined,
      paymentType: formValue.paymentType,
      totalDiscount: Number(formValue.totalDiscount) || 0,
      totalAmount: Number(formValue.totalAmount),
      items: formValue.items.map((item: any) => ({
        articleId: item.articleId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount) || 0,
        totalPrice: Number(item.totalPrice),
      })),
    };
  }

  getSalesPointName(id: string | null): string {
    if (!id) return '-';
    const sp = this.salesPoints.find((s) => s.id === id);
    return sp ? `${sp.name} (${sp.code})` : '-';
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

  getArticleName(articleId: string): string {
    const article =
      this.articleSearchResults().find((a) => a.id === articleId) ??
      this.articles().find((a) => a.id === articleId);
    return article ? `${article.ownReference} - ${article.description}` : '';
  }

  getArticleDisplayLabel(article: Article): string {
    const parts = [article.ownReference, article.description];
    if (article.collection?.name) parts.push(`[${article.collection.name}]`);
    if (article.articleType?.name) parts.push(`(${article.articleType.name})`);
    return parts.join(' · ');
  }
}

