CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_branch ON clients(branch_id);
CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
