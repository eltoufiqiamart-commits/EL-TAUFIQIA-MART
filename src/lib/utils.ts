export function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPriceEn(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `EGP ${num.toLocaleString("en-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function calculateDiscountedPrice(
  price: number | string,
  discountPercent: number | string | null | undefined
): number {
  const p = typeof price === "string" ? parseFloat(price) : price;
  const d = typeof discountPercent === "string" ? parseFloat(discountPercent) : (discountPercent ?? 0);
  if (!d) return p;
  return p - (p * d) / 100;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TM-${timestamp}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, (c) => c) // keep Arabic
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const PREPAID_DISCOUNT_PERCENT = 2;

export function applyPrepaidDiscount(total: number): {
  discount: number;
  finalTotal: number;
} {
  const discount = (total * PREPAID_DISCOUNT_PERCENT) / 100;
  return {
    discount: Math.round(discount * 100) / 100,
    finalTotal: Math.round((total - discount) * 100) / 100,
  };
}

export const ORDER_STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  new: { ar: "جديد", en: "New", color: "blue" },
  confirmed: { ar: "مؤكد", en: "Confirmed", color: "indigo" },
  preparing: { ar: "قيد التجهيز", en: "Preparing", color: "yellow" },
  ready_for_shipping: { ar: "جاهز للشحن", en: "Ready for Shipping", color: "orange" },
  shipped: { ar: "تم الشحن", en: "Shipped", color: "purple" },
  delivered: { ar: "تم التسليم", en: "Delivered", color: "green" },
  cancelled: { ar: "ملغي", en: "Cancelled", color: "red" },
  returned: { ar: "مرتجع", en: "Returned", color: "gray" },
};

export const PAYMENT_METHOD_LABELS: Record<string, { ar: string; en: string }> = {
  cash_on_delivery: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" },
  instapay: { ar: "إنستاباي", en: "InstaPay" },
  vodafone_cash: { ar: "فودافون كاش", en: "Vodafone Cash" },
  fawry: { ar: "فوري", en: "Fawry" },
  card: { ar: "بطاقة بنكية", en: "Card" },
  bank_transfer: { ar: "تحويل بنكي", en: "Bank Transfer" },
};

export const CONDITION_LABELS: Record<string, { ar: string; en: string }> = {
  new: { ar: "جديد", en: "New" },
  used: { ar: "مستعمل", en: "Used" },
  original: { ar: "أصلي", en: "Original" },
  aftermarket: { ar: "بديل", en: "Aftermarket" },
  oem: { ar: "OEM", en: "OEM" },
};
