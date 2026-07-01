// src/db/drizzle.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is missing. Please add it in the settings menu.");
  }

  const client = neon(url);
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export async function initDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("DATABASE_URL is missing. Skipping database auto-initialization.");
    return;
  }

  const client = neon(url);
  
  console.log("Initializing database tables if not present in Neon...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS admin (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS brand (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      logo_url TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS category (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      is_hidden BOOLEAN DEFAULT FALSE NOT NULL,
      order_index INTEGER DEFAULT 0 NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS phone (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand_id TEXT NOT NULL REFERENCES brand(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES category(id) ON DELETE CASCADE,
      model TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      discount DOUBLE PRECISION DEFAULT 0 NOT NULL,
      stock INTEGER DEFAULT 0 NOT NULL,
      description TEXT NOT NULL,
      warranty TEXT DEFAULT '1 Year' NOT NULL,
      is_featured BOOLEAN DEFAULT FALSE NOT NULL,
      is_flash_sale BOOLEAN DEFAULT FALSE NOT NULL,
      video_url TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS phone_image (
      id TEXT PRIMARY KEY,
      phone_id TEXT NOT NULL REFERENCES phone(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      order_index INTEGER DEFAULT 0 NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS phone_variant (
      id TEXT PRIMARY KEY,
      phone_id TEXT NOT NULL REFERENCES phone(id) ON DELETE CASCADE,
      color TEXT NOT NULL,
      storage TEXT NOT NULL,
      ram TEXT NOT NULL,
      price_modifier DOUBLE PRECISION DEFAULT 0 NOT NULL,
      stock INTEGER DEFAULT 0 NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS "order" (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      alt_phone_number TEXT,
      email TEXT,
      region TEXT NOT NULL,
      city TEXT NOT NULL,
      sub_city TEXT NOT NULL,
      woreda TEXT NOT NULL,
      house_number TEXT,
      delivery_address TEXT NOT NULL,
      delivery_notes TEXT,
      payment_method TEXT NOT NULL,
      delivery_fee DOUBLE PRECISION DEFAULT 0 NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      status TEXT DEFAULT 'Pending' NOT NULL,
      coupon_code TEXT,
      discount_applied DOUBLE PRECISION DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS order_item (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
      phone_id TEXT NOT NULL REFERENCES phone(id) ON DELETE CASCADE,
      variant_id TEXT,
      name TEXT NOT NULL,
      color TEXT,
      storage TEXT,
      ram TEXT,
      price DOUBLE PRECISION NOT NULL,
      quantity INTEGER DEFAULT 1 NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS coupon (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      value DOUBLE PRECISION NOT NULL,
      expiration_date TIMESTAMP NOT NULL,
      usage_limit INTEGER DEFAULT 0 NOT NULL,
      usage_count INTEGER DEFAULT 0 NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS review (
      id TEXT PRIMARY KEY,
      phone_id TEXT NOT NULL REFERENCES phone(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS favorite (
      id TEXT PRIMARY KEY,
      phone_id TEXT NOT NULL REFERENCES phone(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS contact_message (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      is_read BOOLEAN DEFAULT FALSE NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS blog (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      author TEXT DEFAULT 'Admin' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS notification (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS website_setting (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );`
  ];

  const db = getDb();
  for (const q of queries) {
    try {
      await db.execute(sql.raw(q));
    } catch (err) {
      console.error("Failed executing query:", q, err);
    }
  }
  console.log("Database tables initialized successfully.");
}
