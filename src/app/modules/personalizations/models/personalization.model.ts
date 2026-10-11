export interface Personalization {
  id: string;
  clientId: string | null;
  client: {
    id: string;
    name: string;
    surname: string | null;
    mobilePhone: string | null;
    email: string | null;
  } | null;
  personalizationTypeId: string | null;
  personalizationType: {
    id: string;
    name: string;
  } | null;
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

export interface CreatePersonalizationDto {
  clientId?: string | null;
  personalizationTypeId?: string;
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
