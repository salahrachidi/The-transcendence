const jwtModel = {

    async initJwt(db) {
        const query = `
            CREATE TABLE IF NOT EXISTS jwts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `
        await db.prepare(query).run()
    },

    async addJwt(db, token, expires_at) {
        const query = `INSERT INTO jwts (token, expires_at) VALUES (?, ?)`
        const res = await db.prepare(query).run(token, expires_at)
        return res.lastInsertRowid
    },

    async deleteJwt(db, token) {
        const query = `DELETE FROM jwts WHERE token = ?`
        const res = await db.prepare(query).run(token)
        return res.changes
    },

    async getJwt(db, token) {
        const query = `SELECT * FROM jwts WHERE token = ?`
        const res = await db.prepare(query).get(token)
        return res
    },

    async cleanupExpiredTokens(db) {
        const query = `DELETE FROM jwts WHERE expires_at <= datetime('now')`
        const result = db.prepare(query).run()
        return result.changes
    },

}

export default jwtModel