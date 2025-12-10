-- Fake Users
INSERT OR IGNORE INTO
    users (
        id,
        nickname,
        email,
        password,
        avatar,
        created_at
    )
VALUES (
        2,
        'chatter1',
        'chatter1@gmail.com',
        '$2b$10$LazR1/8yT.6nC1.6nC1.6e',
        '/uploads/default.png',
        datetime('now')
    ),
    (
        3,
        'chatter2',
        'chatter2@gmail.com',
        '$2b$10$LazR1/8yT.6nC1.6nC1.6e',
        '/uploads/default.png',
        datetime('now')
    ),
    (
        4,
        'chatter3',
        'chatter3@gmail.com',
        '$2b$10$LazR1/8yT.6nC1.6nC1.6e',
        '/uploads/default.png',
        datetime('now')
    );

-- Matches for chatter1 (id=2) vs chatter2 (id=3)
INSERT INTO
    match (
        created_at,
        finished_at,
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        winner_id,
        bestOf,
        delta,
        mode
    )
VALUES (
        datetime('now', '-1 day', '-1 hour'),
        datetime('now', '-1 day'),
        2,
        3,
        5,
        2,
        2,
        5,
        10,
        'classic'
    ),
    (
        datetime('now', '-2 days', '-2 hours'),
        datetime('now', '-2 days'),
        3,
        2,
        3,
        5,
        2,
        5,
        10,
        'classic'
    ),
    (
        datetime('now', '-3 days', '-3 hours'),
        datetime('now', '-3 days'),
        2,
        3,
        1,
        5,
        3,
        5,
        10,
        'classic'
    );

-- Matches for chatter1 (id=2) vs chatter3 (id=4)
INSERT INTO
    match (
        created_at,
        finished_at,
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        winner_id,
        bestOf,
        delta,
        mode
    )
VALUES (
        datetime('now', '-4 days', '-1 hour'),
        datetime('now', '-4 days'),
        2,
        4,
        5,
        0,
        2,
        5,
        10,
        'fast'
    ),
    (
        datetime('now', '-5 days', '-2 hours'),
        datetime('now', '-5 days'),
        4,
        2,
        5,
        4,
        4,
        5,
        10,
        'classic'
    );

-- Matches for chatter2 (id=3) vs chatter3 (id=4)
INSERT INTO
    match (
        created_at,
        finished_at,
        player1_id,
        player2_id,
        player1_score,
        player2_score,
        winner_id,
        bestOf,
        delta,
        mode
    )
VALUES (
        datetime('now', '-1 hour'),
        datetime('now'),
        3,
        4,
        5,
        3,
        3,
        5,
        10,
        'classic'
    );
	