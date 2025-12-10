import metrics from '../utils/utils.prometheus.js'

const blockModel = {

    async initBlock(db) {
        const query = `
                CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                blocker_id INTEGER NOT NULL,
                blocked_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (blocker_id, blocked_id)
                )
        `
        await db.prepare(query).run()
    },

    async createBlock(db, blocker_id, blocked_id) {
        const query = `INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)`
        try {
            const result = await db.prepare(query).run(blocker_id, blocked_id)
            metrics.trackDatabaseQuery('INSERT', 'blocks', 'success')
            return result.changes
        } catch (error) {
            metrics.trackDatabaseQuery('INSERT', 'blocks', 'error')
            throw error
        }
    },

    async getBlocks(db, blocker_id) {
        const query = `SELECT users.id, users.nickname, users.avatar
                        FROM blocks
                        JOIN users ON users.id = blocks.blocked_id
                        WHERE blocks.blocker_id = ?`
        try {
            const result = await db.prepare(query).all(blocker_id)
            metrics.trackDatabaseQuery('SELECT', 'blocks', 'success')
            return result
        } catch (error) {
            metrics.trackDatabaseQuery('SELECT', 'blocks', 'error')
            throw error
        }
    },

    async removeBlock(db, blocker_id, blocked_id) {
        const query = `DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?`
        try {
            const result = await db.prepare(query).run(blocker_id, blocked_id)
            metrics.trackDatabaseQuery('DELETE', 'blocks', 'success')
            return result.changes
        } catch (error) {
            metrics.trackDatabaseQuery('DELETE', 'blocks', 'error')
            throw error
        }
    },

    async checkBlock(db, blocker_id, blocked_id) {
        const query = `SELECT * FROM blocks WHERE blocker_id = ? AND blocked_id = ?`
        try {
            const result = await db.prepare(query).get(blocker_id, blocked_id)
            metrics.trackDatabaseQuery('SELECT', 'blocks', 'success')
            return result
        } catch (error) {
            metrics.trackDatabaseQuery('SELECT', 'blocks', 'error')
            throw error
        }
    },

    async removeAllBlocks(db, user_id) {
        const query = `DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?`
        try {
            const result = await db.prepare(query).run(user_id, user_id)
            metrics.trackDatabaseQuery('DELETE', 'blocks', 'success')
            return result.changes
        } catch (error) {
            metrics.trackDatabaseQuery('DELETE', 'blocks', 'error')
            throw error
        }
    }
}


export default blockModel