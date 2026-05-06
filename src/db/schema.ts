import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Tables
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').notNull(), // selling price
  stock: real('stock').notNull().default(0), // current quantity
  unit: text('unit').default('piece'),
  imageUrl: text('image_url'),
  active: integer('active', { mode: 'boolean' }).default(true),
  costPrice: real('cost_price').default(0), // average or last purchase cost
  categoryId: integer('category_id').references(() => categories.id),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  onPromotion: integer('on_promotion', { mode: 'boolean' }).default(false),
  promoPrice: real('promo_price'),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').unique().notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const stockMovements = sqliteTable('stock_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  type: text('type').notNull(), // 'in', 'out', 'adjustment'
  quantity: real('quantity').notNull(),
  reason: text('reason'), // 'purchase', 'sale', 'correction', 'spoilage', 'theft'
  totalCost: real('total_cost'), // for 'in' movements (purchase)
  totalPrice: real('total_price'), // for 'out' movements (sale)
  supplierId: integer('supplier_id').references(() => suppliers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  userId: integer('user_id').references(() => adminUser.id), // from admin_user
});

export const saleBaskets = sqliteTable('sale_baskets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  totalAmount: real('total_amount').notNull(),
  discountType: text('discount_type'), // 'percentage' or 'fixed'
  discountValue: real('discount_value'),
  finalAmount: real('final_amount').notNull(),
  status: text('status').default('completed'), // 'active' or 'completed'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  userId: integer('user_id').references(() => adminUser.id),
});

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  basketId: integer('basket_id').notNull().references(() => saleBaskets.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(), // selling price at time of sale
  totalPrice: real('total_price').notNull(),
});

// Contact info
export const siteSettings = sqliteTable('site_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').unique().notNull(),
  value: text('value').notNull(),
});

// Admin user and session
export const adminUser = sqliteTable('admin_user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  hashedPassword: text('hashed_password').notNull(),
});

export const userSession = sqliteTable('user_session', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => adminUser.id),
  expiresAt: integer('expires_at').notNull(),
});