export interface Compostura {
  id: string;
  code: string;
  client: {
    id: string;
    name: string;
    surname: string;
  };
  workshop: {
    id: string;
    name: string;
  } | null;
  composturaType: { id: string; name: string } | null;
  composturaTypeId: string | null;
  description: string;
  workToDo: string | null;
  entryDate: string;
  deliveryToWorkshopDate: string | null;
  exitFromWorkshopDate: string | null;
  deliveryToClientDate: string | null;
  cost: number;
  pvp: number;
  paymentOnAccount: number;
  photo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComposturaDto {
  code: string;
  clientId: string;
  workshopId?: string;
  composturaTypeId?: string;
  description: string;
  workToDo?: string;
  entryDate: string;
  deliveryToWorkshopDate?: string;
  exitFromWorkshopDate?: string;
  deliveryToClientDate?: string;
  cost?: number;
  pvp?: number;
  paymentOnAccount?: number;
  photo?: string;
}

