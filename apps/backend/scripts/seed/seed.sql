-- =============================================================================
-- Seed de dados de desenvolvimento (execução manual)
--
-- Conteúdo movido de migrations/0006_seed_test_data.up.sql e
-- 0007_seed_conversations.up.sql (agora vazias/no-op).
--
-- Rode com: go run scripts/seed/main.go   (a partir de apps/backend)
-- =============================================================================

-- =============================================================================
-- Bloco original: migrations/0006_seed_test_data.up.sql
-- -----------------------------------------------------------------------------
-- Seed: test branch (id = 1) fully configured and ready to use.
--
-- Dashboard login: admin@test.com  /  password: admin123
-- Hash: Argon2id v19 — m=64MB, t=3 iterations, p=4 threads (OWASP recommended)
-- Regenerate: go run scripts/genhash/main.go <password>
--
-- To enable LLM mode: UPDATE branches SET bot_mode = 'llm' WHERE id = 1;
-- =============================================================================

-- ─── Branch ──────────────────────────────────────────────────────────────────
INSERT INTO branches (id, name, wa_phone, plan, bot_mode)
OVERRIDING SYSTEM VALUE
VALUES (1, 'Test Branch', '5511999990000', 'basic', 'fixed');

SELECT setval(pg_get_serial_sequence('branches', 'id'), 1);

-- ─── Dashboard user ───────────────────────────────────────────────────────────
-- Password: "admin123" — Argon2id (m=65536 KB, t=3, p=4)
-- To regenerate: go run scripts/genhash/main.go <new-password>
INSERT INTO dashboard_users (branch_id, email, password_hash, role, name)
VALUES (
    1,
    'admin@test.com',
    '$argon2id$v=19$m=65536,t=3,p=4$hUGtHQ+ETAReBjpAD3kCNA$8FmYYHTeBejng1WanfJ3sJwwTgSoZxXQuxiHnCtWNas',
    'admin',
    'Test Admin'
);

-- ─── Services ─────────────────────────────────────────────────────────────────
INSERT INTO services (branch_id, name, starting_price, duration_minutes, active) VALUES
    (1, 'Hydration Treatment',  120.00, 90,  true),
    (1, 'Haircut',               80.00, 60,  true),
    (1, 'Styling + Babyliss',   100.00, 75,  true),
    (1, 'Color + Highlights',   250.00, 180, true),
    (1, 'Cauterization',        150.00, 120, true),
    (1, 'Scalp Treatment',       90.00, 60,  true);

-- ─── Available slots (rolling — always 7 days ahead) ─────────────────────────
INSERT INTO available_slots (branch_id, scheduled_at, period, booked) VALUES
    -- Day +1
    (1, date_trunc('day', now()) + interval '1 day'  + interval  '9 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '1 day'  + interval '10 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '1 day'  + interval '14 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '1 day'  + interval '16 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '1 day'  + interval '18 hours', 'evening',   false),
    -- Day +2
    (1, date_trunc('day', now()) + interval '2 days' + interval  '9 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '2 days' + interval '11 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '2 days' + interval '14 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '2 days' + interval '15 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '2 days' + interval '19 hours', 'evening',   false),
    -- Day +3
    (1, date_trunc('day', now()) + interval '3 days' + interval  '9 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '3 days' + interval '10 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '3 days' + interval '14 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '3 days' + interval '17 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '3 days' + interval '18 hours', 'evening',   false),
    -- Day +5
    (1, date_trunc('day', now()) + interval '5 days' + interval '10 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '5 days' + interval '14 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '5 days' + interval '18 hours', 'evening',   false),
    -- Day +7
    (1, date_trunc('day', now()) + interval '7 days' + interval  '9 hours', 'morning',   false),
    (1, date_trunc('day', now()) + interval '7 days' + interval '15 hours', 'afternoon', false),
    (1, date_trunc('day', now()) + interval '7 days' + interval '19 hours', 'evening',   false);

