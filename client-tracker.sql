-- ============================================================
--  CLIENT TRACKER — Schema & RLS
--  Jalankan di Supabase SQL Editor
-- ============================================================

-- ── Tables ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_orders (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identitas
  order_number          VARCHAR(50) UNIQUE NOT NULL,
  client_name           VARCHAR(200) NOT NULL,
  client_phone          VARCHAR(20),
  client_email          VARCHAR(200),

  -- Pesanan
  product_name          VARCHAR(200) NOT NULL,
  product_type          VARCHAR(100),
  quantity              INTEGER NOT NULL DEFAULT 1,
  unit                  VARCHAR(20) DEFAULT 'pcs',

  -- Spesifikasi
  paper_type            VARCHAR(100),
  size                  VARCHAR(100),
  finishing             VARCHAR(200),
  colors                INTEGER DEFAULT 4,
  notes                 TEXT,

  -- Harga (tidak ditampilkan ke klien)
  price_hpp             INTEGER,
  price_sell            INTEGER,
  dp_amount             INTEGER,
  dp_paid               BOOLEAN DEFAULT false,

  -- Status
  current_status        VARCHAR(50) DEFAULT 'order_masuk',

  -- Timeline
  order_date            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline_date         TIMESTAMP WITH TIME ZONE,
  estimated_done_date   TIMESTAMP WITH TIME ZONE,

  -- Tracking publik
  tracking_token        VARCHAR(100) UNIQUE NOT NULL,
  tracking_url          TEXT,
  is_tracking_active    BOOLEAN DEFAULT true,

  -- Meta
  last_notif_sent_at    TIMESTAMP WITH TIME ZONE,
  notify_client_on_update BOOLEAN DEFAULT true,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_updates (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id     UUID REFERENCES client_orders(id) ON DELETE CASCADE,
  status_from  VARCHAR(50),
  status_to    VARCHAR(50) NOT NULL,
  note         TEXT,
  photo_url    TEXT,
  updated_by   VARCHAR(100),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_client_orders_user_id         ON client_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_tracking_token  ON client_orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_order_updates_order_id        ON order_updates(order_id);

-- ── RLS ──────────────────────────────────────────────────
ALTER TABLE client_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_updates  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can manage own orders"     ON client_orders;
DROP POLICY IF EXISTS "Owner can manage order updates"  ON order_updates;

CREATE POLICY "Owner can manage own orders"
  ON client_orders FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can manage order updates"
  ON order_updates FOR ALL
  USING (
    order_id IN (SELECT id FROM client_orders WHERE user_id = auth.uid())
  );

-- ── Storage bucket for order progress photos ─────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-photos', 'order-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owner upload order photos" ON storage.objects;
CREATE POLICY "Owner upload order photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'order-photos' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public read order photos" ON storage.objects;
CREATE POLICY "Public read order photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'order-photos');

-- ── RPC: get_order_by_token (publik, SECURITY DEFINER) ───
CREATE OR REPLACE FUNCTION get_order_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'order_number',        co.order_number,
    'client_name',         co.client_name,
    'product_name',        co.product_name,
    'product_type',        co.product_type,
    'quantity',            co.quantity,
    'unit',                co.unit,
    'size',                co.size,
    'finishing',           co.finishing,
    'paper_type',          co.paper_type,
    'colors',              co.colors,
    'notes',               co.notes,
    'current_status',      co.current_status,
    'order_date',          co.order_date,
    'deadline_date',       co.deadline_date,
    'estimated_done_date', co.estimated_done_date,
    'updated_at',          co.updated_at,
    'updates', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'status_to',  ou.status_to,
          'note',       ou.note,
          'photo_url',  ou.photo_url,
          'created_at', ou.created_at
        )
        ORDER BY ou.created_at ASC
      )
      FROM order_updates ou
      WHERE ou.order_id = co.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM client_orders co
  WHERE co.tracking_token = p_token
    AND co.is_tracking_active = true;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_order_by_token TO anon;
GRANT EXECUTE ON FUNCTION get_order_by_token TO authenticated;

-- ── updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS update_client_orders_updated_at ON client_orders;
CREATE TRIGGER update_client_orders_updated_at
  BEFORE UPDATE ON client_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
