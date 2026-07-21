CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','manager','viewer')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='password') THEN
    EXECUTE 'UPDATE users SET password_hash=password WHERE password_hash IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE password_hash IS NULL) THEN
    RAISE EXCEPTION 'users.password_hash migration requires every existing user to have a password hash';
  END IF;
END $$;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

CREATE TABLE IF NOT EXISTS operating_hours (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  timezone VARCHAR(80) NOT NULL,
  monday_start VARCHAR(5), monday_end VARCHAR(5),
  tuesday_start VARCHAR(5), tuesday_end VARCHAR(5),
  wednesday_start VARCHAR(5), wednesday_end VARCHAR(5),
  thursday_start VARCHAR(5), thursday_end VARCHAR(5),
  friday_start VARCHAR(5), friday_end VARCHAR(5),
  saturday_start VARCHAR(5), saturday_end VARCHAR(5),
  sunday_start VARCHAR(5), sunday_end VARCHAR(5),
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS service_territories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  operating_hours_name VARCHAR(120) NOT NULL,
  city VARCHAR(120), state VARCHAR(80), country VARCHAR(80),
  is_active VARCHAR(10) NOT NULL DEFAULT 'true',
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS service_resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  resource_type VARCHAR(80) NOT NULL,
  email VARCHAR(255), phone VARCHAR(40),
  is_active VARCHAR(10) NOT NULL DEFAULT 'true',
  territory_name VARCHAR(120) NOT NULL,
  efficiency_rating VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS service_resource_skills (
  id SERIAL PRIMARY KEY,
  resource_name VARCHAR(120) NOT NULL,
  skill_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  UNIQUE(resource_name, skill_name)
);

CREATE TABLE IF NOT EXISTS territory_members (
  id SERIAL PRIMARY KEY,
  resource_name VARCHAR(120) NOT NULL,
  territory_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  UNIQUE(resource_name, territory_name)
);

CREATE TABLE IF NOT EXISTS work_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  estimated_duration_minutes VARCHAR(10) NOT NULL,
  skill_requirement VARCHAR(120),
  block_time_before VARCHAR(10) NOT NULL DEFAULT '0',
  block_time_after VARCHAR(10) NOT NULL DEFAULT '0',
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  work_order_number VARCHAR(80) NOT NULL UNIQUE,
  subject VARCHAR(240) NOT NULL,
  description TEXT,
  account_name VARCHAR(160), contact_name VARCHAR(160), contact_phone VARCHAR(40), contact_email VARCHAR(255), budget VARCHAR(40),
  region VARCHAR(120), district VARCHAR(120), market VARCHAR(120),
  territory_name VARCHAR(120) NOT NULL,
  work_type_name VARCHAR(120) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('Critical','High','Medium','Low')),
  status VARCHAR(30) NOT NULL CHECK (status IN ('Pending','New','Open','In Progress','Scheduled','Completed','Cancelled')),
  start_date DATE, end_date DATE,
  address VARCHAR(300), city VARCHAR(120), state VARCHAR(80),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS work_orders_number_uq ON work_orders(work_order_number);

CREATE TABLE IF NOT EXISTS resource_absences (
  id SERIAL PRIMARY KEY,
  resource_name VARCHAR(120) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL,
  CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS service_appointments (
  id SERIAL PRIMARY KEY,
  appointment_number VARCHAR(80) NOT NULL UNIQUE,
  work_order_number VARCHAR(80) NOT NULL,
  subject VARCHAR(240) NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('Scheduled','Dispatched','In Progress','Completed','Cancelled')),
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  duration_minutes VARCHAR(10) NOT NULL,
  resource_name VARCHAR(120) NOT NULL,
  territory_name VARCHAR(120) NOT NULL,
  address VARCHAR(300), city VARCHAR(120), state VARCHAR(80),
  idempotency_key VARCHAR(128),
  request_hash CHAR(64),
  booked_work_order_version INTEGER,
  created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (scheduled_end > scheduled_start)
);
ALTER TABLE service_appointments ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);
ALTER TABLE service_appointments ADD COLUMN IF NOT EXISTS request_hash CHAR(64);
ALTER TABLE service_appointments ADD COLUMN IF NOT EXISTS booked_work_order_version INTEGER;
ALTER TABLE service_appointments ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE service_appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS service_appointments_number_uq ON service_appointments(appointment_number);
CREATE UNIQUE INDEX IF NOT EXISTS service_appointments_idempotency_uq ON service_appointments(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS service_appointments_resource_time_idx ON service_appointments(resource_name, scheduled_start, scheduled_end);

CREATE TABLE IF NOT EXISTS scheduling_audit_events (
  id BIGSERIAL PRIMARY KEY,
  sequence BIGINT NOT NULL UNIQUE,
  actor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  outcome VARCHAR(30) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash CHAR(64) NOT NULL,
  event_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION reject_scheduling_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'scheduling audit events are immutable';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS scheduling_audit_immutable ON scheduling_audit_events;
CREATE TRIGGER scheduling_audit_immutable BEFORE UPDATE OR DELETE ON scheduling_audit_events FOR EACH ROW EXECUTE FUNCTION reject_scheduling_audit_mutation();

CREATE OR REPLACE FUNCTION protect_final_booking() RETURNS trigger AS $$
BEGIN
  IF OLD.status IN ('Completed','Cancelled') AND OLD IS DISTINCT FROM NEW THEN
    RAISE EXCEPTION 'final appointment is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS service_appointments_final_guard ON service_appointments;
CREATE TRIGGER service_appointments_final_guard BEFORE UPDATE ON service_appointments FOR EACH ROW EXECUTE FUNCTION protect_final_booking();
