import { Routes } from '@angular/router';
import { ArticlesListComponent } from './modules/articles/components/articles-list/articles-list.component';
import { ArticleFormComponent } from './modules/articles/components/article-form/article-form.component';
import { ArticleDetailComponent } from './modules/articles/components/article-detail/article-detail.component';
import { ClientsListComponent } from './modules/clients/components/clients-list/clients-list.component';
import { ClientFormComponent } from './modules/clients/components/client-form/client-form.component';
import { WorkshopsListComponent } from './modules/workshops/components/workshops-list/workshops-list.component';
import { WorkshopFormComponent } from './modules/workshops/components/workshop-form/workshop-form.component';
import { SuppliersListComponent } from './modules/suppliers/components/suppliers-list/suppliers-list.component';
import { SupplierFormComponent } from './modules/suppliers/components/supplier-form/supplier-form.component';
import { SalesListComponent } from './modules/sales/components/sales-list/sales-list.component';
import { SaleFormComponent } from './modules/sales/components/sale-form/sale-form.component';
import { ComposturasListComponent } from './modules/composturas/components/composturas-list/composturas-list.component';
import { ComposturaFormComponent } from './modules/composturas/components/compostura-form/compostura-form.component';
import { SalesPointsListComponent } from './modules/sales-points/components/sales-points-list/sales-points-list.component';
import { SalesPointFormComponent } from './modules/sales-points/components/sales-point-form/sales-point-form.component';
import { SalesPointStockComponent } from './modules/sales-points/components/sales-point-stock/sales-point-stock.component';
import { SalesPointAddStockComponent } from './modules/sales-points/components/sales-point-add-stock/sales-point-add-stock.component';
import { UsersListComponent } from './modules/users/components/users-list/users-list.component';
import { UserFormComponent } from './modules/users/components/user-form/user-form.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ConfigPageComponent } from './modules/config/components/config-page/config-page.component';
import { FairsListComponent } from './modules/fairs/components/fairs-list/fairs-list.component';
import { FairFormComponent } from './modules/fairs/components/fair-form/fair-form.component';
import { FairStockComponent } from './modules/fairs/components/fair-stock/fair-stock.component';
import { FairDetailComponent } from './modules/fairs/components/fair-detail/fair-detail.component';
import { StatisticsPageComponent } from './modules/statistics/components/statistics-page/statistics-page.component';
import { StockGeneralComponent } from './pages/stock-general/stock-general.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'articles', component: ArticlesListComponent },
      {
        path: 'articles/new',
        component: ArticleFormComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'articles/:id/edit',
        component: ArticleFormComponent,
        canActivate: [adminGuard],
      },
      { path: 'articles/:id', component: ArticleDetailComponent },
      { path: 'clients', component: ClientsListComponent },
      { path: 'clients/new', component: ClientFormComponent },
      { path: 'clients/:id/edit', component: ClientFormComponent },
      { path: 'workshops', component: WorkshopsListComponent },
      { path: 'workshops/new', component: WorkshopFormComponent },
      { path: 'workshops/:id/edit', component: WorkshopFormComponent },
      { path: 'suppliers', component: SuppliersListComponent },
      { path: 'suppliers/new', component: SupplierFormComponent },
      { path: 'suppliers/:id/edit', component: SupplierFormComponent },
      { path: 'stock-general', component: StockGeneralComponent },
      { path: 'sales-points', component: SalesPointsListComponent },
      { path: 'sales-points/new', component: SalesPointFormComponent },
      { path: 'sales-points/:id/edit', component: SalesPointFormComponent },
      { path: 'sales-points/:id/stock', component: SalesPointStockComponent },
      { path: 'sales-points/:id/add-stock', component: SalesPointAddStockComponent },
      { path: 'fairs', component: FairsListComponent },
      { path: 'fairs/new', component: FairFormComponent },
      { path: 'fairs/:id/edit', component: FairFormComponent },
      { path: 'fairs/:id/stock', component: FairStockComponent },
      { path: 'fairs/:id', component: FairDetailComponent },
      { path: 'sales', component: SalesListComponent },
      { path: 'sales/new', component: SaleFormComponent },
      { path: 'sales/:id/edit', component: SaleFormComponent },
      { path: 'composturas', component: ComposturasListComponent },
      { path: 'composturas/new', component: ComposturaFormComponent },
      { path: 'composturas/:id/edit', component: ComposturaFormComponent },
      {
        path: 'config',
        component: ConfigPageComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'statistics',
        component: StatisticsPageComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'users',
        component: UsersListComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'users/new',
        component: UserFormComponent,
        canActivate: [adminGuard],
      },
      {
        path: 'users/:id/edit',
        component: UserFormComponent,
        canActivate: [adminGuard],
      },
    ],
  },
];
