import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { catchError, of } from 'rxjs';
import { ConfigService, Collection, ArticleType, ComposturaType } from '../../services/config.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ConfirmDialogModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './config-page.component.html',
  styleUrl: './config-page.component.css',
})
export class ConfigPageComponent implements OnInit {
  collections = signal<Collection[]>([]);
  articleTypes = signal<ArticleType[]>([]);
  composturaTypes = signal<ComposturaType[]>([]);
  loading = signal(false);
  dialogVisible = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  dialogSection = signal<'collection' | 'articleType' | 'composturaType'>(
    'collection',
  );
  editId = signal<string | null>(null);
  editName = '';

  constructor(
    private configService: ConfigService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.configService
      .getCollections()
      .pipe(catchError(() => of<Collection[]>([])))
      .subscribe({
        next: (data) => {
          this.collections.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.configService
      .getArticleTypes()
      .pipe(catchError(() => of<ArticleType[]>([])))
      .subscribe((data) => this.articleTypes.set(data));

    this.configService
      .getComposturaTypes()
      .pipe(catchError(() => of<ComposturaType[]>([])))
      .subscribe((data) => this.composturaTypes.set(data));
  }

  openCreate(section: 'collection' | 'articleType' | 'composturaType') {
    this.dialogSection.set(section);
    this.dialogMode.set('create');
    this.editId.set(null);
    this.editName = '';
    this.dialogVisible.set(true);
  }

  openEdit(
    section: 'collection' | 'articleType' | 'composturaType',
    item: { id: string; name: string },
  ) {
    this.dialogSection.set(section);
    this.dialogMode.set('edit');
    this.editId.set(item.id);
    this.editName = item.name;
    this.dialogVisible.set(true);
  }

  closeDialog() {
    this.dialogVisible.set(false);
  }

  saveDialog() {
    const name = this.editName.trim();
    if (!name) return;

    const section = this.dialogSection();
    const mode = this.dialogMode();
    const id = this.editId();

    this.loading.set(true);
    const done = () => {
      this.loading.set(false);
    };

    if (mode === 'create') {
      const req =
        section === 'collection'
          ? this.configService.createCollection(name)
          : section === 'articleType'
            ? this.configService.createArticleType(name)
            : this.configService.createComposturaType(name);
      req.subscribe({
        next: () => {
          done();
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Creat',
          });
          this.closeDialog();
          this.loadAll();
        },
        error: (err: { error?: { message?: string } }) => {
          done();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error',
          });
        },
      });
    } else if (id) {
      const req =
        section === 'collection'
          ? this.configService.updateCollection(id, name)
          : section === 'articleType'
            ? this.configService.updateArticleType(id, name)
            : this.configService.updateComposturaType(id, name);
      req.subscribe({
        next: () => {
          done();
          this.messageService.add({
            severity: 'success',
            summary: 'Èxit',
            detail: 'Actualitzat',
          });
          this.closeDialog();
          this.loadAll();
        },
        error: (err: { error?: { message?: string } }) => {
          done();
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'Error',
          });
        },
      });
    } else {
      done();
    }
  }

  confirmDelete(
    section: 'collection' | 'articleType' | 'composturaType',
    item: { id: string; name: string },
  ) {
    this.confirmationService.confirm({
      message: `Eliminar "${item.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancel·lar',
      accept: () => this.deleteItem(section, item.id),
    });
  }

  deleteItem(
    section: 'collection' | 'articleType' | 'composturaType',
    id: string,
  ) {
    const req =
      section === 'collection'
        ? this.configService.deleteCollection(id)
        : section === 'articleType'
          ? this.configService.deleteArticleType(id)
          : this.configService.deleteComposturaType(id);

    req.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Èxit',
          detail: 'Eliminat',
        });
        this.loadAll();
      },
      error: (err: { error?: { message?: string } }) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error',
        });
      },
    });
  }

  getDialogTitle(): string {
    const section = this.dialogSection();
    const mode = this.dialogMode();
    const labels = {
      collection: 'Col·lecció',
      articleType: 'Tipus d\'article',
      composturaType: 'Tipus de compostura',
    };
    return `${mode === 'create' ? 'Nova' : 'Editar'} ${labels[section]}`;
  }
}
