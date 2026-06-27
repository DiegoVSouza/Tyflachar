-- LLM features: knowledge base for RAG
CREATE TABLE branch_knowledge (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- services, hours, policies, faq, general
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_knowledge_branch ON branch_knowledge(branch_id, category);
