CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  from_role TEXT CHECK (from_role IN ('CUSTOMER','COMPANY')),
  to_operator_id UUID REFERENCES operators(id) ON DELETE SET NULL,
  stars INT CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
