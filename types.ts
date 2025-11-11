
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
}

export interface Warehouse {
    id: string;
    name: string;
    companyId: string;
}