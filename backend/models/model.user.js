import metrics from '../utils/utils.prometheus.js'

const userModel = {

	async initUser(db) {
		const query = `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nickname TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                avatar TEXT,
                two_factor_secret TEXT,
                is_two_factor_enabled BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `
		await db.prepare(query).run()
	},

	// getters:

	async getAllUsers(db) {
		const query = `SELECT * FROM users`
		try {
			const res = await db.prepare(query).all()
			metrics.trackDatabaseQuery('SELECT', 'users', 'success')
			return res
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'users', 'error')
			throw error
		}
	},

	async getUserById(db, user_id) {
		const query = `SELECT * FROM users WHERE id = ?`
		try {
			const res = await db.prepare(query).get(user_id)
			metrics.trackDatabaseQuery('SELECT', 'users', 'success')
			return res
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'users', 'error')
			throw error
		}
	},

	async getUserByName(db, user_name) {
		const query = `SELECT * FROM users WHERE nickname = ?`
		try {
			const res = await db.prepare(query).get(user_name)
			metrics.trackDatabaseQuery('SELECT', 'users', 'success')
			return res
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'users', 'error')
			throw error
		}
	},

	async getUserByEmail(db, email) {
		const query = `SELECT * FROM users WHERE email = ?`
		try {
			const res = await db.prepare(query).get(email)
			metrics.trackDatabaseQuery('SELECT', 'users', 'success')
			return res
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'users', 'error')
			throw error
		}
	},

	// CRUD operations:

	async addUser(db, nickname, email, password) {
		const query = `INSERT INTO users (nickname, email, password, avatar) VALUES (?, ?, ?, ?)`
		try {
			const res = await db.prepare(query).run(nickname, email, password, '/uploads/default.png')
			metrics.trackDatabaseQuery('INSERT', 'users', 'success')
			return res.lastInsertRowid
		} catch (error) {
			metrics.trackDatabaseQuery('INSERT', 'users', 'error')
			throw error
		}
	},

	async updateUser(db, user_id, nickname, password, email) {
		const query = `UPDATE users SET nickname = ?, password = ?, email = ? WHERE id = ?`
		try {
			const res = await db.prepare(query).run(nickname, password, email, user_id)
			metrics.trackDatabaseQuery('UPDATE', 'users', 'success')
			return res.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'users', 'error')
			throw error
		}
	},

	async updateAvatar(db, user_id, avatar) {
		const query = `UPDATE users SET avatar = ? WHERE id = ?`
		try {
			const result = await db.prepare(query).run(avatar, user_id)
			metrics.trackDatabaseQuery('UPDATE', 'users', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'users', 'error')
			throw error
		}
	},

	async deleteUser(db, user_id) {
		const query = `DELETE FROM users WHERE id = ?`
		try {
			const res = await db.prepare(query).run(user_id)
			metrics.trackDatabaseQuery('DELETE', 'users', 'success')
			return res.changes
		} catch (error) {
			metrics.trackDatabaseQuery('DELETE', 'users', 'error')
			throw error
		}
	},

	async deleteAllUsers(db) {
		const query = `DELETE FROM users`
		try {
			const res = await db.prepare(query).run()
			metrics.trackDatabaseQuery('DELETE', 'users', 'success')
			return res.changes
		} catch (error) {
			metrics.trackDatabaseQuery('DELETE', 'users', 'error')
			throw error
		}
	},

	// added by xeloda: add method to update user record with random data for GDPR anonymization
	async anonymizeUser(db, user_id) {
		const anonymousNickname = `AnonymousUser_${user_id}`
		const anonymousEmail = `anonymous_${user_id}@transcendence.local`
		const randomPassword = Math.random().toString(36).slice(-8)

		const query = `
			UPDATE users 
			SET nickname = ?, email = ?, password = ?, avatar = NULL, two_factor_secret = NULL, is_two_factor_enabled = 0 
			WHERE id = ?
		`
		//console.log("Anonymizing User:", { user_id, anonymousNickname, anonymousEmail })
		try {
			const res = await db.prepare(query).run(anonymousNickname, anonymousEmail, randomPassword, user_id)
			metrics.trackDatabaseQuery('UPDATE', 'users', 'success')
			return res.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'users', 'error')
			throw error
		}
	},

	// helpers :
	// added by xeloda: verifieed by mel-houd
	async checkEmailDup(db, email, excludeId = null) {
		let query = `SELECT id FROM users WHERE email = ?`
		let params = [email]
		if (excludeId) {
			query += ` AND id != ?`
			params.push(excludeId)
		}
		try {
			const res = await db.prepare(query).all(...params)
			metrics.trackDatabaseQuery('SELECT', 'users', 'success')
			if (res.length > 0) {
				return false
			}
			return true
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'users', 'error')
			throw error
		}
	},

	// added by xeloda: verified by mel-houd
	async checkNameDup(db, nickname, excludeId = null) {
		let query = `SELECT id FROM users WHERE nickname = ?`
		let params = [nickname]
		if (excludeId) {
			query += ` AND id != ?`
			params.push(excludeId)
		}
		try {
			const res = await db.prepare(query).all(...params)
			metrics.trackDatabaseQuery('SELECT', 'users', 'success')
			if (res.length > 0) {
				return false
			}
			return true
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'users', 'error')
			throw error
		}
	},

	// 2fa:
	async enable2FA(db, user_id) {
		const query = `UPDATE users SET is_two_factor_enabled = ? WHERE id = ?`
		try {
			const res = await db.prepare(query).run(1, user_id)
			metrics.trackDatabaseQuery('UPDATE', 'users', 'success')
			return res.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'users', 'error')
			throw error
		}
	},

	async disable2FA(db, user_id) {
		const query = `UPDATE users SET is_two_factor_enabled = ?, two_factor_secret = ? WHERE id = ?`
		try {
			const res = await db.prepare(query).run(0, null, user_id)
			metrics.trackDatabaseQuery('UPDATE', 'users', 'success')
			return res.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'users', 'error')
			throw error
		}
	},

	async setTwoFactorSecret(db, userId, secret) {
		const query = `UPDATE users SET two_factor_secret = ? WHERE id = ?`
		try {
			const res = await db.prepare(query).run(secret, userId)
			metrics.trackDatabaseQuery('UPDATE', 'users', 'success')
			return res.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'users', 'error')
			throw error
		}
	}
}

export default userModel