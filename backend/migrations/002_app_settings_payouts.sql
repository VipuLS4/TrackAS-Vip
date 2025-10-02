CREATE TABLE IF NOT EXISTS app_settings ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE IF NOT EXISTS payouts ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), shipment_id UUID REFERENCES shipments(id), operator_id UUID REFERENCES operators(id), amount NUMERIC, status TEXT DEFAULT 'PENDING', created_at TIMESTAMPTZ DEFAULT now(), released_at TIMESTAMPTZ );
