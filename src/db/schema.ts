import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["customer", "seller", "admin"]);

export const sellerApplicationStatusEnum = pgEnum("seller_application_status", [
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const productConditionEnum = pgEnum("product_condition", [
  "new",
  "used",
  "original",
  "aftermarket",
  "oem",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "confirmed",
  "preparing",
  "ready_for_shipping",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash_on_delivery",
  "instapay",
  "vodafone_cash",
  "fawry",
  "card",
  "bank_transfer",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

// ─── Profiles ───────────────────────────────────────────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("customer"),
    fullName: varchar("full_name", { length: 255 }),
    phone: varchar("phone", { length: 30 }),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("profiles_email_idx").on(t.email),
    index("profiles_role_idx").on(t.role),
  ]
);

// ─── Seller Profiles ─────────────────────────────────────────────────────────

export const sellerProfiles = pgTable(
  "seller_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" })
      .unique(),
    storeName: varchar("store_name", { length: 255 }).notNull(),
    storeNameAr: varchar("store_name_ar", { length: 255 }),
    description: text("description"),
    descriptionAr: text("description_ar"),
    phone: varchar("phone", { length: 30 }),
    whatsapp: varchar("whatsapp", { length: 30 }),
    address: text("address"),
    logoUrl: text("logo_url"),
    status: sellerApplicationStatusEnum("status").notNull().default("pending"),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
    totalSales: integer("total_sales").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("seller_profiles_profile_id_idx").on(t.profileId)]
);

// ─── Seller Applications ──────────────────────────────────────────────────────

export const sellerApplications = pgTable(
  "seller_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    storeName: varchar("store_name", { length: 255 }).notNull(),
    storeNameAr: varchar("store_name_ar", { length: 255 }),
    description: text("description"),
    phone: varchar("phone", { length: 30 }).notNull(),
    address: text("address"),
    taxId: varchar("tax_id", { length: 100 }),
    status: sellerApplicationStatusEnum("status").notNull().default("pending"),
    adminNotes: text("admin_notes"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: uuid("reviewed_by").references(() => profiles.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("seller_applications_profile_id_idx").on(t.profileId)]
);

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("categories_slug_idx").on(t.slug),
    index("categories_display_order_idx").on(t.displayOrder),
  ]
);

// ─── Subcategories ────────────────────────────────────────────────────────────

export const subcategories = pgTable(
  "subcategories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("subcategories_category_id_idx").on(t.categoryId),
    index("subcategories_slug_idx").on(t.slug),
  ]
);

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    logoUrl: text("logo_url"),
    country: varchar("country", { length: 100 }),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("brands_slug_idx").on(t.slug)]
);

// ─── Vehicle Makes ────────────────────────────────────────────────────────────

