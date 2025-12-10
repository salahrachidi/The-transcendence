const jwtCookieParams = {
    cookie: {
        path: '/',
        secure: true, // set to true in production with HTTPS
        httpOnly: true,
        sameSite: 'lax',
    },

    jwt: {
        time: '24h',
        log: true
    },

    scheduleTokenRemoval(server, token, expiresInMs) {
        setTimeout(() => {
            server.tokenBlacklist.delete(token);
            console.log(`token automatically removed from blacklist: ${token.substring(0, 20)}...`);
        }, expiresInMs);
    }
}

export default jwtCookieParams