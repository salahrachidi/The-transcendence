import metrics from '../utils/utils.prometheus.js'

const matchModel = {

	async initMatch(db) {
		const query = `
			CREATE TABLE IF NOT EXISTS match (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				finished_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
				player1_id INTEGER NOT NULL,
				player2_id INTEGER NOT NULL,
				player1_score INTEGER NOT NULL,
				player2_score INTEGER NOT NULL,
				winner_id INTEGER NOT NULL,
				bestOf INTEGER NOT NULL,
				delta INTEGER,
				mode TEXT NOT NULL DEFAULT 'remote',
				FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
				FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE
        )`

		await db.prepare(query).run()
	},

	async createMatch(db, matchData) {
		const {
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
		} = matchData

		const query = `
			INSERT INTO match (
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
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		try {
			const result = await db.prepare(query).run(
				created_at,
				finished_at,
				player1_id,
				player2_id,
				player1_score,
				player2_score,
				winner_id,
				bestOf,
				delta,
				mode || 'remote'
			)
			metrics.trackDatabaseQuery('INSERT', 'match', 'success')
			return result.lastID
		} catch (error) {
			metrics.trackDatabaseQuery('INSERT', 'match', 'error')
			throw error
		}
	},

	async getMatchById(db, match_id) {
		const query = `
			SELECT
				id,
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
			FROM match
			WHERE id = ?
		`
		try {
			const result = await db.prepare(query).get(match_id)
			metrics.trackDatabaseQuery('SELECT', 'match', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'match', 'error')
			throw error
		}
	},

	async getUserMatches(db, user_id, limit = 10) {
		const query = `
			SELECT
				id,
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
			FROM match
			WHERE player1_id = ? OR player2_id = ?
			ORDER BY finished_at DESC
			LIMIT ?
		`
		try {
			const result = await db.prepare(query).all(user_id, user_id, limit)
			metrics.trackDatabaseQuery('SELECT', 'match', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'match', 'error')
			throw error
		}
	}

}

export default matchModel