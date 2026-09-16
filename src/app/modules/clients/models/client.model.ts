export interface Client {
  id: string;
  name: string;
  surname: string | null;
  email: string | null;
  mobilePhone: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  surname?: string;
  email?: string;
  mobilePhone?: string;
  observations?: string;
}
