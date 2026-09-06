"use client";

import { useRef, useState } from "react";

export interface ProductImageRow {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

interface ProductImageManagerProps {
  productId: string;
  images: ProductImageRow[];
  onImagesChange: (images: ProductImageRow[]) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function ProductImageManager({
  productId,
  images,
  onImagesChange,
}: ProductImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [busyImageId, setBusyImageId] = useState<string | null>(null);

  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("صيغة الملف غير مدعومة. يرجى اختيار صورة JPEG أو PNG أو WebP");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("حجم الصورة أكبر من الحد المسموح (10 ميجابايت)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/seller/products/${productId}/images`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.image) {
        setError(data.error || "تعذّر رفع الصورة");
        return;
      }
      onImagesChange([...images, data.image]);
    } catch {
      setError("خطأ في الاتصال أثناء رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setError("");
    setBusyImageId(imageId);
    try {
      const res = await fetch(`/api/seller/products/${productId}/images/${imageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذّر حذف الصورة");
        return;
      }
      const remaining = images.filter((img) => img.id !== imageId);
      // If the deleted image was primary, the server promoted another one —
      // reflect that locally without a full refetch.
      if (remaining.length > 0 && !remaining.some((img) => img.isPrimary)) {
        remaining.sort((a, b) => a.displayOrder - b.displayOrder);
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      onImagesChange(remaining);
    } catch {
      setError("خطأ في الاتصال أثناء حذف الصورة");
    } finally {
      setBusyImageId(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    setError("");
    setBusyImageId(imageId);
    try {
      const res = await fetch(`/api/seller/products/${productId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذّر تعيين الصورة الرئيسية");
        return;
      }
      onImagesChange(images.map((img) => ({ ...img, isPrimary: img.id === imageId })));
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setBusyImageId(null);
    }
  };

  const handleMove = async (imageId: string, direction: -1 | 1) => {
    const idx = sorted.findIndex((img) => img.id === imageId);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= sorted.length) return;

    const newOrder = [...sorted];
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];
    const orderIds = newOrder.map((img) => img.id);

    setError("");
    setBusyImageId(imageId);
    try {
      const res = await fetch(`/api/seller/products/${productId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذّر تغيير الترتيب");
        return;
      }
      onImagesChange(
        images.map((img) => {
          const newIndex = orderIds.indexOf(img.id);
          return newIndex === -1 ? img : { ...img, displayOrder: newIndex };
        })
      );
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setBusyImageId(null);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {sorted.map((img, idx) => (
          <div
            key={img.id}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group"
          >
            <img
              src={img.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            {img.isPrimary && (
              <span className="absolute top-1 right-1 bg-[#1565C0] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                رئيسية
              </span>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1.5">
              {!img.isPrimary && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(img.id)}
                  disabled={busyImageId === img.id}
                  className="w-full bg-white/90 hover:bg-white text-[#1565C0] text-[11px] font-semibold rounded px-1.5 py-1 disabled:opacity-50"
                >
                  تعيين كرئيسية
                </button>
              )}
              <div className="flex w-full gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(img.id, -1)}
                  disabled={busyImageId === img.id || idx === 0}
                  aria-label="تحريك لأعلى الترتيب"
                  className="flex-1 bg-white/90 hover:bg-white text-gray-700 text-[11px] rounded px-1 py-1 disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(img.id, 1)}
                  disabled={busyImageId === img.id || idx === sorted.length - 1}
                  aria-label="تحريك لأسفل الترتيب"
                  className="flex-1 bg-white/90 hover:bg-white text-gray-700 text-[11px] rounded px-1 py-1 disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={busyImageId === img.id}
                className="w-full bg-red-500/90 hover:bg-red-600 text-white text-[11px] font-semibold rounded px-1.5 py-1 disabled:opacity-50"
              >
                {busyImageId === img.id ? "..." : "حذف"}
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#1565C0] flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#1565C0] transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
              <span className="text-[11px] font-medium">جاري الرفع...</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-[11px] font-medium">إضافة صورة</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelected}
        className="hidden"
      />

      <p className="text-xs text-gray-400">
        JPEG أو PNG أو WebP، بحد أقصى 10 ميجابايت. الصورة الأولى تُستخدم كصورة رئيسية تلقائيًا.
      </p>
    </div>
  );
}
