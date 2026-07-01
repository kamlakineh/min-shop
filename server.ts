// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { prisma } from "./src/db/client.js";
import { seedDatabase, hashPassword } from "./src/db/seed.js";
import { initDatabase } from "./src/db/drizzle.js";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./src/uploadthing.js";

// In-memory admin tokens for robust authentication without external library friction
const ADMIN_TOKENS = new Set<string>();

const app = express();
const PORT = 3000;

app.use(express.json());

// UploadThing integration for image upload
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: uploadRouter,
  }),
);

// Auth Middleware
function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized admin access." });
  }
  const token = authHeader.substring(7);
  if (!ADMIN_TOKENS.has(token)) {
    return res.status(401).json({ error: "Invalid session or token expired." });
  }
  next();
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const hashed = hashPassword(password);
    if (admin.passwordHash !== hashed) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = `admin_session_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    ADMIN_TOKENS.add(token);

    res.json({ token, username: admin.username });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    ADMIN_TOKENS.delete(token);
  }
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ authenticated: false });
  }
  const token = authHeader.substring(7);
  if (ADMIN_TOKENS.has(token)) {
    return res.json({ authenticated: true, username: "admin" });
  }
  res.status(401).json({ authenticated: false });
});

// ----------------------------------------------------
// BRANDS ENDPOINTS
// ----------------------------------------------------
app.get("/api/brands", async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: { _count: { select: { phones: true } } },
    });
    res.json(brands);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/brands", requireAdmin, async (req, res) => {
  const { name, logoUrl } = req.body;
  try {
    const brand = await prisma.brand.create({ data: { name, logoUrl } });
    res.status(201).json(brand);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/brands/:id", requireAdmin, async (req, res) => {
  const { name, logoUrl } = req.body;
  try {
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: { name, logoUrl },
    });
    res.json(brand);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/brands/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// CATEGORIES ENDPOINTS
// ----------------------------------------------------
app.get("/api/categories", async (req, res) => {
  const includeHidden = req.query.admin === "true";
  try {
    const categories = await prisma.category.findMany({
      where: includeHidden ? undefined : { isHidden: false },
      orderBy: { orderIndex: "asc" },
      include: { _count: { select: { phones: true } } },
    });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/categories", requireAdmin, async (req, res) => {
  const { name, isHidden, orderIndex } = req.body;
  try {
    const category = await prisma.category.create({
      data: { name, isHidden: !!isHidden, orderIndex: Number(orderIndex || 0) },
    });
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/categories/:id", requireAdmin, async (req, res) => {
  const { name, isHidden, orderIndex } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        isHidden: isHidden !== undefined ? !!isHidden : undefined,
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined,
      },
    });
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PHONES (PRODUCTS) ENDPOINTS
// ----------------------------------------------------
app.get("/api/phones", async (req, res) => {
  const {
    search,
    brandId,
    categoryId,
    minPrice,
    maxPrice,
    ram,
    storage,
    isFeatured,
    isFlashSale,
    minRating,
  } = req.query;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { model: { contains: String(search) } },
      { description: { contains: String(search) } },
    ];
  }

  if (brandId) where.brandId = String(brandId);
  if (categoryId) where.categoryId = String(categoryId);
  if (isFeatured === "true") where.isFeatured = true;
  if (isFlashSale === "true") where.isFlashSale = true;

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (ram) {
    where.variants = {
      some: { ram: String(ram) },
    };
  }

  if (storage) {
    where.variants = {
      some: { storage: String(storage) },
    };
  }

  try {
    const phones = await prisma.phone.findMany({
      where,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { orderIndex: "asc" } },
        variants: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Simple filter by rating in memory since sqlite is small
    let filtered = phones;
    if (minRating) {
      filtered = phones.filter((phone) => {
        if (!phone.reviews.length) return false;
        const avg =
          phone.reviews.reduce((acc, r) => acc + r.rating, 0) /
          phone.reviews.length;
        return avg >= Number(minRating);
      });
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/phones/:id", async (req, res) => {
  try {
    const phone = await prisma.phone.findUnique({
      where: { id: req.params.id },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { orderIndex: "asc" } },
        variants: true,
        reviews: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!phone) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(phone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/phones", requireAdmin, async (req, res) => {
  const {
    name,
    brandId,
    categoryId,
    model,
    price,
    discount,
    stock,
    description,
    warranty,
    isFeatured,
    isFlashSale,
    videoUrl,
    images, // Array of image URLs
    variants, // Array of variant objects { color, storage, ram, priceModifier, stock }
  } = req.body;

  try {
    const phone = await prisma.phone.create({
      data: {
        name,
        brandId,
        categoryId,
        model,
        price: Number(price),
        discount: Number(discount || 0),
        stock: Number(stock || 0),
        description,
        warranty: warranty || "1 Year Store Warranty",
        isFeatured: !!isFeatured,
        isFlashSale: !!isFlashSale,
        videoUrl,
      },
    });

    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        await prisma.phoneImage.create({
          data: { phoneId: phone.id, url: images[i], orderIndex: i },
        });
      }
    }

    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await prisma.phoneVariant.create({
          data: {
            phoneId: phone.id,
            color: variant.color,
            storage: variant.storage,
            ram: variant.ram,
            priceModifier: Number(variant.priceModifier || 0),
            stock: Number(variant.stock || 0),
          },
        });
      }
    }

    res.status(201).json(phone);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/phones/:id", requireAdmin, async (req, res) => {
  const {
    name,
    brandId,
    categoryId,
    model,
    price,
    discount,
    stock,
    description,
    warranty,
    isFeatured,
    isFlashSale,
    videoUrl,
    images,
    variants,
  } = req.body;

  try {
    await prisma.phone.update({
      where: { id: req.params.id },
      data: {
        name,
        brandId,
        categoryId,
        model,
        price: price !== undefined ? Number(price) : undefined,
        discount: discount !== undefined ? Number(discount) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        description,
        warranty,
        isFeatured: isFeatured !== undefined ? !!isFeatured : undefined,
        isFlashSale: isFlashSale !== undefined ? !!isFlashSale : undefined,
        videoUrl,
      },
    });

    if (images && Array.isArray(images)) {
      // Re-upload images: delete old and create new
      await prisma.phoneImage.deleteMany({ where: { phoneId: req.params.id } });
      for (let i = 0; i < images.length; i++) {
        await prisma.phoneImage.create({
          data: { phoneId: req.params.id, url: images[i], orderIndex: i },
        });
      }
    }

    if (variants && Array.isArray(variants)) {
      await prisma.phoneVariant.deleteMany({
        where: { phoneId: req.params.id },
      });
      for (const variant of variants) {
        await prisma.phoneVariant.create({
          data: {
            phoneId: req.params.id,
            color: variant.color,
            storage: variant.storage,
            ram: variant.ram,
            priceModifier: Number(variant.priceModifier || 0),
            stock: Number(variant.stock || 0),
          },
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/phones/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.phone.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// ORDERS ENDPOINTS (CHECKOUT)
// ----------------------------------------------------
app.post("/api/orders", async (req, res) => {
  const {
    fullName,
    phoneNumber,
    altPhoneNumber,
    email,
    region,
    city,
    subCity,
    woreda,
    houseNumber,
    deliveryAddress,
    deliveryNotes,
    paymentMethod,
    deliveryFee,
    couponCode,
    items, // Array of { phoneId, variantId, quantity }
  } = req.body;

  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Verify products and calculate total
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const phone = await prisma.phone.findUnique({
        where: { id: item.phoneId },
        include: { variants: true },
      });
      if (!phone) {
        return res
          .status(404)
          .json({ error: `Product ${item.phoneId} not found` });
      }

      let itemPrice = phone.price * (1 - phone.discount / 100);
      let variantColor = null;
      let variantStorage = null;
      let variantRam = null;

      if (item.variantId) {
        const variant = phone.variants.find((v) => v.id === item.variantId);
        if (variant) {
          itemPrice += variant.priceModifier;
          variantColor = variant.color;
          variantStorage = variant.storage;
          variantRam = variant.ram;

          if (variant.stock < item.quantity) {
            return res
              .status(400)
              .json({
                error: `Insufficient stock for ${phone.name} (${variant.color})`,
              });
          }
        }
      } else if (phone.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Insufficient stock for ${phone.name}` });
      }

      subtotal += itemPrice * item.quantity;
      validatedItems.push({
        phoneId: phone.id,
        variantId: item.variantId || null,
        name: phone.name,
        color: variantColor,
        storage: variantStorage,
        ram: variantRam,
        price: itemPrice,
        quantity: item.quantity,
      });
    }

    // Handle Coupons
    let discountApplied = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (coupon) {
        const now = new Date();
        if (
          coupon.expirationDate > now &&
          (coupon.usageLimit === 0 || coupon.usageCount < coupon.usageLimit)
        ) {
          if (coupon.type === "percentage") {
            discountApplied = subtotal * (coupon.value / 100);
          } else {
            discountApplied = coupon.value;
          }
          // Increment usage count
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    const fee = Number(deliveryFee || 0);
    const finalTotal = Math.max(0, subtotal - discountApplied) + fee;
    const orderNumber = `ETH-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Order inside transactions
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const o = await tx.order.create({
        data: {
          orderNumber,
          fullName,
          phoneNumber,
          altPhoneNumber,
          email,
          region,
          city,
          subCity,
          woreda,
          houseNumber,
          deliveryAddress,
          deliveryNotes,
          paymentMethod,
          deliveryFee: fee,
          total: finalTotal,
          status: "Pending",
          couponCode: couponCode || null,
          discountApplied,
        },
      });

      // 2. Create items & deduct stock
      for (const validated of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: o.id,
            phoneId: validated.phoneId,
            variantId: validated.variantId,
            name: validated.name,
            color: validated.color,
            storage: validated.storage,
            ram: validated.ram,
            price: validated.price,
            quantity: validated.quantity,
          },
        });

        // Deduct variant stock or main stock
        if (validated.variantId) {
          await tx.phoneVariant.update({
            where: { id: validated.variantId },
            data: { stock: { decrement: validated.quantity } },
          });
        } else {
          await tx.phone.update({
            where: { id: validated.phoneId },
            data: { stock: { decrement: validated.quantity } },
          });
        }
      }

      return o;
    });

    // 3. Low stock alerts notification
    for (const validated of validatedItems) {
      if (validated.variantId) {
        const v = await prisma.phoneVariant.findUnique({
          where: { id: validated.variantId },
        });
        if (v && v.stock <= 2) {
          await prisma.notification.create({
            data: {
              type: "low_stock",
              title: "Low Variant Stock Alert!",
              message: `Variant ${validated.color} (${validated.storage}) of ${validated.name} is low on stock (${v.stock} left).`,
            },
          });
        }
      } else {
        const p = await prisma.phone.findUnique({
          where: { id: validated.phoneId },
        });
        if (p && p.stock <= 2) {
          await prisma.notification.create({
            data: {
              type: "low_stock",
              title: "Low Product Stock Alert!",
              message: `${validated.name} is low on stock (${p.stock} left).`,
            },
          });
        }
      }
    }

    // 4. Create admin notification
    await prisma.notification.create({
      data: {
        type: "new_order",
        title: "New Order Received",
        message: `Order ${order.orderNumber} placed by ${order.fullName} for a total of ${order.total} ETB.`,
      },
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/track", async (req, res) => {
  const { phone, orderNumber } = req.query;
  try {
    if (!phone || !orderNumber) {
      return res
        .status(400)
        .json({ error: "Phone number and Order number are required" });
    }
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: String(orderNumber).trim(),
        phoneNumber: String(phone).trim(),
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin list all orders
app.get("/api/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin update order status
app.put("/api/orders/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin delete order
app.delete("/api/orders/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// COUPONS ENDPOINTS
// ----------------------------------------------------
app.get("/api/coupons", requireAdmin, async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany();
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/coupons", requireAdmin, async (req, res) => {
  const { code, type, value, expirationDate, usageLimit } = req.body;
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: String(code).toUpperCase().trim(),
        type,
        value: Number(value),
        expirationDate: new Date(expirationDate),
        usageLimit: Number(usageLimit || 0),
        usageCount: 0,
      },
    });
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/coupons/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/coupons/validate", async (req, res) => {
  const { code } = req.body;
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase().trim() },
    });

    if (!coupon) {
      return res.status(404).json({ error: "Invalid coupon code" });
    }

    const now = new Date();
    if (new Date(coupon.expirationDate) < now) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res
        .status(400)
        .json({ error: "Coupon usage limit has been reached" });
    }

    res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// REVIEWS ENDPOINTS
// ----------------------------------------------------
app.get("/api/phones/:id/reviews", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { phoneId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/phones/:id/reviews", async (req, res) => {
  const { userName, rating, comment } = req.body;
  try {
    const review = await prisma.review.create({
      data: {
        phoneId: req.params.id,
        userName,
        rating: Number(rating),
        comment,
      },
    });
    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// CONTACT MESSAGES ENDPOINTS
// ----------------------------------------------------
app.post("/api/contact", async (req, res) => {
  const { name, phone, email, message } = req.body;
  try {
    const msg = await prisma.contactMessage.create({
      data: { name, phone, email, message },
    });

    // Notify admin
    await prisma.notification.create({
      data: {
        type: "contact_message",
        title: "New Contact Message",
        message: `Message from ${name} (${phone}): "${message.substring(0, 50)}..."`,
      },
    });

    res.status(201).json({ success: true, message: msg });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/contact", requireAdmin, async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/contact/:id/read", requireAdmin, async (req, res) => {
  try {
    const msg = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(msg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// BLOGS ENDPOINTS
// ----------------------------------------------------
app.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(blogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/blogs/:id", async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
    });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/blogs", requireAdmin, async (req, res) => {
  const { title, content, category, imageUrl, author } = req.body;
  try {
    const blog = await prisma.blog.create({
      data: { title, content, category, imageUrl, author: author || "Admin" },
    });
    res.status(201).json(blog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/blogs/:id", requireAdmin, async (req, res) => {
  const { title, content, category, imageUrl, author } = req.body;
  try {
    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data: { title, content, category, imageUrl, author },
    });
    res.json(blog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/blogs/:id", requireAdmin, async (req, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// NOTIFICATIONS ENDPOINTS
// ----------------------------------------------------
app.get("/api/notifications", requireAdmin, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/notifications/:id/read", requireAdmin, async (req, res) => {
  try {
    const notif = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notif);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// WEBSITE SETTINGS ENDPOINTS
// ----------------------------------------------------
app.get("/api/settings", async (req, res) => {
  try {
    const list = await prisma.websiteSetting.findMany();
    const settings: Record<string, string> = {};
    for (const item of list) {
      settings[item.key] = item.value;
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/settings", requireAdmin, async (req, res) => {
  const data = req.body; // Key-value object
  try {
    for (const [key, value] of Object.entries(data)) {
      await prisma.websiteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// VITE SETUP & STATIC SERVER
// ----------------------------------------------------
async function startServer() {
  // Auto-initialize tables in Neon!
  try {
    await initDatabase();
  } catch (err) {
    console.error("Failed to initialize database tables:", err);
  }

  // Auto-seed on startup!
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to seed database automatically:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ethiopian Phone Shop running on http://localhost:${PORT}`);
  });
}

startServer();
