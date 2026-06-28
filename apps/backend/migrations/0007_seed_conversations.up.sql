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