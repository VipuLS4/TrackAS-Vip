CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT,
  urgency TEXT DEFAULT 'NORMAL',
  goods_description TEXT,
  weight NUMERIC,
  length NUMERIC,
  width NUMERIC,
  height NUMERIC,
  volume NUMERIC,
  handling_flags TEXT[],
  goods_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'CREATED',
  shipment_cost NUMERIC DEFAULT 0,
  payment_mode TEXT DEFAULT 'online',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('PICKUP','DROP')),
  address TEXT,
  lat NUMERIC,
  lng NUMERIC,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
