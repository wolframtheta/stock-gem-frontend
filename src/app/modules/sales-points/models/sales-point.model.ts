export interface SalesPoint {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isDefaultWarehouse: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPointStockItem {
  id: string;
  salesPointId: string;
  articleId: string;
  quantity: number;
  maxQuantity?: number;
  article?: {
    id: string;
    ownReference: string;
    description: string;
    stock: number;
  };
}
