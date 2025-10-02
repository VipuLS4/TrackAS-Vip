-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref TEXT,
  role TEXT,
  message TEXT,
  contact TEXT,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to existing tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS account_holder TEXT;

ALTER TABLE operators ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE operators ADD COLUMN IF NOT EXISTS account_holder TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_company_id ON shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_operator_id ON shipments(operator_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_pings_shipment_id ON pings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_pings_ts ON pings(ts);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Add constraints
ALTER TABLE shipments ADD CONSTRAINT IF NOT EXISTS check_status 
  CHECK (status IN ('CREATED', 'ASSIGNED', 'PICKUP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'));

ALTER TABLE companies ADD CONSTRAINT IF NOT EXISTS check_company_status 
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE operators ADD CONSTRAINT IF NOT EXISTS check_operator_status 
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE vehicles ADD CONSTRAINT IF NOT EXISTS check_vehicle_status 
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));
