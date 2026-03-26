import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { SalesPointsService } from '../../modules/sales-points/services/sales-points.service';
import { catchError, of } from 'rxjs';

interface MenuCard {
  title: string;
  description: string;
  route: string;
  color: string;
  /** Classes PrimeIcons (p. ex. ['pi','pi-sparkles']) per [ngClass] */
  iconClasses: string[];
}

/**
 * Pastels per als quadrats d’icona (independents del primari/secundari de marca).
 */
const HOME_ICON_PASTELS = [
  '#d4ebe3',
  '#f3dfe8',
  '#e5e0f5',
  '#fce8d4',
  '#d9ecf7',
  '#eef4dc',
  '#f7ead9',
  '#e3eaf7',
] as const;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  mainSalesPointRoute = signal<string | null>(null);
  mainSalesPointName = signal<string>('Punt Principal');

  /** Fons pastel per la targeta del punt de venda principal */
  readonly mainSalesPointIconBg = HOME_ICON_PASTELS[4];

  constructor(
    private auth: AuthService,
    private salesPointsService: SalesPointsService,
  ) {}

  ngOnInit() {
    this.salesPointsService
      .getDefaultWarehouse()
      .pipe(catchError(() => of(null)))
      .subscribe((warehouse) => {
        if (warehouse) {
          this.mainSalesPointRoute.set(`/sales-points/${warehouse.id}/stock`);
          this.mainSalesPointName.set(warehouse.name);
        }
      });
  }

  logout() {
    this.auth.logout();
  }

  featuredCards: MenuCard[] = [
    {
      title: 'Nova Venda',
      description: 'Crea una nova venda i registra la factura',
      route: '/sales/new',
      color: HOME_ICON_PASTELS[0],
      iconClasses: ['pi', 'pi-money-bill'],
    },
    {
      title: 'Nova Compostura',
      description: 'Registra una nova reparació',
      route: '/composturas/new',
      color: HOME_ICON_PASTELS[1],
      iconClasses: ['pi', 'pi-hammer'],
    },
  ];

  get menuCards(): MenuCard[] {
    const defs: Omit<MenuCard, 'color'>[] = [
      {
        title: 'Vendes',
        description: 'Veure i gestionar les teves vendes i factures',
        route: '/sales',
        iconClasses: ['pi', 'pi-shopping-cart'],
      },
      {
        title: 'Compostures',
        description: 'Veure i gestionar les reparacions',
        route: '/composturas',
        iconClasses: ['pi', 'pi-hammer'],
      },
      {
        title: 'Articles',
        description: 'Veure i gestionar les teves joies i productes',
        route: '/articles',
        iconClasses: ['pi', 'pi-sparkles'],
      },
      {
        title: 'Stock General',
        description: 'Taula amb tots els articles, preu i quantitat',
        route: '/stock-general',
        iconClasses: ['pi', 'pi-box'],
      },
      {
        title: 'Punts de Venta',
        description: 'Botigues i assignació d\'stock per punt',
        route: '/sales-points',
        iconClasses: ['pi', 'pi-shop'],
      },
      {
        title: 'Fires',
        description: 'Gestiona fires i stock per fira',
        route: '/fairs',
        iconClasses: ['pi', 'pi-calendar'],
      },
      {
        title: 'Clients',
        description: 'Contactes i dades de clients',
        route: '/clients',
        iconClasses: ['pi', 'pi-user'],
      },
      {
        title: 'Proveïdors',
        description: 'Fabricants i proveïdors d\'articles',
        route: '/suppliers',
        iconClasses: ['pi', 'pi-building'],
      },
      {
        title: 'Tallers',
        description: 'Tallers de reparació i compostura',
        route: '/workshops',
        iconClasses: ['pi', 'pi-wrench'],
      },
    ];
    if (this.auth.currentUser()?.role === 'admin') {
      defs.push(
        {
          title: 'Estadístiques',
          description: 'Vendes per botiga, article, fira i fabricació',
          route: '/statistics',
          iconClasses: ['pi', 'pi-chart-bar'],
        },
        {
          title: 'Configuració',
          description: 'Col·leccions, tipus d\'articles i compostures',
          route: '/config',
          iconClasses: ['pi', 'pi-cog'],
        },
        {
          title: 'Usuaris',
          description: 'Gestiona usuaris i rols (Botiga o Administrador)',
          route: '/users',
          iconClasses: ['pi', 'pi-users'],
        },
      );
    }
    return defs.map((c, i) => ({
      ...c,
      color: HOME_ICON_PASTELS[i % HOME_ICON_PASTELS.length],
    }));
  }
}
