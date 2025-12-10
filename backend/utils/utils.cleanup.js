import jwtModel from '../models/model.jwt.js'

class CleanupScheduler {
    constructor(db) {
        this.db = db
        this.intervalId = null
    }

    async start(intervalMs = 60 * 60 * 1000) {
        await jwtModel.cleanupExpiredTokens(this.db)

        this.intervalId = setInterval(async () => {
            await jwtModel.cleanupExpiredTokens(this.db)
        }, intervalMs)

        //console.log('SQLite token cleanup scheduler started')
    }

    async cleanupExpiredTokens() {
        try {
            const result = await jwtModel.cleanupExpiredTokens(this.db)
            
            if (result.changes > 0) {
                console.log(`Cleaned up ${result.changes} expired JWT tokens`)
            }

            return result.changes
            
        } catch (error) {
            console.error('Token cleanup failed:', error)
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId)
            console.log('Token cleanup scheduler stopped')
        }
    }
}

export default CleanupScheduler