import metrics from '../utils/utils.prometheus.js'

const friendModel = {

	async initFriend(db) {
		const query = `
			CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            friend1_id INTEGER NOT NULL,
            friend2_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (friend1_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (friend2_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (friend1_id, friend2_id)
            )
		`

		await db.prepare(query).run()
	},

	async checkFriend(db, friend1_id, friend2_id) {
		const query = `SELECT id FROM friends WHERE friend1_id = ? AND friend2_id = ?`
		try {
			const result = await db.prepare(query).get(friend1_id, friend2_id)
			metrics.trackDatabaseQuery('SELECT', 'friends', 'success')
			if (result)
				return true
			return false
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'friends', 'error')
			throw error
		}
	},

	async createFriend(db, friend1_id, friend2_id) {
		const query = `INSERT INTO friends (friend1_id, friend2_id) VALUES (?, ?), (?, ?)`
		try {
			const result = await db.prepare(query).run(friend1_id, friend2_id, friend2_id, friend1_id)
			metrics.trackDatabaseQuery('INSERT', 'friends', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('INSERT', 'friends', 'error')
			throw error
		}
	},

	async getFriends(db, user_id) {
		const query = `
			SELECT u.id, u.nickname, u.avatar
			FROM friends f
			JOIN users u
			ON u.id = f.friend2_id
			WHERE f.friend1_id = ?
		`
		try {
			const result = await db.prepare(query).all(user_id)
			metrics.trackDatabaseQuery('SELECT', 'friends', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'friends', 'error')
			throw error
		}
	},

	// this function is only for GDPR
	async getFriendsNicknames(db, user_id) {
		const query = `
			SELECT u.nickname
			FROM friends f
			JOIN users u
			ON u.id = f.friend2_id
			WHERE f.friend1_id = ?
		`
		try {
			const result = await db.prepare(query).all(user_id)
			metrics.trackDatabaseQuery('SELECT', 'friends', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'friends', 'error')
			throw error
		}
	}

}

export default friendModel