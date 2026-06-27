-- =============================================================================
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
INSERT INTO dashboard_users (branch_id, email, password_hash, role)
VALUES (
    1,
    'admin@test.com',
    '$argon2id$v=19$m=65536,t=3,p=4$gspHaszAoF41XXcuwYeYQw$01cQ8LjV/lk65UP63r/BooHhiiEMvjIUPbFK9S6TGBM',
    'admin'
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
