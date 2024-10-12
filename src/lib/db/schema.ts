import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "assistant"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  pdfName: text("pdf_name").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  fileKey: text("file_key").notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  role: roleEnum("role").notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull().unique(),
  razorpayCustomerId: varchar("razorpay_customer_id", { length: 256 })
    .notNull()
    .unique(),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", {
    length: 256,
  }).unique(),
  razorpayPriceId: varchar("razorpay_price_id", { length: 256 }),
  razorpayCurrentPeriodEnd: timestamp("razorpay_current_period_ended_at"),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DrizzleChat = typeof chats.$inferSelect;