export const vehicleMakes = pgTable(
  "vehicle_makes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nameAr: varchar("name_ar", { length: 100 }).notNull(),
    nameEn: varchar("name_en", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [index("vehicle_makes_slug_idx").on(t.slug)]
);

// ─── Vehicle Models ───────────────────────────────────────────────────────────

export const vehicleModels = pgTable(
  "vehicle_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    makeId: uuid("make_id")
      .notNull()
      .references(() => vehicleMakes.id, { onDelete: "cascade" }),
    nameAr: varchar("name_ar", { length: 100 }).notNull(),
    nameEn: varchar("name_en", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    index("vehicle_models_make_id_idx").on(t.makeId),
    uniqueIndex("vehicle_models_make_slug_idx").on(t.makeId, t.slug),
  ]
);

// ─── Vehicle Generations ──────────────────────────────────────────────────────

export const vehicleGenerations = pgTable(
  "vehicle_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelId: uuid("model_id")
      .notNull()
      .references(() => vehicleModels.id, { onDelete: "cascade" }),
    nameAr: varchar("name_ar", { length: 100 }),
    nameEn: varchar("name_en", { length: 100 }).notNull(),
    yearFrom: integer("year_from").notNull(),
    yearTo: integer("year_to"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("vehicle_generations_model_id_idx").on(t.modelId)]
);

// ─── Vehicle Engines ──────────────────────────────────────────────────────────

export const vehicleEngines = pgTable(
  "vehicle_engines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => vehicleGenerations.id, { onDelete: "cascade" }),
    nameEn: varchar("name_en", { length: 150 }).notNull(),
    displacement: varchar("displacement", { length: 20 }),
    fuelType: varchar("fuel_type", { length: 30 }),
    power: varchar("power", { length: 30 }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("vehicle_engines_generation_id_idx").on(t.generationId)]
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellerProfiles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: uuid("subcategory_id").references(() => subcategories.id, {
      onDelete: "set null",
    }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    nameAr: varchar("name_ar", { length: 255 }).notNull(),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 300 }).notNull(),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),
    manufacturer: varchar("manufacturer", { length: 255 }),
    partNumber: varchar("part_number", { length: 100 }),
    oemNumber: varchar("oem_number", { length: 100 }),
    crossReference: text("cross_reference"),
    condition: productConditionEnum("condition").notNull().default("new"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
    stock: integer("stock").notNull().default(0),
    warranty: varchar("warranty", { length: 255 }),
    weight: decimal("weight", { precision: 8, scale: 3 }),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    mainImageUrl: text("main_image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_seller_id_idx").on(t.sellerId),
    index("products_category_id_idx").on(t.categoryId),
    index("products_subcategory_id_idx").on(t.subcategoryId),
    index("products_brand_id_idx").on(t.brandId),
    index("products_part_number_idx").on(t.partNumber),
    index("products_oem_number_idx").on(t.oemNumber),
    index("products_slug_idx").on(t.slug),
    index("products_is_active_idx").on(t.isActive),
  ]
);

// ─── Product Images ───────────────────────────────────────────────────────────

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    // Path of the object inside the Supabase Storage bucket (e.g.
    // "products/{sellerId}/{productId}/{uuid}.webp"). Needed to delete the
    // underlying Storage object later — imageUrl alone (a public CDN URL)
    // isn't reliably reversible into a storage path. Nullable to remain
    // compatible with any pre-existing rows that only ever had an external
    // imageUrl (e.g. legacy manually-entered URLs).
    storagePath: text("storage_path"),
    altText: varchar("alt_text", { length: 255 }),
    displayOrder: integer("display_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("product_images_product_id_idx").on(t.productId)]
);

// ─── Vehicle Fitments ──────────────────────────────────────────────────────────

export const vehicleFitments = pgTable(
  "vehicle_fitments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    makeId: uuid("make_id").references(() => vehicleMakes.id, {
      onDelete: "set null",
    }),
    modelId: uuid("model_id").references(() => vehicleModels.id, {
      onDelete: "set null",
    }),
    generationId: uuid("generation_id").references(() => vehicleGenerations.id, {
      onDelete: "set null",
    }),
    engineId: uuid("engine_id").references(() => vehicleEngines.id, {
      onDelete: "set null",
    }),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    notes: text("notes"),
  },
  (t) => [
    index("vehicle_fitments_product_id_idx").on(t.productId),
    index("vehicle_fitments_make_id_idx").on(t.makeId),
    index("vehicle_fitments_model_id_idx").on(t.modelId),
  ]
);

// ─── Customer Cars ────────────────────────────────────────────────────────────

export const customerCars = pgTable(
  "customer_cars",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    makeId: uuid("make_id").references(() => vehicleMakes.id, {
      onDelete: "set null",
    }),
    modelId: uuid("model_id").references(() => vehicleModels.id, {
      onDelete: "set null",
    }),
    generationId: uuid("generation_id").references(() => vehicleGenerations.id, {
      onDelete: "set null",
    }),
    engineId: uuid("engine_id").references(() => vehicleEngines.id, {
      onDelete: "set null",
    }),
    year: integer("year"),
    nickname: varchar("nickname", { length: 100 }),
    isDefault: boolean("is_default").notNull().default(false),
    customMake: varchar("custom_make", { length: 100 }),
    customModel: varchar("custom_model", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("customer_cars_profile_id_idx").on(t.profileId)]
);

