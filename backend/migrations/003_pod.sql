CREATE TABLE IF NOT EXISTS proof_of_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
