// src/db/client.ts
import { getDb } from "./drizzle.js";
import { eq, and, or, sql, asc, desc } from "drizzle-orm";
import { 
  adminTable, brandTable, categoryTable, phoneTable, phoneImageTable, 
  phoneVariantTable, orderTable, orderItemTable, couponTable, reviewTable, 
  favoriteTable, contactMessageTable, blogTable, notificationTable, websiteSettingTable 
} from "./schema.js";
import crypto from "crypto";

// Prisma-compatible interface implemented over Drizzle ORM
export const prisma = {
  admin: {
    findUnique: async ({ where }: any) => {
      const db = getDb();
      if (where.username) {
        const [row] = await db.select().from(adminTable).where(eq(adminTable.username, where.username));
        return row || null;
      }
      if (where.id) {
        const [row] = await db.select().from(adminTable).where(eq(adminTable.id, where.id));
        return row || null;
      }
      return null;
    },
    count: async () => {
      const db = getDb();
      const rows = await db.select({ count: sql<number>`count(*)` }).from(adminTable);
      return Number(rows[0]?.count || 0);
    },
    create: async ({ data }: { data: { username: string; passwordHash: string } }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(adminTable).values({
        id,
        username: data.username,
        passwordHash: data.passwordHash,
      }).returning();
      return inserted;
    },
  },

  brand: {
    findMany: async (options?: any) => {
      const db = getDb();
      const brands = await db.select().from(brandTable);
      const result = [];
      for (const b of brands) {
        const countRows = await db.select({ count: sql<number>`count(*)` }).from(phoneTable).where(eq(phoneTable.brandId, b.id));
        result.push({
          ...b,
          _count: { phones: Number(countRows[0]?.count || 0) }
        });
      }
      return result;

    },
    create: async ({ data }: { data: { name: string; logoUrl?: string | null } }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(brandTable).values({
        id,
        name: data.name,
        logoUrl: data.logoUrl || null,
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: { name?: string; logoUrl?: string | null } }) => {
      const db = getDb();
      const [updated] = await db.update(brandTable).set({
        name: data.name,
        logoUrl: data.logoUrl || null,
      }).where(eq(brandTable.id, where.id)).returning();
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const db = getDb();
      // Application-level cascade delete for brand
      const phones = await db.select().from(phoneTable).where(eq(phoneTable.brandId, where.id));
      for (const p of phones) {
        await db.delete(phoneImageTable).where(eq(phoneImageTable.phoneId, p.id));
        await db.delete(phoneVariantTable).where(eq(phoneVariantTable.phoneId, p.id));
        await db.delete(reviewTable).where(eq(reviewTable.phoneId, p.id));
        await db.delete(favoriteTable).where(eq(favoriteTable.phoneId, p.id));
        await db.delete(orderItemTable).where(eq(orderItemTable.phoneId, p.id));
        await db.delete(phoneTable).where(eq(phoneTable.id, p.id));
      }
      await db.delete(brandTable).where(eq(brandTable.id, where.id));
      return { success: true };
    }
  },

  category: {
    findMany: async (options?: any) => {
      const db = getDb();
      let query = db.select().from(categoryTable);
      if (options?.where?.isHidden !== undefined) {
        query = query.where(eq(categoryTable.isHidden, options.where.isHidden)) as any;
      }
      const cats = await query.orderBy(asc(categoryTable.orderIndex));
      const result = [];
      for (const c of cats) {
        const countRows = await db.select({ count: sql<number>`count(*)` }).from(phoneTable).where(eq(phoneTable.categoryId, c.id));
        result.push({
          ...c,
          _count: { phones: Number(countRows[0]?.count || 0) }
        });
      }
      return result;
    },
    count: async () => {
      const db = getDb();
      const rows = await db.select({ count: sql<number>`count(*)` }).from(categoryTable);
      return Number(rows[0]?.count || 0);
    },
    create: async ({ data }: { data: { name: string; isHidden?: boolean; orderIndex?: number } }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(categoryTable).values({
        id,
        name: data.name,
        isHidden: !!data.isHidden,
        orderIndex: Number(data.orderIndex || 0),
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: { name?: string; isHidden?: boolean; orderIndex?: number } }) => {
      const db = getDb();
      const updateFields: any = {};
      if (data.name !== undefined) updateFields.name = data.name;
      if (data.isHidden !== undefined) updateFields.isHidden = !!data.isHidden;
      if (data.orderIndex !== undefined) updateFields.orderIndex = Number(data.orderIndex);

      const [updated] = await db.update(categoryTable).set(updateFields).where(eq(categoryTable.id, where.id)).returning();
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const db = getDb();
      // Application-level cascade delete for category
      const phones = await db.select().from(phoneTable).where(eq(phoneTable.categoryId, where.id));
      for (const p of phones) {
        await db.delete(phoneImageTable).where(eq(phoneImageTable.phoneId, p.id));
        await db.delete(phoneVariantTable).where(eq(phoneVariantTable.phoneId, p.id));
        await db.delete(reviewTable).where(eq(reviewTable.phoneId, p.id));
        await db.delete(favoriteTable).where(eq(favoriteTable.phoneId, p.id));
        await db.delete(orderItemTable).where(eq(orderItemTable.phoneId, p.id));
        await db.delete(phoneTable).where(eq(phoneTable.id, p.id));
      }
      await db.delete(categoryTable).where(eq(categoryTable.id, where.id));
      return { success: true };
    }
  },

  phone: {
    findMany: async (options: any = {}) => {
      const db = getDb();
      const { where, orderBy } = options;
      let allPhones = await db.select().from(phoneTable);
      
      // Filter in-memory for maximum reliability, handling nested conditions
      if (where) {
        if (where.brandId) {
          allPhones = allPhones.filter(p => p.brandId === where.brandId);
        }
        if (where.categoryId) {
          allPhones = allPhones.filter(p => p.categoryId === where.categoryId);
        }
        if (where.isFeatured !== undefined) {
          allPhones = allPhones.filter(p => p.isFeatured === where.isFeatured);
        }
        if (where.isFlashSale !== undefined) {
          allPhones = allPhones.filter(p => p.isFlashSale === where.isFlashSale);
        }
        if (where.price) {
          if (where.price.gte !== undefined) {
            allPhones = allPhones.filter(p => p.price >= where.price.gte);
          }
          if (where.price.lte !== undefined) {
            allPhones = allPhones.filter(p => p.price <= where.price.lte);
          }
        }
        if (where.OR) {
          const searchTerms = where.OR.map((o: any) => {
            const key = Object.keys(o)[0];
            return String(o[key].contains).toLowerCase();
          });
          allPhones = allPhones.filter(p => {
            return searchTerms.some((term: string) => 
              p.name.toLowerCase().includes(term) || 
              p.model.toLowerCase().includes(term) || 
              p.description.toLowerCase().includes(term)
            );
          });
        }
      }

      // Sort
      allPhones.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Hydrate relations
      const result = [];
      for (const p of allPhones) {
        const [brand] = await db.select().from(brandTable).where(eq(brandTable.id, p.brandId));
        const [category] = await db.select().from(categoryTable).where(eq(categoryTable.id, p.categoryId));
        const images = await db.select().from(phoneImageTable).where(eq(phoneImageTable.phoneId, p.id)).orderBy(asc(phoneImageTable.orderIndex));
        const variants = await db.select().from(phoneVariantTable).where(eq(phoneVariantTable.phoneId, p.id));
        const reviews = await db.select().from(reviewTable).where(eq(reviewTable.phoneId, p.id));

        result.push({
          ...p,
          brand,
          category,
          images,
          variants,
          reviews
        });
      }

      // Filter by variants.some if requested
      if (where?.variants?.some) {
        const { ram, storage } = where.variants.some;
        return result.filter(p => {
          return p.variants.some((v: any) => {
            if (ram && v.ram !== ram) return false;
            if (storage && v.storage !== storage) return false;
            return true;
          });
        });
      }

      return result;
    },

    findUnique: async ({ where }: any) => {
      const db = getDb();
      const [p] = await db.select().from(phoneTable).where(eq(phoneTable.id, where.id));
      if (!p) return null;
      
      const [brand] = await db.select().from(brandTable).where(eq(brandTable.id, p.brandId));
      const [category] = await db.select().from(categoryTable).where(eq(categoryTable.id, p.categoryId));
      const images = await db.select().from(phoneImageTable).where(eq(phoneImageTable.phoneId, p.id)).orderBy(asc(phoneImageTable.orderIndex));
      const variants = await db.select().from(phoneVariantTable).where(eq(phoneVariantTable.phoneId, p.id));
      const reviews = await db.select().from(reviewTable).where(eq(reviewTable.phoneId, p.id)).orderBy(desc(reviewTable.createdAt));

      return {
        ...p,
        brand,
        category,
        images,
        variants,
        reviews
      };
    },

    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(phoneTable).values({
        id,
        name: data.name,
        brandId: data.brandId,
        categoryId: data.categoryId,
        model: data.model,
        price: Number(data.price),
        discount: Number(data.discount || 0),
        stock: Number(data.stock || 0),
        description: data.description,
        warranty: data.warranty || "1 Year Store Warranty",
        isFeatured: !!data.isFeatured,
        isFlashSale: !!data.isFlashSale,
        videoUrl: data.videoUrl || null,
      }).returning();
      return inserted;
    },

    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = getDb();
      const updateFields: any = {};
      if (data.name !== undefined) updateFields.name = data.name;
      if (data.brandId !== undefined) updateFields.brandId = data.brandId;
      if (data.categoryId !== undefined) updateFields.categoryId = data.categoryId;
      if (data.model !== undefined) updateFields.model = data.model;
      if (data.price !== undefined) updateFields.price = Number(data.price);
      if (data.discount !== undefined) updateFields.discount = Number(data.discount);
      if (data.description !== undefined) updateFields.description = data.description;
      if (data.warranty !== undefined) updateFields.warranty = data.warranty;
      if (data.isFeatured !== undefined) updateFields.isFeatured = !!data.isFeatured;
      if (data.isFlashSale !== undefined) updateFields.isFlashSale = !!data.isFlashSale;
      if (data.videoUrl !== undefined) updateFields.videoUrl = data.videoUrl;

      // Handle prisma decrement operations
      if (data.stock !== undefined) {
        if (typeof data.stock === "object" && "decrement" in data.stock) {
          const [current] = await db.select().from(phoneTable).where(eq(phoneTable.id, where.id));
          updateFields.stock = current ? Math.max(0, current.stock - data.stock.decrement) : 0;
        } else {
          updateFields.stock = Number(data.stock);
        }
      }

      const [updated] = await db.update(phoneTable).set(updateFields).where(eq(phoneTable.id, where.id)).returning();
      return updated;
    },

    delete: async ({ where }: { where: { id: string } }) => {
      const db = getDb();
      // Application-level cascade delete for phone
      await db.delete(phoneImageTable).where(eq(phoneImageTable.phoneId, where.id));
      await db.delete(phoneVariantTable).where(eq(phoneVariantTable.phoneId, where.id));
      await db.delete(reviewTable).where(eq(reviewTable.phoneId, where.id));
      await db.delete(favoriteTable).where(eq(favoriteTable.phoneId, where.id));
      await db.delete(orderItemTable).where(eq(orderItemTable.phoneId, where.id));
      await db.delete(phoneTable).where(eq(phoneTable.id, where.id));
      return { success: true };
    }
  },

  phoneImage: {
    create: async ({ data }: { data: { phoneId: string; url: string; orderIndex?: number } }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(phoneImageTable).values({
        id,
        phoneId: data.phoneId,
        url: data.url,
        orderIndex: Number(data.orderIndex || 0),
      }).returning();
      return inserted;
    },
    deleteMany: async ({ where }: { where: { phoneId: string } }) => {
      const db = getDb();
      await db.delete(phoneImageTable).where(eq(phoneImageTable.phoneId, where.phoneId));
      return { count: 1 };
    }
  },

  phoneVariant: {
    findUnique: async ({ where }: any) => {
      const db = getDb();
      const [v] = await db.select().from(phoneVariantTable).where(eq(phoneVariantTable.id, where.id));
      return v || null;
    },
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(phoneVariantTable).values({
        id,
        phoneId: data.phoneId,
        color: data.color,
        storage: data.storage,
        ram: data.ram,
        priceModifier: Number(data.priceModifier || 0),
        stock: Number(data.stock || 0),
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = getDb();
      const updateFields: any = {};
      if (data.color !== undefined) updateFields.color = data.color;
      if (data.storage !== undefined) updateFields.storage = data.storage;
      if (data.ram !== undefined) updateFields.ram = data.ram;
      if (data.priceModifier !== undefined) updateFields.priceModifier = Number(data.priceModifier);

      // Handle decrement operations
      if (data.stock !== undefined) {
        if (typeof data.stock === "object" && "decrement" in data.stock) {
          const [current] = await db.select().from(phoneVariantTable).where(eq(phoneVariantTable.id, where.id));
          updateFields.stock = current ? Math.max(0, current.stock - data.stock.decrement) : 0;
        } else {
          updateFields.stock = Number(data.stock);
        }
      }

      const [updated] = await db.update(phoneVariantTable).set(updateFields).where(eq(phoneVariantTable.id, where.id)).returning();
      return updated;
    },
    deleteMany: async ({ where }: { where: { phoneId: string } }) => {
      const db = getDb();
      await db.delete(phoneVariantTable).where(eq(phoneVariantTable.phoneId, where.phoneId));
      return { count: 1 };
    }
  },

  coupon: {
    findMany: async () => {
      const db = getDb();
      return db.select().from(couponTable);
    },
    findUnique: async ({ where }: any) => {
      const db = getDb();
      if (where.code) {
        const [row] = await db.select().from(couponTable).where(eq(couponTable.code, where.code));
        return row || null;
      }
      if (where.id) {
        const [row] = await db.select().from(couponTable).where(eq(couponTable.id, where.id));
        return row || null;
      }
      return null;
    },
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(couponTable).values({
        id,
        code: String(data.code).toUpperCase().trim(),
        type: data.type,
        value: Number(data.value),
        expirationDate: new Date(data.expirationDate),
        usageLimit: Number(data.usageLimit || 0),
        usageCount: 0,
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = getDb();
      const updateFields: any = {};
      if (data.code !== undefined) updateFields.code = data.code;
      if (data.type !== undefined) updateFields.type = data.type;
      if (data.value !== undefined) updateFields.value = Number(data.value);
      if (data.expirationDate !== undefined) updateFields.expirationDate = new Date(data.expirationDate);
      if (data.usageLimit !== undefined) updateFields.usageLimit = Number(data.usageLimit);

      // Handle increment/decrement
      if (data.usageCount !== undefined) {
        if (typeof data.usageCount === "object" && "increment" in data.usageCount) {
          const [current] = await db.select().from(couponTable).where(eq(couponTable.id, where.id));
          updateFields.usageCount = current ? current.usageCount + data.usageCount.increment : 1;
        } else {
          updateFields.usageCount = Number(data.usageCount);
        }
      }

      const [updated] = await db.update(couponTable).set(updateFields).where(eq(couponTable.id, where.id)).returning();
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const db = getDb();
      await db.delete(couponTable).where(eq(couponTable.id, where.id));
      return { success: true };
    },
  },

  order: {
    findFirst: async ({ where }: any) => {
      const db = getDb();
      const [order] = await db.select().from(orderTable).where(
        and(
          eq(orderTable.orderNumber, where.orderNumber),
          eq(orderTable.phoneNumber, where.phoneNumber)
        )
      );
      if (!order) return null;
      const items = await db.select().from(orderItemTable).where(eq(orderItemTable.orderId, order.id));
      return { ...order, items };
    },
    findMany: async (options?: any) => {
      const db = getDb();
      const orders = await db.select().from(orderTable).orderBy(desc(orderTable.createdAt));
      const result = [];
      for (const o of orders) {
        const items = await db.select().from(orderItemTable).where(eq(orderItemTable.orderId, o.id));
        result.push({ ...o, items });
      }
      return result;
    },
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(orderTable).values({
        id,
        orderNumber: data.orderNumber,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        altPhoneNumber: data.altPhoneNumber || null,
        email: data.email || null,
        region: data.region,
        city: data.city,
        subCity: data.subCity,
        woreda: data.woreda,
        houseNumber: data.houseNumber || null,
        deliveryAddress: data.deliveryAddress,
        deliveryNotes: data.deliveryNotes || null,
        paymentMethod: data.paymentMethod,
        deliveryFee: Number(data.deliveryFee || 0),
        total: Number(data.total),
        status: data.status || "Pending",
        couponCode: data.couponCode || null,
        discountApplied: Number(data.discountApplied || 0),
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = getDb();
      const [updated] = await db.update(orderTable).set(data).where(eq(orderTable.id, where.id)).returning();
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const db = getDb();
      await db.delete(orderTable).where(eq(orderTable.id, where.id));
      return { success: true };
    }
  },

  orderItem: {
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(orderItemTable).values({
        id,
        orderId: data.orderId,
        phoneId: data.phoneId,
        variantId: data.variantId || null,
        name: data.name,
        color: data.color || null,
        storage: data.storage || null,
        ram: data.ram || null,
        price: Number(data.price),
        quantity: Number(data.quantity || 1),
      }).returning();
      return inserted;
    },
  },

  review: {
    findMany: async (options: any = {}) => {
      const db = getDb();
      const { where, orderBy } = options;
      let query = db.select().from(reviewTable);
      if (where?.phoneId) {
        query = query.where(eq(reviewTable.phoneId, where.phoneId)) as any;
      }
      return query.orderBy(desc(reviewTable.createdAt));
    },
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(reviewTable).values({
        id,
        phoneId: data.phoneId,
        userName: data.userName,
        rating: Number(data.rating),
        comment: data.comment,
      }).returning();
      return inserted;
    },
  },

  contactMessage: {
    findMany: async (options?: any) => {
      const db = getDb();
      return db.select().from(contactMessageTable).orderBy(desc(contactMessageTable.createdAt));
    },
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(contactMessageTable).values({
        id,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: data.message,
        isRead: false,
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = getDb();
      const [updated] = await db.update(contactMessageTable).set(data).where(eq(contactMessageTable.id, where.id)).returning();
      return updated;
    }
  },

  blog: {
    findMany: async (options?: any) => {
      const db = getDb();
      return db.select().from(blogTable).orderBy(desc(blogTable.createdAt));
    },
    findUnique: async ({ where }: any) => {
      const db = getDb();
      const [row] = await db.select().from(blogTable).where(eq(blogTable.id, where.id));
      return row || null;
    },
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(blogTable).values({
        id,
        title: data.title,
        content: data.content,
        category: data.category,
        imageUrl: data.imageUrl || null,
        author: data.author || "Admin",
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = getDb();
      const [updated] = await db.update(blogTable).set(data).where(eq(blogTable.id, where.id)).returning();
      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const db = getDb();
      await db.delete(blogTable).where(eq(blogTable.id, where.id));
      return { success: true };
    }
  },

  notification: {
    findMany: async (options?: any) => {
      const db = getDb();
      return db.select().from(notificationTable).orderBy(desc(notificationTable.createdAt));
    },
    create: async ({ data }: { data: any }) => {
      const db = getDb();
      const id = crypto.randomUUID();
      const [inserted] = await db.insert(notificationTable).values({
        id,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
      }).returning();
      return inserted;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const db = getDb();
      const [updated] = await db.update(notificationTable).set(data).where(eq(notificationTable.id, where.id)).returning();
      return updated;
    }
  },

  websiteSetting: {
    findMany: async () => {
      const db = getDb();
      return db.select().from(websiteSettingTable);
    },
    upsert: async ({ where, update, create }: { where: { key: string }; update: { value: string }; create: { key: string; value: string } }) => {
      const db = getDb();
      const [existing] = await db.select().from(websiteSettingTable).where(eq(websiteSettingTable.key, where.key));
      if (existing) {
        await db.update(websiteSettingTable).set({ value: update.value }).where(eq(websiteSettingTable.key, where.key));
      } else {
        await db.insert(websiteSettingTable).values({
          id: crypto.randomUUID(),
          key: create.key,
          value: create.value,
        });
      }
      return { success: true };
    }
  },

  // Mock prisma.$transaction using simple direct execution
  $transaction: async (callback: (tx: any) => Promise<any>) => {
    // Provide the same prisma bridge inside transaction
    return callback(prisma);
  }
};