// ─── Favorites ────────────────────────────────────────────────────────────────

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("favorites_profile_product_idx").on(t.profileId, t.productId),
  ]
);

// ─── Carts ────────────────────────────────────────────────────────────────────

export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" })
    .unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Cart Items ───────────────────────────────────────────────────────────────

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (t) => [
    index("cart_items_cart_id_idx").on(t.cartId),
    uniqueIndex("cart_items_cart_product_idx").on(t.cartId, t.productId),
  ]
);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
    // Client-generated key (e.g. a UUID created once per checkout attempt and
    // reused on retry) used to make order creation idempotent. Unique per
    // customer so a double-click/network retry returns the original order
    // instead of creating a duplicate.
    idempotencyKey: varchar("idempotency_key", { length: 100 }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("new"),
    // Customer snapshot
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
    // Address snapshot
    deliveryAddress: text("delivery_address").notNull(),
    deliveryCity: varchar("delivery_city", { length: 100 }),
    deliveryGovernorate: varchar("delivery_governorate", { length: 100 }),
    // Vehicle snapshot
    vehicleInfo: jsonb("vehicle_info"),
    // Financials (server-calculated)
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    // Payment
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    prepaidDiscountApplied: boolean("prepaid_discount_applied").notNull().default(false),
    // Other
    customerNotes: text("customer_notes"),
    couponCode: varchar("coupon_code", { length: 50 }),
    couponDiscount: decimal("coupon_discount", { precision: 10, scale: 2 }).default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_profile_id_idx").on(t.profileId),
    index("orders_status_idx").on(t.status),
    index("orders_order_number_idx").on(t.orderNumber),
    index("orders_created_at_idx").on(t.createdAt),
    uniqueIndex("orders_profile_idempotency_key_idx").on(t.profileId, t.idempotencyKey),
  ]
);

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    sellerId: uuid("seller_id").references(() => sellerProfiles.id, {
      onDelete: "set null",
    }),
    // Snapshot
    productNameAr: varchar("product_name_ar", { length: 255 }).notNull(),
    productNameEn: varchar("product_name_en", { length: 255 }).notNull(),
    productImageUrl: text("product_image_url"),
    partNumber: varchar("part_number", { length: 100 }),
    sellerName: varchar("seller_name", { length: 255 }),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
    quantity: integer("quantity").notNull(),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_seller_id_idx").on(t.sellerId),
  ]
);

// ─── Seller Orders ────────────────────────────────────────────────────────────

export const sellerOrders = pgTable(
  "seller_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => sellerProfiles.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("new"),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("seller_orders_order_id_idx").on(t.orderId),
    index("seller_orders_seller_id_idx").on(t.sellerId),
  ]
);

// ─── Order Status History ──────────────────────────────────────────────────────

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    notes: text("notes"),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    actorRole: userRoleEnum("actor_role"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("order_status_history_order_id_idx").on(t.orderId)]
);

// ─── Shipping ─────────────────────────────────────────────────────────────────

export const shipping = pgTable(
  "shipping",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" })
      .unique(),
    provider: varchar("provider", { length: 100 }),
    trackingNumber: varchar("tracking_number", { length: 200 }),
    fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
    estimatedDelivery: timestamp("estimated_delivery"),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),
    status: varchar("status", { length: 50 }).default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("shipping_order_id_idx").on(t.orderId)]
);

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    transactionRef: varchar("transaction_ref", { length: 255 }),
    notes: text("notes"),
    confirmedAt: timestamp("confirmed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("payments_order_id_idx").on(t.orderId)]
);

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    descriptionAr: text("description_ar"),
    discountType: varchar("discount_type", { length: 20 }).notNull().default("percent"),
    discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
    minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0"),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    titleAr: varchar("title_ar", { length: 255 }).notNull(),
    titleEn: varchar("title_en", { length: 255 }),
    bodyAr: text("body_ar"),
    bodyEn: text("body_en"),
    type: varchar("type", { length: 50 }).default("info"),
    isRead: boolean("is_read").notNull().default(false),
    link: text("link"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_profile_id_idx").on(t.profileId)]
);

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id").references(() => orderItems.id, {
      onDelete: "set null",
    }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    isApproved: boolean("is_approved").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("reviews_product_id_idx").on(t.productId),
    uniqueIndex("reviews_profile_product_idx").on(t.profileId, t.productId),
  ]
);

