"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, CONDITION_LABELS } from "@/lib/utils";
import { Suspense } from "react";

interface OrderDetail {
  order: {
    id: string; orderNumber: string; status: string; customerName: string;
    customerPhone: string; customerEmail?: string; deliveryAddress: string;
    deliveryCity?: string; deliveryGovernorate?: string; vehicleInfo?: Record<string, unknown>;
    subtotal: string; discountAmount: string; shippingFee: string; total: string;
    paymentMethod: string; paymentStatus: string; prepaidDiscountApplied: boolean;
    customerNotes?: string; createdAt: string;
  };
  items: {
    id: string; productNameAr: string; productNameEn: string; productImageUrl?: string;
    partNumber?: string; sellerName?: string; unitPrice: string; discountPercent?: string;
    quantity: number; lineTotal: string;
  }[];
  history: { id: string; status: string; notes?: string; createdAt: string; actorRole?: string; }[];
}

function OrderDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "1";
  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white h-24 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">الطلب غير موجود</h2>
        <Link href="/orders" className="text-[#1565C0] hover:underline">العودة للطلبات</Link>
      </div>
    );
  }

  const { order, items, history } = data;
  const statusInfo = ORDER_STATUS_LABELS[order.status];
  const paymentInfo = PAYMENT_METHOD_LABELS[order.paymentMethod];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {isSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-bold text-green-800 mb-1">تم إنشاء طلبك بنجاح!</h2>
          <p className="text-green-600 text-sm">رقم طلبك: <strong>{order.orderNumber}</strong></p>
          {order.paymentMethod !== "cash_on_delivery" && (
            <div className="mt-3 bg-green-100 rounded-lg p-3 text-sm text-green-800">
              <p className="font-semibold mb-1">تعليمات الدفع:</p>
              {order.paymentMethod === "instapay" && <p>InstaPay: <strong>01119496168</strong></p>}
              {order.paymentMethod === "vodafone_cash" && <p>فودافون كاش: <strong>01099017820</strong></p>}
              {order.paymentMethod === "fawry" && <p>فوري: <strong>01206680398</strong></p>}
              <p className="mt-1">برجاء إرسال إيصال الدفع على واتساب: <strong>01206680398</strong></p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold status-${order.status}`}>
          {statusInfo?.ar || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">بيانات العميل</h3>
          <div className="space-y-1.5 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">الاسم:</span> {order.customerName}</p>
            <p><span className="font-medium text-gray-700">الهاتف:</span> <span dir="ltr">{order.customerPhone}</span></p>
            {order.customerEmail && <p><span className="font-medium text-gray-700">البريد:</span> {order.customerEmail}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">عنوان التوصيل</h3>
          <div className="space-y-1.5 text-sm text-gray-600">
            <p>{order.deliveryAddress}</p>
            {order.deliveryCity && <p>{order.deliveryCity}</p>}
            {order.deliveryGovernorate && <p>{order.deliveryGovernorate}</p>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-900 mb-4">المنتجات</h3>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productNameAr} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.productNameAr}</p>
                {item.partNumber && <p className="text-xs text-gray-400 font-mono">رقم: {item.partNumber}</p>}
                {item.sellerName && <p className="text-xs text-gray-400">البائع: {item.sellerName}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-[#1565C0]">{formatPrice(item.lineTotal)}</p>
                <p className="text-xs text-gray-400">{formatPrice(item.unitPrice)} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">المجموع الجزئي</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">الشحن</span><span>{formatPrice(order.shippingFee)}</span></div>
          {parseFloat(order.discountAmount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>خصم الدفع المسبق</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>الإجمالي</span>
            <span className="text-[#1565C0]">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">الدفع</h3>
          <div className="space-y-1.5 text-sm">
            <p><span className="font-medium text-gray-700">الطريقة:</span> {paymentInfo?.ar}</p>
            <p>
              <span className="font-medium text-gray-700">الحالة:</span>{" "}
              <span className={order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}>
                {order.paymentStatus === "paid" ? "تم الدفع" : "في الانتظار"}
              </span>
            </p>
            {order.prepaidDiscountApplied && (
              <p className="text-green-600">تم تطبيق خصم الدفع المسبق (2%)</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">تاريخ الحالات</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map(h => {
              const statusInfo = ORDER_STATUS_LABELS[h.status];
              return (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 status-${h.status} bg-current`} />
                  <div>
                    <span className="font-medium">{statusInfo?.ar || h.status}</span>
                    {h.notes && <span className="text-gray-400 ml-1">- {h.notes}</span>}
                    <p className="text-gray-400">{new Date(h.createdAt).toLocaleString("ar-EG")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {order.customerNotes && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mt-5">
          <p className="text-sm font-medium text-yellow-800 mb-1">ملاحظاتك</p>
          <p className="text-sm text-yellow-700">{order.customerNotes}</p>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Link href="/orders" className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
          العودة للطلبات
        </Link>
        <a
          href={`https://wa.me/201206680398?text=استفسار عن طلب رقم: ${order.orderNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          تواصل بشأن الطلب
        </a>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]"></div></div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
