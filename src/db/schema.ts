// src/db/schema.ts
import { pgTable, text, integer, boolean, doublePrecision, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Utility for generating random IDs (similar to Prisma UUID string)
const uuid = () => text().primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));

export const adminTable = pgTable("admin", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brandTable = pgTable("brand", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
});

export const categoryTable = pgTable("category", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  name: text("name").notNull().unique(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
});

export const phoneTable = pgTable("phone", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  name: text("name").notNull(),
  brandId: text("brand_id").notNull().references(() => brandTable.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull().references(() => categoryTable.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  price: doublePrecision("price").notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  stock: integer("stock").default(0).notNull(),
  description: text("description").notNull(),
  warranty: text("warranty").default("1 Year").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isFlashSale: boolean("is_flash_sale").default(false).notNull(),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const phoneImageTable = pgTable("phone_image", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  phoneId: text("phone_id").notNull().references(() => phoneTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  orderIndex: integer("order_index").default(0).notNull(),
});

export const phoneVariantTable = pgTable("phone_variant", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  phoneId: text("phone_id").notNull().references(() => phoneTable.id, { onDelete: "cascade" }),
  color: text("color").notNull(),
  storage: text("storage").notNull(),
  ram: text("ram").notNull(),
  priceModifier: doublePrecision("price_modifier").default(0).notNull(),
  stock: integer("stock").default(0).notNull(),
});

export const orderTable = pgTable("order", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  orderNumber: text("order_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  altPhoneNumber: text("alt_phone_number"),
  email: text("email"),
  region: text("region").notNull(),
  city: text("city").notNull(),
  subCity: text("sub_city").notNull(),
  woreda: text("woreda").notNull(),
  houseNumber: text("house_number"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryNotes: text("delivery_notes"),
  paymentMethod: text("payment_method").notNull(),
  deliveryFee: doublePrecision("delivery_fee").default(0).notNull(),
  total: doublePrecision("total").notNull(),
  status: text("status").default("Pending").notNull(),
  couponCode: text("coupon_code"),
  discountApplied: doublePrecision("discount_applied").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItemTable = pgTable("order_item", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  orderId: text("order_id").notNull().references(() => orderTable.id, { onDelete: "cascade" }),
  phoneId: text("phone_id").notNull().references(() => phoneTable.id, { onDelete: "cascade" }),
  variantId: text("variant_id"),
  name: text("name").notNull(),
  color: text("color"),
  storage: text("storage"),
  ram: text("ram"),
  price: doublePrecision("price").notNull(),
  quantity: integer("quantity").default(1).notNull(),
});

export const couponTable = pgTable("coupon", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  value: doublePrecision("value").notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  usageLimit: integer("usage_limit").default(0).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
});

export const reviewTable = pgTable("review", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  phoneId: text("phone_id").notNull().references(() => phoneTable.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favoriteTable = pgTable("favorite", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  phoneId: text("phone_id").notNull().references(() => phoneTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
});

export const contactMessageTable = pgTable("contact_message", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
});

export const blogTable = pgTable("blog", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  author: text("author").default("Admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationTable = pgTable("notification", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const websiteSettingTable = pgTable("website_setting", {
  id: text("id").primaryKey().$defaultFn(() => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Relational Definitions for Drizzle
export const brandRelations = relations(brandTable, ({ many }) => ({
  phones: many(phoneTable),
}));

export const categoryRelations = relations(categoryTable, ({ many }) => ({
  phones: many(phoneTable),
}));

export const phoneRelations = relations(phoneTable, ({ one, many }) => ({
  brand: one(brandTable, {
    fields: [phoneTable.brandId],
    references: [brandTable.id],
  }),
  category: one(categoryTable, {
    fields: [phoneTable.categoryId],
    references: [categoryTable.id],
  }),
  images: many(phoneImageTable),
  variants: many(phoneVariantTable),
  reviews: many(reviewTable),
  orderItems: many(orderItemTable),
  favorites: many(favoriteTable),
}));

export const phoneImageRelations = relations(phoneImageTable, ({ one }) => ({
  phone: one(phoneTable, {
    fields: [phoneImageTable.phoneId],
    references: [phoneTable.id],
  }),
}));

export const phoneVariantRelations = relations(phoneVariantTable, ({ one }) => ({
  phone: one(phoneTable, {
    fields: [phoneVariantTable.phoneId],
    references: [phoneTable.id],
  }),
}));

export const orderRelations = relations(orderTable, ({ many }) => ({
  items: many(orderItemTable),
}));

export const orderItemRelations = relations(orderItemTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderItemTable.orderId],
    references: [orderTable.id],
  }),
  phone: one(phoneTable, {
    fields: [orderItemTable.phoneId],
    references: [phoneTable.id],
  }),
}));

export const reviewRelations = relations(reviewTable, ({ one }) => ({
  phone: one(phoneTable, {
    fields: [reviewTable.phoneId],
    references: [phoneTable.id],
  }),
}));

export const favoriteRelations = relations(favoriteTable, ({ one }) => ({
  phone: one(phoneTable, {
    fields: [favoriteTable.phoneId],
    references: [phoneTable.id],
  }),
}));
