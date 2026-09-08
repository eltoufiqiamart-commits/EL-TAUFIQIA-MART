"use client";

/**
 * Compatibility shim for the legacy seller product editor.
 *
 * Product image management is now handled by AdminProductImageManager.
 * The seller editor is retained in the codebase for compatibility, but the
 * application no longer exposes the seller workflow. Keeping this lightweight
 * component prevents the legacy route from breaking the production build.
 */
export type ProductImageRow = {
  id?: string;
  productId?: string;
  imageUrl?: string;
  storagePath?: string | null;
  altText?: string | null;
  displayOrder?: number;
  isPrimary?: boolean;
  [key: string]: unknown;
};

export default function ProductImageManager(_props: Record<string, unknown>) {
  return null;
}
