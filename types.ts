
export interface Product {
  name: string;
  sku: string;
}

export interface Vertex {
    x: number;
    y: number;
}

export interface InvoiceItem {
  id: string;
  matchedProductName: string;
  originalName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku: string;
  invoiceFileName: string;
  totalQuantity: number;
  unitOfMeasure: string;
  boundingBox?: Vertex[];
}

export interface Company {
  id: string;
  name: string;
  ownerId: string; // userId of the owner
}

export interface Warehouse {
  id: string;
  name: string;
  companyId: string;
}

export interface Nomenclature {
  id: string;
  name: string;
  companyId: string;
  data: Product[];
}

export interface ProcessedInvoice {
  id: string;
  userId: string;
  companyId: string;
  warehouseId: string;
  nomenclatureId: string;
  fileName: string;
  processedAt: number; // timestamp
  items: InvoiceItem[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  companyIds: string[]; // ids of companies the user is a member of
}

export type PlanId = 'free' | 'pro' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: 'EUR';
  invoiceLimit: number;
  description: string;
  stripePriceId: string;
}

export interface UserSubscription {
  planId: PlanId;
  invoiceCount: number;
  startDate: number; // timestamp
  endDate: number; // timestamp
}

export interface ExportColumn {
  key: string;
  header: string;
  enabled: boolean;
  order: number;
}
