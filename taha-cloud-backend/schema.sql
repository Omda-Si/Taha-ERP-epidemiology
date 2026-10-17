-- Run this in the Supabase SQL editor (or any PostgreSQL client)
-- if you prefer to create the table manually instead of letting
-- the API create it on startup.

CREATE TABLE IF NOT EXISTS epidemiology_records (
    id              BIGSERIAL PRIMARY KEY,
    event_id        VARCHAR(64)  NOT NULL UNIQUE,
    facility_code   VARCHAR(64)  NOT NULL,
    diagnosis_code  VARCHAR(32)  NOT NULL,
    diagnosis_name  VARCHAR(128) NOT NULL,
    age_bracket     VARCHAR(16)  NOT NULL,
    occupation      VARCHAR(64)  NOT NULL,
    city            VARCHAR(64),
    district        VARCHAR(64),
    region          VARCHAR(64)  NOT NULL,
    diagnosed_at    TIMESTAMPTZ  NOT NULL,
    received_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_epi_diagnosed_at ON epidemiology_records (diagnosed_at);
CREATE INDEX IF NOT EXISTS idx_epi_region ON epidemiology_records (region);
CREATE INDEX IF NOT EXISTS idx_epi_diagnosis_code ON epidemiology_records (diagnosis_code);
CREATE INDEX IF NOT EXISTS idx_epi_facility ON epidemiology_records (facility_code);
