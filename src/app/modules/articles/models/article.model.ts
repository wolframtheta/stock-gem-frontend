export interface Article {
  id: string;
  ownReference: string;
  supplierReference: string | null;
  family: string | null;
  subfamily: string | null;
  description: string;
  shortDescription: string | null;
  cost: number;
  pvp: number;
  stock: number;
  /** Quantitat a la fira (només per usuaris botiga) */
  quantityAtFair?: number;
  weight: number | null;
  margin: number | null;
  taxBase: number | null;
  observations: string | null;
  photo: string | null;
  barcode: string | null;
  supplier: {
    id: string;
    name: string;
    surname: string;
  } | null;
  supplierId: string | null;
  collection: { id: string; name: string } | null;
  collectionId: string | null;
  articleType: { id: string; name: string } | null;
  articleTypeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticlePriceHistory {
  id: string;
  articleId: string;
  price: number;
  changedAt: string;
}

export interface ArticleStockHistory {
  id: string;
  articleId: string;
  quantityAdded: number;
  recordedAt: string;
}

export interface StockBreakdown {
  total: number;
  bySalesPoint: {
    salesPointId: string;
    salesPointCode: string;
    salesPointName: string;
    quantity: number;
  }[];
  byFair: {
    fairId: string;
    fairName: string;
    quantity: number;
  }[];
  unassigned: number;
}

export interface CreateArticleDto {
  ownReference: string;
  supplierReference?: string;
  family?: string;
  subfamily?: string;
  description: string;
  shortDescription?: string;
  cost: number;
  pvp: number;
  stock?: number;
  weight?: number;
  margin?: number;
  taxBase?: number;
  observations?: string;
  photo?: string;
  barcode?: string;
  supplierId?: string;
  collectionId?: string;
  articleTypeId?: string;
}

