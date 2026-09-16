export interface ArticlePhoto {
  id: string;
  path: string;
  sortOrder: number;
}

export interface Article {
  id: string;
  ownReference: string;
  description: string;
  cost: number | null;
  pvp: number;
  stock: number;
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
  description: string;
  cost: number | null;
  pvp: number;
  stock?: number;
  observations?: string;
  photo?: string;
  photoPaths?: string[];
  collectionId?: string;
  articleTypeId?: string;
}
