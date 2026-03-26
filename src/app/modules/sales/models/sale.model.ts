export enum PaymentType {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CASH_VOUCHER = 'cash_voucher',
  BIZUM = 'bizum',
}

export interface SaleItem {
  id: string;
  saleId: string;
  articleId: string;
  article?: {
    id: string;
    ownReference: string;
    description: string;
    pvp: number;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  ticketNumber: string | null;
  salesPointId: string;
  salesPoint?: {
    id: string;
    code: string;
    name: string;
  };
  clientId: string | null;
  client?: {
    id: string;
    name: string;
    surname: string;
  };
  sellerId: string | null;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
  saleDate: string;
  saleTime: string | null;
  paymentType: PaymentType;
  totalDiscount: number;
  totalAmount: number;
  items: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleItemDto {
  articleId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface CreateSaleDto {
  // saleNumber se genera automáticamente en el backend
  // ticketNumber se genera automáticamente en el backend
  salesPointId: string;
  clientId?: string;
  sellerId?: string;
  saleDate: string;
  saleTime?: string;
  paymentType: PaymentType;
  totalDiscount: number;
  totalAmount: number;
  items: CreateSaleItemDto[];
}

