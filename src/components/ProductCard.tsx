"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { calculateDiscountedPrice, formatPrice, CONDITION_LABELS } from "@/lib/utils";
import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
    price: string;
    discountPercent?: string | null;
    stock: number;
    condition: string;
    mainImageUrl?: string | null;
    partNumber?: string | null;
    warranty?: string | null;
    categoryNameAr?: string | null;
    brandNameAr?: string | null;
    brandNameEn?: string | null;
    sellerStoreName?: string | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const originalPrice = parseFloat(product.price);
  const discountedPrice = calculateDiscountedPrice(originalPrice, product.discountPercent);
  const hasDiscount = product.discountPercent && parseFloat(product.discountPercent) > 0;
  const inStock = product.stock > 0;
  const conditionLabel = CONDITION_LABELS[product.condition]?.ar || product.condition;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;
    setAdding(true);
    const result = await addToCart(product.id, 1);
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden card-hover group">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50">
          {product.mainImageUrl ? (
            <img
              src={product.mainImageUrl}
              alt={product.nameAr}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center img-placeholder">
              <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                -{product.discountPercent}%
              </span>
            )}
            {!inStock && (
              <span className="bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded">
                نفد
              </span>
            )}
          </div>
          <div className="absolute top-2 left-2">
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded font-medium">
              {conditionLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {product.brandNameAr && (
            <p className="text-xs text-gray-400 mb-1 font-medium">{product.brandNameAr}</p>
          )}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
            {product.nameAr}
          </h3>
          {product.partNumber && (
            <p className="text-xs text-gray-400 mb-2 font-mono">رقم: {product.partNumber}</p>
          )}
          {product.categoryNameAr && (
            <p className="text-xs text-blue-600 mb-2">{product.categoryNameAr}</p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-black text-[#1565C0]">
              {formatPrice(discountedPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Seller */}
          {product.sellerStoreName && (
            <p className="text-xs text-gray-400 mb-2 truncate">
              <span className="text-gray-500">البائع:</span> {product.sellerStoreName}
            </p>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            className={`w-full py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !inStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : added
                ? "bg-green-500 text-white"
                : "bg-[#1565C0] hover:bg-[#0D47A1] text-white"
            }`}
          >
            {!inStock ? "غير متاح" : adding ? "..." : added ? "تمت الإضافة" : "أضف للسلة"}
          </button>
        </div>
      </div>
    </Link>
  );
}
