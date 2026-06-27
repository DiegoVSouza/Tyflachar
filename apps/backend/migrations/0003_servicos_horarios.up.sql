CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    name VARCHAR(255) NOT NULL,
    starting_price NUMERIC(10,2),
    duration_minutes INTEGER DEFAULT 60,
    active BOOLEAN DEFAULT true
);

CREATE TABLE available_slots (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    scheduled_at TIMESTAMP NOT NULL,
    period VARCHAR(20), -- morning | afternoon | evening
    booked BOOLEAN DEFAULT false
);

CREATE INDEX idx_services_branch ON services(branch_id);
CREATE INDEX idx_slots_branch_period ON available_slots(branch_id, period, booked);
