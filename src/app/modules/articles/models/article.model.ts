export interface ArticlePhoto {
  id: string;
  path: string;
  sortOrder: number;
}

export interface ArticleVariant {
  id: string;
  label: string;
  sortOrder: number;
  warehouseQuantity: number;
}

export interface ArticleVariantInput {
  id?: string;
  label: string;
  warehouseQuantity?: number;
  sortOrder?: number;
}

export interface Article {
  id: string;
  ownReference: string;
  description: string;
  cost: number | null;
  pvp: number;
  stock: number;
  hasVariants: boolean;
  variants?: ArticleVariant[];
  /** Quantitat a la fira (només per usuaris botiga) */
  quantityAtFair?: number;
  observations: string | null;
  photo: string | null;
  photos?: ArticlePhoto[];
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

export interface StockBreakdownSalesPointColumn {
  salesPointId: string;
  salesPointCode: string;
  salesPointName: string;
}

export interface StockBreakdownVariantRow {
  articleVariantId: string;
  label: string;
  sortOrder: number;
  quantitiesBySalesPointId: Record<string, number>;
  total: number;
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
  variantMatrix?: {
    columns: StockBreakdownSalesPointColumn[];
    rows: StockBreakdownVariantRow[];
  };
}

export interface CreateArticleDto {
  ownReference: string;
  description: string;
  cost: number | null;
  pvp: number;
  stock?: number;
  hasVariants?: boolean;
  variants?: ArticleVariantInput[];
  observations?: string;
  photo?: string;
  photoPaths?: string[];
  collectionId?: string;
  articleTypeId?: string;
}
