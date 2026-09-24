import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
export const owners = sqliteTable("owners", {
  id: text("id").primaryKey(),
  status: text("status", { enum: ["ACTIVE", "PASSIVE"] }).notNull(),
});
export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => owners.id),
  publicToken: text("public_token").notNull().unique(),
  data: text("data").notNull(),
  status: text("status", { enum: ["ACTIVE", "PASSIVE"] }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, t => [index("cards_owner_idx").on(t.userId)]);
