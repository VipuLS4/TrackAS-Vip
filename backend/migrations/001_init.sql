CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- plain for MVP only
  role TEXT NOT NULL CHECK (role IN ('ADMIN','COMPANY','OPERATOR'))
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  license_no TEXT,
  online BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reg_no TEXT UNIQUE NOT NULL,
  capacity_weight NUMERIC,
  capacity_volume NUMERIC,
  vcode TEXT GENERATED ALWAYS AS (substr(reg_no,1,4) || '-' || substr(reg_no,5,4)) STORED,
  status TEXT NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO settings(key,value) VALUES
  ('COMMISSION_ENABLED','true')
ON CONFLICT(key) DO NOTHING;

INSERT INTO settings(key,value) VALUES
  ('COMMISSION_RATE','2')
ON CONFLICT(key) DO NOTHING;

INSERT INTO settings(key,value) VALUES
  ('COMMISSION_MODE','postpaid')
ON CONFLICT(key) DO NOTHING;