// ─── Support Tickets ──────────────────────────────────────────────────────────

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    subjectAr: varchar("subject_ar", { length: 255 }).notNull(),
    messageAr: text("message_ar").notNull(),
    status: varchar("status", { length: 30 }).notNull().default("open"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("support_tickets_profile_id_idx").on(t.profileId)]
);

// ─── Shipping Methods ─────────────────────────────────────────────────────────

export const shippingMethods = pgTable("shipping_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 100 }),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull().default("0"),
  estimatedDays: integer("estimated_days"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  sellerProfile: one(sellerProfiles, {
    fields: [profiles.id],
    references: [sellerProfiles.profileId],
  }),
  sellerApplications: many(sellerApplications),
  orders: many(orders),
  favorites: many(favorites),
  cart: one(carts, { fields: [profiles.id], references: [carts.profileId] }),
  customerCars: many(customerCars),
  notifications: many(notifications),
  reviews: many(reviews),
}));

export const sellerProfilesRelations = relations(sellerProfiles, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [sellerProfiles.profileId],
    references: [profiles.id],
  }),
  products: many(products),
  sellerOrders: many(sellerOrders),
  orderItems: many(orderItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  subcategories: many(subcategories),
  products: many(products),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(sellerProfiles, {
    fields: [products.sellerId],
    references: [sellerProfiles.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  images: many(productImages),
  fitments: many(vehicleFitments),
  favorites: many(favorites),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [orders.profileId],
    references: [profiles.id],
  }),
  orderItems: many(orderItems),
  sellerOrders: many(sellerOrders),
  statusHistory: many(orderStatusHistory),
  shipping: one(shipping, {
    fields: [orders.id],
    references: [shipping.orderId],
  }),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  seller: one(sellerProfiles, {
    fields: [orderItems.sellerId],
    references: [sellerProfiles.id],
  }),
}));

export const sellerOrdersRelations = relations(sellerOrders, ({ one }) => ({
  order: one(orders, {
    fields: [sellerOrders.orderId],
    references: [orders.id],
  }),
  seller: one(sellerProfiles, {
    fields: [sellerOrders.sellerId],
    references: [sellerProfiles.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [carts.profileId],
    references: [profiles.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const vehicleMakesRelations = relations(vehicleMakes, ({ many }) => ({
  models: many(vehicleModels),
  fitments: many(vehicleFitments),
}));

export const vehicleModelsRelations = relations(vehicleModels, ({ one, many }) => ({
  make: one(vehicleMakes, {
    fields: [vehicleModels.makeId],
    references: [vehicleMakes.id],
  }),
  generations: many(vehicleGenerations),
  fitments: many(vehicleFitments),
}));

export const vehicleGenerationsRelations = relations(vehicleGenerations, ({ one, many }) => ({
  model: one(vehicleModels, {
    fields: [vehicleGenerations.modelId],
    references: [vehicleModels.id],
  }),
  engines: many(vehicleEngines),
  fitments: many(vehicleFitments),
}));

export const vehicleEnginesRelations = relations(vehicleEngines, ({ one, many }) => ({
  generation: one(vehicleGenerations, {
    fields: [vehicleEngines.generationId],
    references: [vehicleGenerations.id],
  }),
  fitments: many(vehicleFitments),
}));

export const customerCarsRelations = relations(customerCars, ({ one }) => ({
  profile: one(profiles, {
    fields: [customerCars.profileId],
    references: [profiles.id],
  }),
  make: one(vehicleMakes, {
    fields: [customerCars.makeId],
    references: [vehicleMakes.id],
  }),
  model: one(vehicleModels, {
    fields: [customerCars.modelId],
    references: [vehicleModels.id],
  }),
}));
