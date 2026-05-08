-- Add sku column as nullable first
ALTER TABLE products ADD COLUMN sku TEXT;

-- Generate a unique sku for each existing row (e.g., SKU-{id})
UPDATE products SET sku = 'SKU-' || id WHERE sku IS NULL;

-- Now make sku NOT NULL and add UNIQUE constraint
CREATE UNIQUE INDEX idx_products_sku ON products(sku);

-- Add barcode column (nullable, no default)
ALTER TABLE products ADD COLUMN barcode TEXT;