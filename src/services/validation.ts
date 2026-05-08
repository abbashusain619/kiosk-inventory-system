import { z } from 'zod';

// ----- Products -----
export const ProductSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  cost_price: z.number().nonnegative().nullable().optional(),
  stock: z.number().nonnegative().default(0),
  min_stock: z.number().nonnegative().default(5),
  unit: z.string().default('piece'),
  category_id: z.number().int().positive().nullable().optional(),
  supplier_id: z.number().int().positive().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  on_promotion: z.boolean().default(false),
  promo_price: z.number().positive().nullable().optional(),
  active: z.boolean().default(true),
  created_at: z.number().optional(),
});

// ----- Suppliers -----
export const SupplierSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  created_at: z.number().optional(),
});

// ----- Categories -----
export const CategorySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(50),
  description: z.string().nullable().optional(),
  created_at: z.number().optional(),
});

// ----- Stock Movements -----
export const StockMovementSchema = z.object({
  id: z.number().int().positive().optional(),
  product_id: z.number().int().positive(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().nonnegative(),
  reason: z.string().nullable().optional(),
  total_cost: z.number().nonnegative().nullable().optional(),
  total_price: z.number().nonnegative().nullable().optional(),
  supplier_id: z.number().int().positive().nullable().optional(),
  created_at: z.number().optional(),
  user_id: z.number().int().positive().nullable().optional(),
});

// ----- Sale Baskets -----
export const SaleBasketSchema = z.object({
  id: z.number().int().positive().optional(),
  total_amount: z.number().nonnegative(),
  discount_type: z.enum(['percentage', 'fixed']).nullable().optional(),
  discount_value: z.number().nonnegative().nullable().optional(),
  final_amount: z.number().nonnegative(),
  status: z.enum(['active', 'completed']).default('completed'),
  created_at: z.number().optional(),
  completed_at: z.number().nullable().optional(),
  user_id: z.number().int().positive().nullable().optional(),
});

// ----- Sale Items -----
export const SaleItemSchema = z.object({
  id: z.number().int().positive().optional(),
  basket_id: z.number().int().positive(),
  product_id: z.number().int().positive(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  total_price: z.number().positive(),
});

// ----- Site Settings -----
export const SiteSettingSchema = z.object({
  id: z.number().int().positive().optional(),
  key: z.string().min(1),
  value: z.string(),
});