export const SHIPPING_FEE = 8;

export const subtotalWithShipping = (subtotal: number) => subtotal + (subtotal > 0 ? SHIPPING_FEE : 0);
