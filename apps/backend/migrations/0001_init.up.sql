CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    wa_phone VARCHAR(20) NOT NULL,
    meta_token TEXT,
    plan VARCHAR(50) DEFAULT 'basic',
    bot_mode VARCHAR(20) DEFAULT 'fixed',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE dashboard_users (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id),
    name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    status VARCHAR(50) DEFAULT 'open',
    bot_state VARCHAR(100) DEFAULT 'start',
    context JSONB DEFAULT '{}',
    last_msg_at TIMESTAMP DEFAULT now()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    direction VARCHAR(10) NOT NULL, -- 'in' or 'out'
    content TEXT,
    type VARCHAR(50) DEFAULT 'text', -- text, button, interactive
    wa_message_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'received',
    "timestamp" TIMESTAMP DEFAULT now()
);

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    service VARCHAR(255),
    scheduled_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now()
);
