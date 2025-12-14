
import Database from 'better-sqlite3';

const dbPath = './database/db';
const db = new Database(dbPath);

console.log("🌱 Starting seed with stats update...");

// 1. Get all users or create them if missing
let users = db.prepare('SELECT id, nickname FROM users').all();

if (users.length < 2) {
	console.log("⚠️ Not enough users found. Creating default users...");

	const insertUser = db.prepare(`
		INSERT INTO users (nickname, email, password, avatar) 
		VALUES (?, ?, ?, ?)
	`);

	const defaultUsers = [
		{ name: 'user1', email: 'user_1@gmail.com' },
		{ name: 'user2', email: 'user_2@gmail.com' },
		{ name: 'user3', email: 'user_3@gmail.com' },
		{ name: 'user4', email: 'user_4@gmail.com' }
	];

	for (const u of defaultUsers) {
		try {
			insertUser.run(u.name, u.email, 'password123', '/uploads/default.png');
		} catch (e) {
			console.log(`Skipping ${u.name} (might already exist)`);
		}
	}

	users = db.prepare('SELECT id, nickname FROM users').all();
}

console.log(`found ${users.length} users:`, users.map(u => u.nickname).join(', '));

// 2. Prepare Game State initialization
const initState = db.prepare(`
    INSERT OR IGNORE INTO gameStates (user_id, total_games, n_wins, n_loses, total_delta)
    VALUES (?, 0, 0, 0, 0)
`);

// 3. Prepare Stats Updates
const updateWin = db.prepare(`
    UPDATE gameStates
    SET total_games = total_games + 1,
        n_wins = n_wins + 1,
        total_delta = total_delta + 10
    WHERE user_id = ?
`);

const updateLoss = db.prepare(`
    UPDATE gameStates
    SET total_games = total_games + 1,
        n_loses = n_loses + 1,
        total_delta = MAX(0, total_delta - 10)
    WHERE user_id = ?
`);

// Initialize stats for all users
users.forEach(u => initState.run(u.id));

// 4. Generate pseudo-random matches
const MODES = ['classic', 'fast', 'blitz'];
const TOTAL_MATCHES = 60;

const insertMatch = db.prepare(`
    INSERT INTO match (
        created_at, finished_at, player1_id, player2_id, 
        player1_score, player2_score, winner_id, bestOf, delta, mode
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let createdCount = 0;

for (let i = 0; i < TOTAL_MATCHES; i++) {
	// Random pair
	const p1 = users[Math.floor(Math.random() * users.length)];
	let p2 = users[Math.floor(Math.random() * users.length)];
	while (p2.id === p1.id) {
		p2 = users[Math.floor(Math.random() * users.length)];
	}

	// Random result
	const p1Wins = Math.random() > 0.5;
	const winner = p1Wins ? p1 : p2;
	const loser = p1Wins ? p2 : p1;

	const bestOf = 5;

	// Scores
	const winnerScore = 5;
	const loserScore = Math.floor(Math.random() * 5);
	const p1Score = p1Wins ? winnerScore : loserScore;
	const p2Score = p1Wins ? loserScore : winnerScore;

	// Time
	const daysAgo = Math.floor(Math.random() * 7);
	const minutesAgo = Math.floor(Math.random() * 1440);

	const endDate = new Date();
	endDate.setDate(endDate.getDate() - daysAgo);
	endDate.setMinutes(endDate.getMinutes() - minutesAgo);

	const startDate = new Date(endDate);
	startDate.setMinutes(startDate.getMinutes() - 5);

	const fmt = (d) => d.toISOString().replace('T', ' ').slice(0, 19);

	try {
		// Insert Match
		insertMatch.run(
			fmt(startDate),
			fmt(endDate),
			p1.id,
			p2.id,
			p1Score,
			p2Score,
			winner.id,
			bestOf,
			10,
			MODES[Math.floor(Math.random() * MODES.length)]
		);

		// Update Stats
		updateWin.run(winner.id);
		updateLoss.run(loser.id);

		createdCount++;
	} catch (err) {
		console.error("Failed to insert match:", err.message);
	}
}

console.log(`✅ Successfully seeded ${createdCount} matches and updated stats!`);
db.close();
