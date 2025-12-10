import fp from 'fastify-plugin'
import fjwt from '@fastify/jwt'
import jwtCookieParams from '../utils/utils.jwtCookie.js'
import jwtModel from '../models/model.jwt.js'

async function authPlugin(server, options) {

    await server.register(fjwt, {
    secret: process.env.JWT_SECRET || "Corazon",
        cookie: {
            cookieName: 'token',
            signed: false
        },
        sign: {
            expiresIn: jwtCookieParams.jwt.time // Default expiration for all tokens
        }
    })

    server.decorate('auth', async function (request, reply) {
        try {
            const token = request.cookies.token

            if (!token) {
                return reply.status(401).send({
                    success: false,
                    result: 'No token provided' 
                })
            }

            const result = await jwtModel.getJwt(this.db, token)

            if (result !== undefined) {
                reply.status(403).send({
                    success: false,
                    result: 'black listed auth token'
                })
            }

            await request.jwtVerify()

        } catch (err) {
            reply.code(401).send({
                success: false,
                result: err.message
            })
        }
    })

    server.decorate('generateToken', function (payload) {
        return this.jwt.sign(payload, { expiresIn: jwtCookieParams.jwt.time })
    })
}

export default fp(authPlugin)