-- ==================== CLEAN SLATE ====================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.order_belongs_to_user(UUID) CASCADE;

-- ==================== PROFILES ====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== PRODUCTS ====================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  fabric TEXT,
  color TEXT[] DEFAULT '{}',
  occasion TEXT[] DEFAULT '{}',
  region TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON products FOR SELECT USING (TRUE);

-- ==================== ORDERS ====================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','returned')),
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  address JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_id TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==================== ORDER ITEMS ====================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.order_belongs_to_user(p_order_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = p_order_id AND user_id = auth.uid()
  );
$$;

CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (public.order_belongs_to_user(order_id));

CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (public.order_belongs_to_user(order_id));

-- ==================== REVIEWS ====================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);

-- ==================== SAMPLE PRODUCTS ====================
INSERT INTO products (name, description, price, original_price, category, fabric, color, occasion, region, in_stock, stock_quantity, rating, review_count, is_featured, is_new_arrival, images) VALUES
(
  'Kanjivaram Pure Silk Saree - Ruby Red',
  'A stunning Kanjivaram pure silk saree in rich ruby red with traditional gold zari border. Handwoven by master weavers from Kanchipuram, this saree features intricate temple motifs and a heavy pallu with elephant and peacock designs. Perfect for weddings and grand occasions.',
  18500, 22000, 'kanjivaram', 'pure silk',
  ARRAY['red','gold'], ARRAY['wedding','bridal','festival'], 'kanchipuram',
  TRUE, 15, 4.9, 128, TRUE, FALSE,
  ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600']
),
(
  'Banarasi Silk Saree - Royal Blue',
  'Exquisite Banarasi silk saree in royal blue with intricate gold and silver zari work. Features traditional Mughal-inspired bootis and a gorgeous heavy pallu.',
  15500, 19000, 'banarasi', 'pure silk',
  ARRAY['blue','gold'], ARRAY['wedding','festival','party'], 'varanasi',
  TRUE, 8, 4.8, 96, TRUE, FALSE,
  ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600']
),
(
  'Chanderi Cotton Silk Saree - Mint Green',
  'Elegant Chanderi cotton-silk saree in soothing mint green with delicate gold buti work. Lightweight and breathable, ideal for summer occasions and office wear.',
  3800, 4500, 'chanderi', 'blended silk',
  ARRAY['green','gold'], ARRAY['casual','office','festival'], 'madhya pradesh',
  TRUE, 25, 4.6, 73, FALSE, TRUE,
  ARRAY['https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600']
),
(
  'Handloom Cotton Saree - Indigo Blue',
  'Authentic handloom cotton saree in deep indigo with natural plant-based dyes. Woven on traditional pit looms by skilled artisans of Odisha.',
  2200, 2800, 'cotton', 'handloom cotton',
  ARRAY['blue','white'], ARRAY['casual','office'], 'odisha',
  TRUE, 40, 4.5, 52, FALSE, TRUE,
  ARRAY['https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600']
),
(
  'Patola Silk Saree - Multicolor',
  'Rare double ikat Patola silk saree from Patan, Gujarat. Features traditional geometric patterns in vibrant red, yellow, green and black.',
  28000, 32000, 'patola', 'pure silk',
  ARRAY['red','yellow','green','black'], ARRAY['wedding','festival','bridal'], 'gujarat',
  TRUE, 5, 4.95, 41, TRUE, FALSE,
  ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4b4057?w=600']
),
(
  'Muga Silk Saree - Golden',
  'Authentic Muga silk saree from Assam featuring the natural golden sheen. Woven with traditional Assamese motifs. Gains lustre with use and age.',
  12000, 14500, 'silk', 'pure silk',
  ARRAY['gold','cream'], ARRAY['wedding','festival'], 'assam',
  TRUE, 10, 4.7, 35, FALSE, TRUE,
  ARRAY['https://images.unsplash.com/photo-1600298882525-05bfbaa4ff45?w=600']
),
(
  'Tant Cotton Saree - Yellow & Red',
  'Traditional Bengali Tant handloom saree in bright yellow with red border. Ultra-lightweight and airy, perfect for Durga Puja and daily wear.',
  1500, 1800, 'cotton', 'pure cotton',
  ARRAY['yellow','red'], ARRAY['casual','festival'], 'bengal',
  TRUE, 50, 4.3, 87, FALSE, FALSE,
  ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600']
),
(
  'Kota Doria Saree - Peach',
  'Delicate Kota Doria saree in soft peach with silver zari checks. The distinctive square-check pattern is the hallmark of authentic Kota Doria.',
  4200, 5000, 'silk', 'blended silk',
  ARRAY['pink','silver'], ARRAY['casual','party','festival'], 'rajasthan',
  TRUE, 20, 4.6, 44, FALSE, TRUE,
  ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600']
);
