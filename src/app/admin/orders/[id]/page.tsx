"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "new", label: "جديد" },
  { value: "confirmed", label: "مؤكد" },
  { value: "preparing", label: "قيد التجهيز" },
  { value: "ready_for_shipping", label: "جاهز للشحن" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
  { value: "returned", label: "مرتجع" },
];

interface AdminOrderDetail {
  order: {
    id: string; orderNumber: string; status: string; customerName: string;
    customerPhone: string; customerEmail?: string; deliveryAddress: string;
    deliveryCity?: string; deliveryGovernorate?: string;
    subtotal: string; discountAmount: string; shippingFee: string; total: string;
    paymentMethod: string; paymentStatus: string; prepaidDiscountApplied: boolean;
    customerNotes?: string; createdAt: string; updatedAt: string;
    vehicleInfo?: Record<string, unknown>;
  };
  items: {
    id: string; productNameAr: string; productNameEn: string; productImageUrl?: string;
    partNumber?: string; sellerName?: string; unitPrice: string; quantity: number; lineTotal: string;
  }[];
  history: { id: string; status: string; notes?: string; createdAt: string; actorRole?: string; }[];
  sellerOrders: { id: string; sellerId: string; status: string; subtotal: string; }[];
  shipping: { provider?: string; trackingNumber?: string; fee: string; status?: string; } | null;
  payments: { id: string; method: string; status: string; amount: string; }[];
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    const res = await fetch(`/api/admin/orders/${id}`);
    const d = await res.json();
    if (!d.error) {
      setData(d);
      setNewStatus(d.order.status);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !data) return;
    setUpdating(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, notes: statusNotes }),
    });
    const d = await res.json();
    if (d.success) {
      setMsg("تم تحديث الحالة");
      setStatusNotes("");
      fetchData();
    } else {
      setMsg(d.error || "خطأ");
    }
    setUpdating(false);
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]" /></div>;
  if (!data) return <div className="p-6 text-gray-500">الطلب غير موجود</div>;

  const { order, items, history, shipping, payments } = data;
  const statusInfo = ORDER_STATUS_LABELS[order.status];
  const paymentInfo = PAYMENT_METHOD_LABELS[order.paymentMethod];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/orders" className="text-gray-400 hover:text-gray-600 text-sm">
              ← الطلبات
            </Link>
          </div>
          <h1 className="text-xl font-black text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString("ar-EG")}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold status-${order.status}`}>
          {statusInfo?.ar}
        </span>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.includes("خطأ") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">بيانات العميل</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">الاسم</p><p className="font-medium">{order.customerName}</p></div>
              <div><p className="text-xs text-gray-500">الهاتف</p><p className="font-medium" dir="ltr">{order.customerPhone}</p></div>
              {order.customerEmail && <div><p className="text-xs text-gray-500">البريد</p><p className="font-medium">{order.customerEmail}</p></div>}
              <div><p className="text-xs text-gray-500">العنوان</p><p className="font-medium">{order.deliveryAddress}</p></div>
              {order.deliveryGovernorate && <div><p className="text-xs text-gray-500">المحافظة</p><p className="font-medium">{order.deliveryGovernorate}</p></div>}
              {order.deliveryCity && <div><p className="text-xs text-gray-500">المدينة</p><p className="font-medium">{order.deliveryCity}</p></div>}
            </div>
            {order.customerNotes && (
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-600 font-medium">ملاحظات العميل</p>
                <p className="text-sm text-yellow-800">{order.customerNotes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">المنتجات ({items.length})</h3>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-10 h-10 bg-gray-50 rounded border flex-shrink-0 overflow-hidden">
                    {item.productImageUrl && <img src={item.productImageUrl} alt={item.productNameAr} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.productNameAr}</p>
                    <p className="text-xs text-gray-400">{item.sellerName && `البائع: ${item.sellerName}`} {item.partNumber && `| رقم: ${item.partNumber}`}</p>
                  </div>
                  <div className="text-right flex-shrink-0 text-sm">
                    <p className="font-bold text-[#1565C0]">{formatPrice(item.lineTotal)}</p>
                    <p className="text-gray-400 text-xs">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">المجموع الجزئي</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">الشحن</span><span>{formatPrice(order.shippingFee)}</span></div>
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600"><span>خصم الدفع المسبق</span><span>-{formatPrice(order.discountAmount)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>الإجمالي</span><span className="text-[#1565C0]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Status history */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">تاريخ الحالات</h3>
            <div className="space-y-3">
              {history.map(h => {
                const info = ORDER_STATUS_LABELS[h.status];
                return (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 status-${h.status}`} style={{ background: "currentColor" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${h.status}`}>{info?.ar}</span>
                        {h.actorRole && <span className="text-xs text-gray-400">({h.actorRole === "admin" ? "مدير" : h.actorRole === "seller" ? "بائع" : "عميل"})</span>}
                      </div>
                      {h.notes && <p className="text-xs text-gray-600 mt-0.5">{h.notes}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(h.createdAt).toLocaleString("ar-EG")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Update status */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">تحديث الحالة</h3>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] mb-3"
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <textarea
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder="ملاحظات (اختياري)"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] resize-none mb-3"
            />
            <button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
              className="w-full bg-[#1565C0] hover:bg-[#0D47A1] text-white py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 transition-colors"
            >
              {updating ? "جاري التحديث..." : "تحديث الحالة"}
            </button>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">الدفع</h3>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-gray-500">الطريقة:</span> {paymentInfo?.ar}</p>
              {payments.map(p => (
                <p key={p.id}><span className="text-gray-500">الحالة:</span>{" "}
                  <span className={p.status === "paid" ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                    {p.status === "paid" ? "مدفوع" : "في الانتظار"}
                  </span>
                </p>
              ))}
              {order.prepaidDiscountApplied && <p className="text-green-600">تم تطبيق خصم الدفع المسبق</p>}
            </div>
          </div>

          {/* Shipping */}
          {shipping && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">الشحن</h3>
              <div className="space-y-1.5 text-sm">
                {shipping.provider && <p><span className="text-gray-500">المزود:</span> {shipping.provider}</p>}
                {shipping.trackingNumber && <p><span className="text-gray-500">رقم التتبع:</span> {shipping.trackingNumber}</p>}
                <p><span className="text-gray-500">الرسوم:</span> {formatPrice(shipping.fee)}</p>
                {shipping.status && <p><span className="text-gray-500">الحالة:</span> {shipping.status}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
