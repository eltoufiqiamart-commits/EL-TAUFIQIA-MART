"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/utils";

interface SellerOrderDetail {
  sellerOrder: { id: string; status: string; subtotal: string; orderId: string; };
  order: {
    id: string; orderNumber: string; customerName: string; customerPhone: string;
    deliveryAddress: string; deliveryGovernorate?: string; paymentMethod: string; createdAt: string;
  };
  items: {
    id: string; productNameAr: string; productImageUrl?: string;
    partNumber?: string; unitPrice: string; quantity: number; lineTotal: string;
  }[];
}

const SELLER_STATUS_OPTIONS = [
  { value: "preparing", label: "قيد التجهيز" },
  { value: "ready_for_shipping", label: "جاهز للشحن" },
  { value: "shipped", label: "تم الشحن" },
];

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    const res = await fetch(`/api/seller/orders/${id}`);
    const d = await res.json();
    if (!d.error) { setData(d); setNewStatus(d.sellerOrder.status); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    const res = await fetch(`/api/seller/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const d = await res.json();
    setMsg(d.success ? "تم تحديث الحالة" : d.error || "خطأ");
    setUpdating(false);
    if (d.success) fetchData();
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1565C0]" /></div>;
  if (!data) return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-500">الطلب غير موجود</div>;

  const { sellerOrder, order, items } = data;
  const statusInfo = ORDER_STATUS_LABELS[sellerOrder.status];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/seller/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← لوحة البائع</Link>
        <h1 className="text-xl font-black text-gray-900">{order.orderNumber}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium status-${sellerOrder.status}`}>{statusInfo?.ar}</span>
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${msg.includes("خطأ") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">بيانات العميل</h3>
          <div className="text-sm space-y-1.5 text-gray-600">
            <p><span className="font-medium text-gray-700">الاسم:</span> {order.customerName}</p>
            <p><span className="font-medium text-gray-700">الهاتف:</span> <span dir="ltr">{order.customerPhone}</span></p>
            <p><span className="font-medium text-gray-700">العنوان:</span> {order.deliveryAddress}</p>
            {order.deliveryGovernorate && <p><span className="font-medium text-gray-700">المحافظة:</span> {order.deliveryGovernorate}</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">تحديث الحالة</h3>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1565C0] mb-3">
            {SELLER_STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={handleStatusUpdate} disabled={updating || newStatus === sellerOrder.status} className="w-full bg-[#1565C0] text-white py-2 rounded-lg text-sm font-bold disabled:opacity-60">
            {updating ? "جاري التحديث..." : "تحديث"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4 text-sm">المنتجات الخاصة بك</h3>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 bg-gray-50 rounded border flex-shrink-0">
                {item.productImageUrl && <img src={item.productImageUrl} alt={item.productNameAr} className="w-full h-full object-cover rounded" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.productNameAr}</p>
                {item.partNumber && <p className="text-xs text-gray-400 font-mono">{item.partNumber}</p>}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#1565C0] text-sm">{formatPrice(item.lineTotal)}</p>
                <p className="text-xs text-gray-400">{formatPrice(item.unitPrice)} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t flex justify-between font-bold text-sm">
          <span>إجمالي حصتك</span>
          <span className="text-[#1565C0]">{formatPrice(sellerOrder.subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
