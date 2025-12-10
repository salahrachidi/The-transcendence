import metrics from '../utils/utils.prometheus.js'

const gameStateModel = {

	async initGameStates(db) {
		const query = `
			CREATE TABLE IF NOT EXISTS gameStates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                total_games INTEGER NOT NULL DEFAULT 0,
				n_wins INTEGER NOT NULL DEFAULT 0,
				n_loses INTEGER NOT NULL DEFAULT 0,
				total_delta INTEGER NOT NULL DEFAULT 0,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
				UNIQUE(user_id)
            )
		`

		await db.prepare(query).run()
	},

	async createGameStates(db, user_id) {
		const query = `INSERT INTO gameStates (user_id) VALUES (?)`
		try {
			const result = await db.prepare(query).run(user_id)
			metrics.trackDatabaseQuery('INSERT', 'gameStates', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('INSERT', 'gameStates', 'error')
			throw error
		}
	},

	async getUserGameStates(db, user_id) {
		const query = `SELECT user_id, total_games, n_wins, n_loses, total_delta
						FROM gameStates
						WHERE user_id = ?`
		try {
			const result = await db.prepare(query).get(user_id)
			metrics.trackDatabaseQuery('SELECT', 'gameStates', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'gameStates', 'error')
			throw error
		}
	},

	async registerWin(db, user_id) {
		const query = `
            UPDATE gameStates
            SET total_games = total_games + 1,
                n_wins = n_wins + 1,
                total_delta = total_delta + 10
            WHERE user_id = ?
        `
		try {
			const result = await db.prepare(query).run(user_id)
			metrics.trackDatabaseQuery('UPDATE', 'gameStates', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'gameStates', 'error')
			throw error
		}
	},

	async registerLoss(db, user_id) {
		const query = `
            UPDATE gameStates
            SET total_games = total_games + 1,
                n_loses = n_loses + 1,
                total_delta = MAX(0, total_delta - 10)
            WHERE user_id = ?
        `
		try {
			const result = await db.prepare(query).run(user_id)
			metrics.trackDatabaseQuery('UPDATE', 'gameStates', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'gameStates', 'error')
			throw error
		}
	},

	async getLeaderboard(db, limit = 10) {
		const query = `
			-- added by xeloda: select users.id for frontend keying
			SELECT users.id, users.nickname, users.avatar, gameStates.n_wins, gameStates.total_delta
			FROM gameStates
			JOIN users ON users.id = gameStates.user_id
			ORDER BY gameStates.total_delta DESC
			LIMIT ?
		`
		try {
			const result = await db.prepare(query).all(limit)
			metrics.trackDatabaseQuery('SELECT', 'gameStates', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'gameStates', 'error')
			throw error
		}
	}
}

export default gameStateModel