export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ContactResponse {
  statusCode: number;
  headers: {
    [key: string]: string;
  };
  body: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
}
