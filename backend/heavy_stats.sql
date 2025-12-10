-- Clean up recent matches to ensure clean chart for testing
-- DELETE FROM match WHERE player1_id = 2 OR player2_id = 2;

-- DAY 0 (TODAY): 17 Wins, 1 Loss (High point)
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
        datetime('now', '-10 minutes'),
        datetime('now'),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-20 minutes'),
        datetime('now', '-10 minutes'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-30 minutes'),
        datetime('now', '-20 minutes'),
        2,
        1,
        5,
        2,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-40 minutes'),
        datetime('now', '-30 minutes'),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-50 minutes'),
        datetime('now', '-40 minutes'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-1 hour'),
        datetime('now', '-50 minutes'),
        2,
        1,
        5,
        2,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-1 hour',
            '-10 minutes'
        ),
        datetime('now', '-1 hour'),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-1 hour',
            '-20 minutes'
        ),
        datetime(
            'now',
            '-1 hour',
            '-10 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-1 hour',
            '-30 minutes'
        ),
        datetime(
            'now',
            '-1 hour',
            '-20 minutes'
        ),
        2,
        1,
        5,
        2,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-1 hour',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-1 hour',
            '-30 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-2 hours'),
        datetime(
            'now',
            '-1 hour',
            '-40 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 hours',
            '-10 minutes'
        ),
        datetime('now', '-2 hours'),
        2,
        1,
        5,
        2,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 hours',
            '-20 minutes'
        ),
        datetime(
            'now',
            '-2 hours',
            '-10 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 hours',
            '-30 minutes'
        ),
        datetime(
            'now',
            '-2 hours',
            '-20 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 hours',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-2 hours',
            '-30 minutes'
        ),
        2,
        1,
        5,
        2,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-3 hours'),
        datetime(
            'now',
            '-2 hours',
            '-40 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-3 hours',
            '-10 minutes'
        ),
        datetime('now', '-3 hours'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-3 hours',
            '-20 minutes'
        ),
        datetime(
            'now',
            '-3 hours',
            '-10 minutes'
        ),
        1,
        2,
        5,
        4,
        1,
        5,
        -10,
        '1v1'
    );
-- Loss

-- DAY 1 (YESTERDAY): 3 Wins (Low point)
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
        datetime('now', '-1 day'),
        datetime(
            'now',
            '-1 day',
            '+10 minutes'
        ),
        2,
        1,
        5,
        3,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-1 day', '-1 hour'),
        datetime(
            'now',
            '-1 day',
            '-50 minutes'
        ),
        2,
        1,
        5,
        4,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-1 day', '-2 hours'),
        datetime(
            'now',
            '-1 day',
            '-1 hour',
            '+50 minutes'
        ),
        2,
        1,
        5,
        2,
        2,
        5,
        10,
        '1v1'
    );

-- DAY 2 (2 DAYS AGO): 12 Wins (Mid-High)
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
        datetime('now', '-2 days'),
        datetime(
            'now',
            '-2 days',
            '+10 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-20 minutes'
        ),
        datetime('now', '-2 days'),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-2 days',
            '-20 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-2 days', '-1 hour'),
        datetime(
            'now',
            '-2 days',
            '-40 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-1 hour',
            '-20 minutes'
        ),
        datetime('now', '-2 days', '-1 hour'),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-1 hour',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-2 days',
            '-1 hour',
            '-20 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-2 days', '-2 hours'),
        datetime(
            'now',
            '-2 days',
            '-1 hour',
            '-40 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-2 hours',
            '-20 minutes'
        ),
        datetime('now', '-2 days', '-2 hours'),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-2 hours',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-2 days',
            '-2 hours',
            '-20 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-2 days', '-3 hours'),
        datetime(
            'now',
            '-2 days',
            '-2 hours',
            '-40 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-3 hours',
            '-20 minutes'
        ),
        datetime('now', '-2 days', '-3 hours'),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-2 days',
            '-3 hours',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-2 days',
            '-3 hours',
            '-20 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    );

-- DAY 3 (3 DAYS AGO): 5 Wins
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
        datetime('now', '-3 days'),
        datetime(
            'now',
            '-3 days',
            '+10 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-3 days', '-1 hour'),
        datetime(
            'now',
            '-3 days',
            '-50 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-3 days', '-2 hours'),
        datetime(
            'now',
            '-3 days',
            '-1 hour',
            '-50 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-3 days', '-3 hours'),
        datetime(
            'now',
            '-3 days',
            '-2 hours',
            '-50 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-3 days', '-4 hours'),
        datetime(
            'now',
            '-3 days',
            '-3 hours',
            '-50 minutes'
        ),
        2,
        1,
        5,
        0,
        2,
        5,
        10,
        '1v1'
    );

-- DAY 4 (4 DAYS AGO): 14 Wins (Another high point)
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
        datetime('now', '-4 days'),
        datetime(
            'now',
            '-4 days',
            '+10 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-20 minutes'
        ),
        datetime('now', '-4 days'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-4 days',
            '-20 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-4 days', '-1 hour'),
        datetime(
            'now',
            '-4 days',
            '-40 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-1 hour',
            '-20 minutes'
        ),
        datetime('now', '-4 days', '-1 hour'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-1 hour',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-4 days',
            '-1 hour',
            '-20 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-4 days', '-2 hours'),
        datetime(
            'now',
            '-4 days',
            '-1 hour',
            '-40 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-2 hours',
            '-20 minutes'
        ),
        datetime('now', '-4 days', '-2 hours'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-2 hours',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-4 days',
            '-2 hours',
            '-20 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-4 days', '-3 hours'),
        datetime(
            'now',
            '-4 days',
            '-2 hours',
            '-40 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-3 hours',
            '-20 minutes'
        ),
        datetime('now', '-4 days', '-3 hours'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-3 hours',
            '-40 minutes'
        ),
        datetime(
            'now',
            '-4 days',
            '-3 hours',
            '-20 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime('now', '-4 days', '-4 hours'),
        datetime(
            'now',
            '-4 days',
            '-3 hours',
            '-40 minutes'
        ),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    ),
    (
        datetime(
            'now',
            '-4 days',
            '-4 hours',
            '-20 minutes'
        ),
        datetime('now', '-4 days', '-4 hours'),
        2,
        1,
        5,
        1,
        2,
        5,
        10,
        '1v1'
    );