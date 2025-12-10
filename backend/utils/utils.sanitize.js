import bcrypt from 'bcrypt'
import randomstring from 'randomstring'

const sanitizer = {

    async hashPassword(password) {
        const salt = 10
        try {
            const hash = await bcrypt.hash(password, salt)
            return hash
        } catch (error) {
            throw new Error('error hashing password')
        }
    },

    async checkPassword(hashed_password, password) {
        try {
            return await bcrypt.compare(password, hashed_password)
        } catch (error) {
            throw new Error('error comparing passwords')
        }
    },


    generateRandomString(len) {
        return randomstring.generate(len)
    },

    generateRandomNumber(len) {
        return randomstring.generate({
            length: len,
            charset: ['numeric']
        })
    },

    sanitizeUser(user) {
        if (!user) return null
        const { password, two_factor_secret, ...safeUser } = user
        return safeUser
    }

}

export default sanitizer