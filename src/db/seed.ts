// src/db/seed.ts
import { getDb } from "./drizzle.js";
import { 
  adminTable, brandTable, categoryTable, phoneTable, phoneImageTable, 
  phoneVariantTable, couponTable, reviewTable, websiteSettingTable, blogTable 
} from "./schema.js";
import crypto from "crypto";
import { eq, sql } from "drizzle-orm";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function seedDatabase() {
  const db = getDb();
  console.log("Checking if database seeding is required...");

  // Check if admin exists
  const adminRows = await db.select({ count: sql<number>`count(*)` }).from(adminTable);
  const adminCount = Number(adminRows[0]?.count || 0);
  
  if (adminCount === 0) {
    console.log("Seeding Admin User...");
    const adminId = crypto.randomUUID();
    await db.insert(adminTable).values({
      id: adminId,
      username: "admin",
      passwordHash: hashPassword("adminpassword"),
    });
    console.log("Created admin user: admin");
  }
  // 2. Create Categories
  const categories: Record<string, any> = {};
  const existingCats = await db.select().from(categoryTable);
  if (existingCats.length === 0) {
    console.log("Seeding initial categories...");
    const categoriesData = [
      { name: "Smartphones", orderIndex: 0 },
      { name: "Apple iPhone", orderIndex: 1 },
      { name: "Samsung Galaxy", orderIndex: 2 },
      { name: "Xiaomi", orderIndex: 3 },
      { name: "Tecno", orderIndex: 4 },
      { name: "Infinix", orderIndex: 5 },
      { name: "Realme", orderIndex: 6 },
      { name: "OnePlus", orderIndex: 7 },
      { name: "Google Pixel", orderIndex: 8 },
      { name: "Accessories", orderIndex: 9 },
      { name: "Chargers & Cables", orderIndex: 10 },
      { name: "Audio (Earbuds/Headphones)", orderIndex: 11 },
      { name: "Smart Watches", orderIndex: 12 },
      { name: "Power Banks", orderIndex: 13 },
    ];

    for (const cat of categoriesData) {
      const id = crypto.randomUUID();
      await db.insert(categoryTable).values({
        id,
        name: cat.name,
        orderIndex: cat.orderIndex,
        isHidden: false,
      });
      categories[cat.name] = { id, ...cat };
    }
    console.log(`Created ${Object.keys(categories).length} categories.`);
  } else {
    console.log("Categories already exist. Skipping category seeding.");
    for (const cat of existingCats) {
      categories[cat.name] = cat;
    }
  }

  // 3. Create Brands
  const brands: Record<string, any> = {};
  const existingBrands = await db.select().from(brandTable);
  if (existingBrands.length === 0) {
    console.log("Seeding initial brands...");
    const brandsData = [
      { name: "Apple", logoUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100&h=100&fit=crop&q=80" },
      { name: "Samsung", logoUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100&h=100&fit=crop&q=80" },
      { name: "Xiaomi", logoUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop&q=80" },
      { name: "Tecno", logoUrl: "" },
      { name: "Infinix", logoUrl: "" },
      { name: "Realme", logoUrl: "" },
      { name: "OnePlus", logoUrl: "" },
      { name: "Google", logoUrl: "" },
      { name: "Huawei", logoUrl: "" },
      { name: "Anker", logoUrl: "" },
    ];

    for (const brand of brandsData) {
      const id = crypto.randomUUID();
      await db.insert(brandTable).values({
        id,
        name: brand.name,
        logoUrl: brand.logoUrl,
      });
      brands[brand.name] = { id, ...brand };
    }
    console.log(`Created ${Object.keys(brands).length} brands.`);
  } else {
    console.log("Brands already exist. Skipping brand seeding.");
    for (const b of existingBrands) {
      brands[b.name] = b;
    }
  }

  // 4. Create Coupons
  const couponRows = await db.select({ count: sql<number>`count(*)` }).from(couponTable);
  if (Number(couponRows[0]?.count || 0) === 0) {
    console.log("Seeding initial promotional coupons...");
    await db.insert(couponTable).values([
      {
        id: crypto.randomUUID(),
        code: "WELCOME10",
        type: "percentage",
        value: 10,
        expirationDate: new Date("2028-12-31T23:59:59Z"),
        usageLimit: 100,
        usageCount: 0,
      },
      {
        id: crypto.randomUUID(),
        code: "ETHIONEW",
        type: "fixed",
        value: 500,
        expirationDate: new Date("2028-12-31T23:59:59Z"),
        usageLimit: 50,
        usageCount: 0,
      },
    ]);
    console.log("Created promotional coupons.");
  }

  // 5. Create Website Settings
  const settingRows = await db.select({ count: sql<number>`count(*)` }).from(websiteSettingTable);
  if (Number(settingRows[0]?.count || 0) === 0) {
    console.log("Seeding initial website settings...");
    const settings = {
      storeName: "EthioPhone Premium Mobile",
      logoText: "ETHIOPhone",
      email: "info@ethiophone.com",
      phone: "+251911223344",
      altPhone: "+251922334455",
      telegram: "@ethiophone_shop",
      whatsapp: "+251911223344",
      facebook: "ethiophoneshop",
      instagram: "ethiophone.shop",
      tiktok: "@ethiophone.shop",
      deliveryFee: "150",
      deliveryAreas: "Addis Ababa (Bole, Kirkos, Lideta, Yeka, Nifas Silk, Arada, Gullele, Kolfe Keranio, Akaki Kality, Lemi Kura)",
      warrantyInfo: "All devices come with a 1-year local warranty for hardware and software issues, subject to terms and conditions.",
      paymentMethods: JSON.stringify(["chapa", "cod", "bank_transfer"]),
      businessHours: "Monday - Saturday: 8:30 AM - 7:30 PM, Sunday: 10:00 AM - 4:00 PM",
      officeAddress: "Bole Road, Dembel City Center, 3rd Floor, Addis Ababa, Ethiopia",
    };

    for (const [key, value] of Object.entries(settings)) {
      await db.insert(websiteSettingTable).values({
        id: crypto.randomUUID(),
        key,
        value,
      });
    }
    console.log("Created website settings.");
  }

  // 6. Create Blog Posts
  const blogRows = await db.select({ count: sql<number>`count(*)` }).from(blogTable);
  if (Number(blogRows[0]?.count || 0) === 0) {
    console.log("Seeding initial blog posts...");
    await db.insert(blogTable).values([
      {
        id: crypto.randomUUID(),
        title: "iPhone 15 Pro vs Samsung Galaxy S24 Ultra: The Ultimate Battle",
        content: `Choosing between Apple's flagship and Samsung's beast is tougher than ever in 2026. The S24 Ultra brings a massive 200MP camera, flat glass back, and the powerful Snapdragon 8 Gen 3 with integrated Galaxy AI features. Meanwhile, the iPhone 15 Pro features a gorgeous Titanium finish, standard USB Type-C, and the blistering fast A17 Pro chip. 

If you are looking for pure customizability, deep camera zoom (5x optical and 100x digital), and the versatile S-Pen, the Galaxy S24 Ultra is the absolute winner. On the other hand, if you prefer seamless videography, consistent software support, and the prestigious Apple ecosystem, the iPhone 15 Pro remains unmatched. 

Both are available now at EthioPhone Dembel branch with full 1-year local warranty and fast delivery across Addis Ababa.`,
        category: "Phone Comparisons",
        imageUrl: "https://images.unsplash.com/photo-1605787020600-b9ebd5df1d07?w=600&h=400&fit=crop&q=80",
        author: "Chief Editor, EthioPhone",
      },
      {
        id: crypto.randomUUID(),
        title: "Top 5 Budget Smartphones in Ethiopia under 20,000 Birr",
        content: `Looking for a great phone that doesn't break the bank? Ethiopia's smartphone market has seen amazing budget contenders recently from Tecno, Infinix, and Xiaomi. Here are our top picks:

1. Tecno Spark 20 Pro: With a 120Hz display and 108MP camera, this is an incredible budget performer.
2. Infinix Hot 40 Pro: Packing a 5000mAh battery and Helio G99 processor, it's perfect for casual gaming.
3. Xiaomi Redmi 13C: The king of reliable, durable entry-level phones with an ultra-long battery life.
4. Realme C67: Gorgeous design, dual speakers, and fantastic sunlight-readable display.
5. Tecno Pop 8: The absolute lowest-priced phone that still handles Telegram and basic apps beautifully.

Visit us today to test these budget champions yourself!`,
        category: "Buying Guides",
        imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=400&fit=crop&q=80",
        author: "Sales Expert, EthioPhone",
      },
    ]);
    console.log("Created initial blog posts.");
  }

  // 7. Create Phones & Accessories
  const phoneRows = await db.select({ count: sql<number>`count(*)` }).from(phoneTable);
  if (Number(phoneRows[0]?.count || 0) === 0) {
    console.log("Seeding initial phones and accessories...");
    const phonesList = [
    {
      name: "Apple iPhone 15 Pro Max",
      brandName: "Apple",
      categoryName: "Apple iPhone",
      model: "A3106",
      price: 185000,
      discount: 5,
      stock: 12,
      description: "Experience the ultimate iPhone with titanium design, revolutionary A17 Pro chip, customizable Action button, and the most powerful iPhone camera system ever with 5x telephoto lens.",
      warranty: "1 Year Store Warranty",
      isFeatured: true,
      isFlashSale: false,
      videoUrl: "https://www.youtube.com/watch?v=xqyUdNxWn3w",
      images: [
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop&q=80",
        "https://images.unsplash.com/photo-1695048133177-f2736149f69b?w=600&h=600&fit=crop&q=80",
      ],
      variants: [
        { color: "Natural Titanium", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 5 },
        { color: "Black Titanium", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 4 },
        { color: "Natural Titanium", storage: "512GB", ram: "8GB", priceModifier: 25000, stock: 3 },
      ],
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      brandName: "Samsung",
      categoryName: "Samsung Galaxy",
      model: "SM-S928B",
      price: 175000,
      discount: 8,
      stock: 8,
      description: "Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility starting with the most important device in your life. Your phone.",
      warranty: "1 Year Brand Warranty",
      isFeatured: true,
      isFlashSale: true,
      videoUrl: "https://www.youtube.com/watch?v=UfDbyR1I5-A",
      images: [
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&q=80",
      ],
      variants: [
        { color: "Titanium Gray", storage: "256GB", ram: "12GB", priceModifier: 0, stock: 4 },
        { color: "Titanium Yellow", storage: "256GB", ram: "12GB", priceModifier: 0, stock: 2 },
        { color: "Titanium Gray", storage: "512GB", ram: "12GB", priceModifier: 20000, stock: 2 },
      ],
    },
    {
      name: "Tecno Spark 20 Pro",
      brandName: "Tecno",
      categoryName: "Tecno",
      model: "KJ6",
      price: 24500,
      discount: 0,
      stock: 25,
      description: "Tecno Spark 20 Pro comes with MediaTek Helio G99 gaming processor, 120Hz IPS display, and a stunning 108MP main camera to capture all your high-detail moments in Addis.",
      warranty: "1 Year Carlcare Warranty",
      isFeatured: false,
      isFlashSale: false,
      videoUrl: "",
      images: [
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop&q=80",
      ],
      variants: [
        { color: "Moonlit Black", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 15 },
        { color: "Sunset Gold", storage: "256GB", ram: "8GB", priceModifier: 0, stock: 10 },
      ],
    },
    {
      name: "Google Pixel 8 Pro",
      brandName: "Google",
      categoryName: "Google Pixel",
      model: "GC3VE",
      price: 115000,
      discount: 10,
      stock: 5,
      description: "Google's premium flagship featuring the Tensor G3 chip with Google AI, exceptional triple camera array with Pro controls, and 7 years of full OS updates directly from Google.",
      warranty: "1 Year Store Warranty",
      isFeatured: true,
      isFlashSale: false,
      videoUrl: "",
      images: [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop&q=80",
      ],
      variants: [
        { color: "Bay Blue", storage: "128GB", ram: "12GB", priceModifier: 0, stock: 3 },
        { color: "Obsidian Black", storage: "128GB", ram: "12GB", priceModifier: 0, stock: 2 },
      ],
    },
  ];

  for (const phoneItem of phonesList) {
    const brandObj = brands[phoneItem.brandName];
    const catObj = categories[phoneItem.categoryName];

    if (!brandObj || !catObj) continue;

    const phoneId = crypto.randomUUID();
    await db.insert(phoneTable).values({
      id: phoneId,
      name: phoneItem.name,
      brandId: brandObj.id,
      categoryId: catObj.id,
      model: phoneItem.model,
      price: phoneItem.price,
      discount: phoneItem.discount,
      stock: phoneItem.stock,
      description: phoneItem.description,
      warranty: phoneItem.warranty,
      isFeatured: phoneItem.isFeatured,
      isFlashSale: phoneItem.isFlashSale,
      videoUrl: phoneItem.videoUrl,
    });

    // Create Images
    for (let i = 0; i < phoneItem.images.length; i++) {
      await db.insert(phoneImageTable).values({
        id: crypto.randomUUID(),
        phoneId,
        url: phoneItem.images[i],
        orderIndex: i,
      });
    }

    // Create Variants
    for (const v of phoneItem.variants) {
      await db.insert(phoneVariantTable).values({
        id: crypto.randomUUID(),
        phoneId,
        color: v.color,
        storage: v.storage,
        ram: v.ram,
        priceModifier: v.priceModifier,
        stock: v.stock,
      });
    }

    // Create Reviews
    await db.insert(reviewTable).values([
      {
        id: crypto.randomUUID(),
        phoneId,
        userName: "Abebe Kebede",
        rating: 5,
        comment: "Amazing phone! Fast delivery to my office in Bole Dembel. Highly recommend EthioPhone!",
      },
      {
        id: crypto.randomUUID(),
        phoneId,
        userName: "Selam Tekle",
        rating: 4,
        comment: "Good device, battery life is outstanding. Got it with WELCOME10 coupon.",
      },
    ]);
  }

  // 8. Create Accessories
  const accessoriesList = [
    {
      name: "Anker Nano Charger 30W USB-C",
      brandName: "Anker",
      categoryName: "Chargers & Cables",
      model: "A2147",
      price: 3200,
      discount: 0,
      stock: 40,
      description: "High-speed charging for iPhone and Android. Compact design, perfect for home, office or travel in Addis Ababa.",
      warranty: "6 Months Carlcare Warranty",
      isFeatured: false,
      isFlashSale: false,
      images: ["https://images.unsplash.com/photo-1622445262465-2481c4574875?w=600&h=600&fit=crop&q=80"],
      variants: [{ color: "White", storage: "N/A", ram: "N/A", priceModifier: 0, stock: 20 }, { color: "Black", storage: "N/A", ram: "N/A", priceModifier: 0, stock: 20 }],
    },
    {
      name: "Apple AirPods Pro 2nd Gen",
      brandName: "Apple",
      categoryName: "Audio (Earbuds/Headphones)",
      model: "A2698",
      price: 38000,
      discount: 5,
      stock: 15,
      description: "AirPods Pro feature up to 2x more Active Noise Cancellation, plus Adaptive Audio and Transparency mode. Perfect companion for your iPhone.",
      warranty: "1 Year Local Warranty",
      isFeatured: true,
      isFlashSale: false,
      images: ["https://images.unsplash.com/photo-1588449668338-d1517824ee47?w=600&h=600&fit=crop&q=80"],
      variants: [{ color: "White", storage: "N/A", ram: "N/A", priceModifier: 0, stock: 15 }],
    },
  ];

  for (const acc of accessoriesList) {
    const brandObj = brands[acc.brandName];
    const catObj = categories[acc.categoryName];

    if (!brandObj || !catObj) continue;

    const phoneId = crypto.randomUUID();
    await db.insert(phoneTable).values({
      id: phoneId,
      name: acc.name,
      brandId: brandObj.id,
      categoryId: catObj.id,
      model: acc.model,
      price: acc.price,
      discount: acc.discount,
      stock: acc.stock,
      description: acc.description,
      warranty: acc.warranty,
      isFeatured: acc.isFeatured,
      isFlashSale: acc.isFlashSale,
    });

    for (let i = 0; i < acc.images.length; i++) {
      await db.insert(phoneImageTable).values({
        id: crypto.randomUUID(),
        phoneId,
        url: acc.images[i],
        orderIndex: i,
      });
    }

    for (const v of acc.variants) {
      await db.insert(phoneVariantTable).values({
        id: crypto.randomUUID(),
        phoneId,
        color: v.color,
        storage: v.storage,
        ram: v.ram,
        priceModifier: v.priceModifier,
        stock: v.stock,
      });
    }
  }
  }

  console.log("Database seeding completed successfully.");
}
