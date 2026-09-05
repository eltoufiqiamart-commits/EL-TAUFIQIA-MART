"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, calculateDiscountedPrice, CONDITION_LABELS, PREPAID_DISCOUNT_PERCENT } from "@/lib/utils";

interface Product {
  id: string; nameAr: string; nameEn: string; descriptionAr?: string; descriptionEn?: string;
  price: string; discountPercent?: string | null; stock: number; condition: string;
  manufacturer?: string; partNumber?: string; oemNumber?: string; crossReference?: string;
  warranty?: string; mainImageUrl?: string; sellerId: string;
  categoryNameAr?: string; categoryNameEn?: string;
  subcategoryNameAr?: string; brandNameAr?: string;
  sellerStoreName?: string; sellerWhatsapp?: string;
}

interface ProductImage { id: string; imageUrl: string; displayOrder: number; }
interface Fitment {
  id: string; makeNameAr?: string; makeNameEn?: string;
  modelNameAr?: string; modelNameEn?: string; yearFrom?: number; yearTo?: number; notes?: string;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [fitments, setFitments] = useState<Fitment[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMsg, setCartMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setProduct(d.product);
        setImages(d.images || []);
        setFitments(d.fitments || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    const result = await addToCart(product.id, quantity);
    setAddingToCart(false);
    if (result.success) {
      setCartMsg("تمت الإضافة للسلة");
      setTimeout(() => setCartMsg(""), 3000);
    } else {
      setCartMsg(result.error || "خطأ");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">{error || "المنتج غير موجود"}</h2>
        <Link href="/search" className="text-[#1565C0] hover:underline">العودة للتسوق</Link>
      </div>
    );
  }

  const originalPrice = parseFloat(product.price);
  const discountedPrice = calculateDiscountedPrice(originalPrice, product.discountPercent);
  const hasDiscount = product.discountPercent && parseFloat(product.discountPercent) > 0;
  const inStock = product.stock > 0;
  const allImages = product.mainImageUrl
    ? [{ id: "main", imageUrl: product.mainImageUrl, displayOrder: -1 }, ...images]
    : images;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1565C0]">الرئيسية</Link>
        <span>/</span>
        {product.categoryNameAr && (
          <>
            <span className="hover:text-[#1565C0]">{product.categoryNameAr}</span>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900 line-clamp-1">{product.nameAr}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-3 border border-gray-100">
            {allImages.length > 0 ? (
              <img
                src={allImages[selectedImage]?.imageUrl}
                alt={product.nameAr}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center img-placeholder">
                <svg className="w-24 h-24 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? "border-[#1565C0]" : "border-gray-200"}`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.brandNameAr && (
            <p className="text-sm text-gray-500 font-medium mb-1">{product.brandNameAr}</p>
          )}
          <h1 className="text-2xl font-black text-gray-900 mb-1">{product.nameAr}</h1>
          <p className="text-sm text-gray-500 mb-4">{product.nameEn}</p>

          {/* Price */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-black text-[#1565C0]">{formatPrice(discountedPrice)}</span>
              {hasDiscount && (
                <div>
                  <span className="text-gray-400 line-through text-base">{formatPrice(originalPrice)}</span>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded mr-2">
                    -{product.discountPercent}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-green-600 mt-1">
              وفر {PREPAID_DISCOUNT_PERCENT}% إضافي عند الدفع المسبق
            </p>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2.5 h-2.5 rounded-full ${inStock ? "bg-green-500" : "bg-red-500"}`} />
            <span className={`text-sm font-medium ${inStock ? "text-green-700" : "text-red-700"}`}>
              {inStock ? `متاح (${product.stock} قطعة)` : "غير متاح"}
            </span>
          </div>

          {/* Quick details */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">الحالة</p>
              <p className="text-sm font-semibold">{CONDITION_LABELS[product.condition]?.ar || product.condition}</p>
            </div>
            {product.partNumber && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-xs text-gray-500">رقم القطعة</p>
                <p className="text-sm font-semibold font-mono">{product.partNumber}</p>
              </div>
            )}
            {product.oemNumber && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-xs text-gray-500">رقم OEM</p>
                <p className="text-sm font-semibold font-mono">{product.oemNumber}</p>
              </div>
            )}
            {product.warranty && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-xs text-gray-500">الضمان</p>
                <p className="text-sm font-semibold">{product.warranty}</p>
              </div>
            )}
            {product.manufacturer && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-xs text-gray-500">الصانع</p>
                <p className="text-sm font-semibold">{product.manufacturer}</p>
              </div>
            )}
            {product.categoryNameAr && (
              <div className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-xs text-gray-500">التصنيف</p>
                <p className="text-sm font-semibold">{product.categoryNameAr}</p>
              </div>
            )}
          </div>

          {/* Seller */}
          {product.sellerStoreName && (
            <div className="border border-gray-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">البائع</p>
                <p className="text-sm font-bold text-gray-900">{product.sellerStoreName}</p>
              </div>
              {product.sellerWhatsapp && (
                <a
                  href={`https://wa.me/2${product.sellerWhatsapp.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  واتساب
                </a>
              )}
            </div>
          )}

          {/* Quantity and Add to cart */}
          {inStock && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-50 text-gray-600 font-bold"
                >-</button>
                <span className="px-4 py-2 text-sm font-bold border-x border-gray-200">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-50 text-gray-600 font-bold"
                >+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white py-3 rounded-xl font-bold transition-colors disabled:opacity-60"
              >
                {addingToCart ? "جاري الإضافة..." : "أضف للسلة"}
              </button>
            </div>
          )}

          {cartMsg && (
            <div className={`text-sm py-2 px-3 rounded-lg mb-3 ${cartMsg.includes("خطأ") || cartMsg.includes("يجب") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {cartMsg}
            </div>
          )}

          <Link
            href="/cart"
            className="block w-full text-center border border-[#1565C0] text-[#1565C0] py-2.5 rounded-xl font-medium hover:bg-blue-50 transition-colors text-sm"
          >
            عرض السلة والدفع
          </Link>
        </div>
      </div>

      {/* Description & Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {(product.descriptionAr || product.descriptionEn) && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">وصف المنتج</h3>
              {product.descriptionAr && <p className="text-gray-700 text-sm leading-relaxed mb-3">{product.descriptionAr}</p>}
              {product.descriptionEn && <p className="text-gray-500 text-sm leading-relaxed" dir="ltr">{product.descriptionEn}</p>}
            </div>
          )}

          {product.crossReference && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">أرقام مرجعية مكافئة</h3>
              <p className="text-gray-600 text-sm font-mono">{product.crossReference}</p>
            </div>
          )}

          {fitments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">سيارات متوافقة</h3>
              <div className="space-y-2">
                {fitments.map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg px-3 py-2">
                    <svg className="w-4 h-4 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">{f.makeNameAr} {f.modelNameAr}</span>
                    {(f.yearFrom || f.yearTo) && (
                      <span className="text-gray-500">
                        ({f.yearFrom}{f.yearTo && f.yearTo !== f.yearFrom ? ` - ${f.yearTo}` : ""})
                      </span>
                    )}
                    {f.notes && <span className="text-gray-400 text-xs">- {f.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment info */}
        <div className="space-y-4">
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <h4 className="font-bold text-green-800 mb-2 text-sm">خصم الدفع المسبق</h4>
            <p className="text-green-700 text-sm">
              احصل على خصم <strong>{PREPAID_DISCOUNT_PERCENT}%</strong> عند الدفع عبر InstaPay أو فودافون كاش أو أي طريقة دفع مسبق
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="font-bold text-gray-900 mb-3 text-sm">طرق الدفع المتاحة</h4>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1565C0] rounded-full" />
                الدفع عند الاستلام
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1565C0] rounded-full" />
                InstaPay
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1565C0] rounded-full" />
                فودافون كاش
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1565C0] rounded-full" />
                فوري
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1565C0] rounded-full" />
                تحويل بنكي
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
