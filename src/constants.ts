
import type { Plan, PlanId, ExportColumn } from './types';

export const PLANS: Record<PlanId, Plan> = {
    free: { id: 'free', name: 'Starter', price: 0, currency: 'EUR', invoiceLimit: 50, description: "Great for testing the service.", stripePriceId: '' },
    pro: { id: 'pro', name: 'Pro', price: 19.99, currency: 'EUR', invoiceLimit: 1000, description: "Ideal for small to medium businesses.", stripePriceId: 'price_1Pbum2RqcWwIeHkP3sVkYF3h' },
    premium: { id: 'premium', name: 'Premium', price: 79.99, currency: 'EUR', invoiceLimit: 10000, description: "For large companies and high volumes.", stripePriceId: 'price_1PbumMRqcWwIeHkPz11L95Yv' }
};

export const DEFAULT_EXPORT_CONFIG: ExportColumn[] = [
    { key: 'invoiceFileName', header: 'Invoice File', enabled: true, order: 0 },
    { key: 'matchedProductName', header: 'Matched Product Name', enabled: true, order: 1 },
    { key: 'originalName', header: 'Original Name', enabled: true, order: 2 },
    { key: 'sku', header: 'SKU', enabled: true, order: 3 },
    { key: 'quantity', header: 'Quantity', enabled: true, order: 4 },
    { key: 'totalQuantity', header: 'Total Quantity', enabled: true, order: 5 },
    { key: 'unitOfMeasure', header: 'Unit of Measure', enabled: true, order: 6 },
    { key: 'unitPrice', header: 'Unit Price', enabled: true, order: 7 },
    { key: 'totalPrice', header: 'Total Price', enabled: true, order: 8 },
];