-- ─── Branch knowledge (RAG — used by LLM mode) ───────────────────────────────
INSERT INTO branch_knowledge (branch_id, title, content, category) VALUES
    (
        1,
        'Working Hours',
        'Monday to Saturday: 9am to 7pm. Sundays and holidays: closed.',
        'hours'
    ),
    (
        1,
        'Location & Contact',
        'Located at Rua das Flores, 123 — São Paulo/SP. WhatsApp: (11) 99999-0000.',
        'general'
    ),
    (
        1,
        'Booking Policy',
        'Appointments must be booked at least 2 hours in advance. '
        'Cancellations must be made at least 1 hour before the scheduled time. '
        'No-shows may result in a deposit requirement for future bookings.',
        'policies'
    ),
    (
        1,
        'Payment Methods',
        'We accept cash, Pix, credit cards (Visa, Mastercard, Elo) and debit cards. '
        'We do not accept payment in advance — payment is made on the day of the service.',
        'policies'
    ),
    (
        1,
        'Specialty — Curly & Wavy Hair',
        'We specialize in curly and wavy hair (types 2A to 4C). '
        'All stylists are trained in the Curly Girl Method. '
        'We use sulfate-free, silicone-free products. '
        'First-time clients receive a complimentary hair type assessment.',
        'services'
    ),
    (
        1,
        'FAQ — How long does a service take?',
        'Haircut: ~60 min. Hydration: ~90 min. Cauterization: ~2h. '
        'Color/Highlights: up to 3h depending on hair length. '
        'Styling + Babyliss: ~75 min.',
        'faq'
    );

-- =============================================================================
-- Bloco original: migrations/0007_seed_conversations.up.sql
-- =============================================================================

INSERT INTO clients (id, branch_id, name, phone, tags, created_at)
OVERRIDING SYSTEM VALUE
VALUES
    (1, 1, 'Ana Lima',      '5511991110001', '{vip,curly}',     now() - interval '10 days'),
    (2, 1, 'Bruno Souza',   '5511991110002', '{new}',           now() - interval '3 days'),
    (3, 1, 'Carla Mendes',  '5511991110003', '{}',              now() - interval '5 days'),
    (4, 1, 'Diego Ramos',   '5511991110004', '{recurring}',     now() - interval '20 days'),
    (5, 1, 'Elisa Torres',  '5511991110005', '{vip}',           now() - interval '1 day');

SELECT setval(pg_get_serial_sequence('clients', 'id'), 5);

INSERT INTO conversations (id, client_id, status, bot_state, context, last_msg_at)
OVERRIDING SYSTEM VALUE
VALUES
    -- 1. Open — bot showed main menu, waiting for choice
    (1, 1, 'open',          'main_menu',              '{}',                                                   now() - interval '2 minutes'),
    -- 2. Open — slot chosen, awaiting confirmation
    (2, 2, 'open',          'confirming_appointment', '{"service_id":"service_1","slot_id":1,"slot_time":"2024-07-15T09:00:00-03:00"}', now() - interval '5 minutes'),
    -- 3. Waiting for agent
    (3, 3, 'waiting_agent', 'done',                   '{}',                                                   now() - interval '15 minutes'),
    -- 4. Closed — appointment confirmed
    (4, 4, 'closed',        'done',                   '{}',                                                   now() - interval '2 days'),
    -- 5. Closed — older conversation, fully read
    (5, 5, 'closed',        'done',                   '{}',                                                   now() - interval '8 days');

SELECT setval(pg_get_serial_sequence('conversations', 'id'), 5);

INSERT INTO messages (conversation_id, direction, content, type, status, read, timestamp) VALUES
    (1, 'in',  'oi',                                                                          'text',        'received', true,  now() - interval '3 minutes'),
    (1, 'out', 'Hi! 👋 I''m the virtual assistant. How can I help you today?',               'interactive', 'sent',     true,  now() - interval '2 minutes');

INSERT INTO messages (conversation_id, direction, content, type, status, read, timestamp) VALUES
    (2, 'in',  'quero agendar',                                                               'text',        'received', true,  now() - interval '12 minutes'),
    (2, 'out', 'Which service would you like to book?',                                       'interactive', 'sent',     true,  now() - interval '11 minutes'),
    (2, 'in',  'service_1',                                                                   'interactive', 'received', true,  now() - interval '10 minutes'),
    (2, 'out', 'Great choice! Which period do you prefer?',                                   'interactive', 'sent',     true,  now() - interval '9 minutes'),
    (2, 'in',  'morning',                                                                     'interactive', 'received', true,  now() - interval '8 minutes'),
    (2, 'out', 'I found the slot 07/15 09:00. Confirm the booking?',                         'interactive', 'sent',     true,  now() - interval '7 minutes'),
    (2, 'in',  'pode confirmar sim',                                                          'text',        'received', false, now() - interval '5 minutes');

