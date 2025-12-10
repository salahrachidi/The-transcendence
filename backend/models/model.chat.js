import metrics from '../utils/utils.prometheus.js'

const chatModel = {

	async initChat(database) {
		const messagesQuery = `
			CREATE TABLE IF NOT EXISTS messages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				sender_id INTEGER,
				receiver_id INTEGER,
				message TEXT NOT NULL,
				timestamp TEXT NOT NULL,
				is_seen INTEGER,
				FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
				FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE RESTRICT
			)
		`;

		const conversationsQuery = `
			CREATE TABLE IF NOT EXISTS conversations (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user1_id INTEGER NOT NULL,
				user2_id INTEGER NOT NULL,
				last_message TEXT,
				last_timestamp TEXT NOT NULL,
				UNIQUE(user1_id, user2_id),
				FOREIGN KEY (user1_id) REFERENCES users(id),
				FOREIGN KEY (user2_id) REFERENCES users(id)
			)
		`;

		await database.prepare(messagesQuery).run();
		await database.prepare(conversationsQuery).run();
	},

	async addMessage(database, senderUsername, receiverUsername, message, timestamp, isSeen) {
		const query = `
			INSERT INTO messages (sender_id, receiver_id, message, timestamp, is_seen) 
			VALUES (
				(SELECT id FROM users WHERE nickname = ?),
				(SELECT id FROM users WHERE nickname = ?),
				?, ?, ?
			)
		`
		try {
			const result = await database.prepare(query).run(senderUsername, receiverUsername, message, timestamp, isSeen)
			metrics.trackDatabaseQuery('INSERT', 'messages', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('INSERT', 'messages', 'error')
			throw error
		}
	},

	async getMessage(database, senderId, receiverId, limit = 10, offset = 0) {
		const query = `
			SELECT
				sender_id,
				receiver_id,
				message,
				timestamp,
				is_seen
			FROM messages 
			WHERE (sender_id = ? AND receiver_id = ?)
				OR (sender_id = ? AND receiver_id = ?)
			ORDER BY timestamp ASC
			LIMIT ? OFFSET ?
		`
		try {
			const result = await database.prepare(query).all(senderId, receiverId, receiverId, senderId, limit, offset)
			metrics.trackDatabaseQuery('SELECT', 'messages', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'messages', 'error')
			throw error
		}
	},

	async setAsSeen(database, senderId, receiverId) {
		const query = `
			UPDATE messages 
			SET is_seen = 1 
			WHERE sender_id = ? 
			AND receiver_id = ? 
			AND is_seen = 0
		`
		try {
			const result = await database.prepare(query).run(senderId, receiverId)
			metrics.trackDatabaseQuery('UPDATE', 'messages', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'messages', 'error')
			throw error
		}
	},

	async getConversations(database, userId, limit = 10, offset = 0) {
		const query = `
			SELECT 
				c.*,
				u.nickname as contact_name,
				u.avatar as contact_avatar,
				u.id as contact_id,
				-- added by xeloda: user block status
				(SELECT COUNT(*) FROM blocks WHERE blocker_id = ? AND blocked_id = u.id) as is_blocked_by_me,
				(SELECT COUNT(*) FROM blocks WHERE blocker_id = u.id AND blocked_id = ?) as is_blocked_by_them
			FROM conversations c
			JOIN users u ON (c.user1_id = u.id OR c.user2_id = u.id)
			WHERE (c.user1_id = ? OR c.user2_id = ?)
				AND u.id != ?
			ORDER BY c.last_timestamp DESC
			LIMIT ? OFFSET ?
		`
		try {
			const result = await database.prepare(query).all(userId, userId, userId, userId, userId, limit, offset)
			metrics.trackDatabaseQuery('SELECT', 'conversations', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'conversations', 'error')
			throw error
		}
	},

	async findConversation(database, user1Id, user2Id) {
		const query = `
			SELECT id FROM conversations
			WHERE (user1_id = ? AND user2_id = ?)
				OR (user1_id = ? AND user2_id = ?)
		`
		try {
			const result = await database.prepare(query).get(user1Id, user2Id, user2Id, user1Id)
			metrics.trackDatabaseQuery('SELECT', 'conversations', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'conversations', 'error')
			throw error
		}
	},

	async insertConversation(database, user1Id, user2Id, lastMessage, lastTimestamp) {
		const query = `
			INSERT INTO conversations (user1_id, user2_id, last_message, last_timestamp)
			VALUES (?, ?, ?, ?)
		`
		try {
			const result = await database.prepare(query).run(user1Id, user2Id, lastMessage, lastTimestamp)
			metrics.trackDatabaseQuery('INSERT', 'conversations', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('INSERT', 'conversations', 'error')
			throw error
		}
	},

	async updateConversation(database, user1Id, user2Id, lastMessage, lastTimestamp) {
		const query = `
			UPDATE conversations
			SET last_message = ?, last_timestamp = ?
			WHERE (user1_id = ? AND user2_id = ?)
				OR (user1_id = ? AND user2_id = ?)
		`
		try {
			const result = await database.prepare(query).run(lastMessage, lastTimestamp, user1Id, user2Id, user2Id, user1Id)
			metrics.trackDatabaseQuery('UPDATE', 'conversations', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('UPDATE', 'conversations', 'error')
			throw error
		}
	},

	async deleteConversation(database, user1Id, user2Id) {
		const query = `
			DELETE FROM conversations
			WHERE (user1_id = ? AND user2_id = ?)
				OR (user1_id = ? AND user2_id = ?)
		`
		try {
			const result = await database.prepare(query).run(user1Id, user2Id, user2Id, user1Id)
			metrics.trackDatabaseQuery('DELETE', 'conversations', 'success')
			return result.changes
		} catch (error) {
			metrics.trackDatabaseQuery('DELETE', 'conversations', 'error')
			throw error
		}
	},

	async upsertConversation(database, user1Id, user2Id, lastMessage, lastTimestamp) {
		const exists = await this.findConversation(database, user1Id, user2Id)

		if (exists) {
			return await this.updateConversation(database, user1Id, user2Id, lastMessage, lastTimestamp)
		} else {
			return await this.insertConversation(database, user1Id, user2Id, lastMessage, lastTimestamp)
		}
	},

	async getUsersIdByConvId(database, conversationId) {
		const query = `
			SELECT user1_id, user2_id
			FROM conversations
			WHERE id = ?
		`
		try {
			const result = await database.prepare(query).get(conversationId)
			metrics.trackDatabaseQuery('SELECT', 'conversations', 'success')
			return result
		} catch (error) {
			metrics.trackDatabaseQuery('SELECT', 'conversations', 'error')
			throw error
		}
	}
}

export default chatModel
