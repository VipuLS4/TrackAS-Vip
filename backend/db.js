import pkg from 'pg'; const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://trackas:trackas@db:5432/trackas' });
export function query(text, params){ return pool.query(text, params); }