INSERT INTO messages (conversation_id, direction, content, type, status, read, timestamp) VALUES
    (3, 'in',  'oi preciso de ajuda',                                                         'text',        'received', true,  now() - interval '20 minutes'),
    (3, 'out', 'Hi! 👋 I''m the virtual assistant. How can I help you today?',               'interactive', 'sent',     true,  now() - interval '19 minutes'),
    (3, 'in',  'btn_talk_to_agent',                                                           'interactive', 'received', true,  now() - interval '18 minutes'),
    (3, 'out', 'Perfect! We''ll connect you with our staff shortly 🙂',                      'text',        'sent',     true,  now() - interval '17 minutes'),
    (3, 'in',  'tá mas quanto tempo demora?',                                                 'text',        'received', false, now() - interval '16 minutes'),
    (3, 'in',  'alguém me atende?',                                                           'text',        'received', false, now() - interval '15 minutes');

INSERT INTO messages (conversation_id, direction, content, type, status, read, timestamp) VALUES
    (4, 'in',  'boa tarde',                                                                   'text',        'received', true,  now() - interval '2 days' - interval '10 minutes'),
    (4, 'out', 'Hi! 👋 I''m the virtual assistant. How can I help you today?',               'interactive', 'sent',     true,  now() - interval '2 days' - interval '9 minutes'),
    (4, 'in',  'btn_schedule',                                                                'interactive', 'received', true,  now() - interval '2 days' - interval '8 minutes'),
    (4, 'out', 'Which service would you like to book?',                                       'interactive', 'sent',     true,  now() - interval '2 days' - interval '7 minutes'),
    (4, 'in',  'service_2',                                                                   'interactive', 'received', true,  now() - interval '2 days' - interval '6 minutes'),
    (4, 'out', 'Great choice! Which period do you prefer?',                                   'interactive', 'sent',     true,  now() - interval '2 days' - interval '5 minutes'),
    (4, 'in',  'afternoon',                                                                   'interactive', 'received', true,  now() - interval '2 days' - interval '4 minutes'),
    (4, 'out', 'I found the slot 07/16 14:00. Confirm the booking?',                         'interactive', 'sent',     true,  now() - interval '2 days' - interval '3 minutes'),
    (4, 'in',  'btn_confirm_yes',                                                             'interactive', 'received', true,  now() - interval '2 days' - interval '2 minutes'),
    (4, 'out', 'Appointment confirmed! ✅ We''ll see you there.',                             'text',        'sent',     true,  now() - interval '2 days' - interval '1 minute');

INSERT INTO messages (conversation_id, direction, content, type, status, read, timestamp) VALUES
    (5, 'in',  'oi, quero remarcar meu horário',                                              'text',        'received', true,  now() - interval '8 days' - interval '5 minutes'),
    (5, 'out', 'Hi! 👋 I''m the virtual assistant. How can I help you today?',               'interactive', 'sent',     true,  now() - interval '8 days' - interval '4 minutes'),
    (5, 'in',  'btn_talk_to_agent',                                                           'interactive', 'received', true,  now() - interval '8 days' - interval '3 minutes'),
    (5, 'out', 'Perfect! We''ll connect you with our staff shortly 🙂',                      'text',        'sent',     true,  now() - interval '8 days' - interval '2 minutes'),
    (5, 'out', 'Olá Elisa! Remarcamos para quinta-feira às 10h. Até lá! 😊',                 'text',        'sent',     true,  now() - interval '8 days' - interval '1 minute');

INSERT INTO appointments (client_id, service, scheduled_at, status, created_at) VALUES
    (4, 'Haircut',             now() + interval '1 day'  + interval '14 hours', 'confirmed', now() - interval '2 days'),
    (5, 'Hydration Treatment', now() + interval '3 days' + interval '10 hours', 'confirmed', now() - interval '8 days');
