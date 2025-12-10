import { authenticator } from 'otplib';
import qrcode from 'qrcode';

const twoFactorService = {
    
    generateUniqueSecret() {
        return authenticator.generateSecret();
    },

    generateOtpAuthUrl(nickname, secret) {
        const issuer = 'ft_descendence '
        return authenticator.keyuri(nickname, issuer, secret)
    },

    async generateQrCodeDataURL(otpauthUrl) {
        return qrcode.toDataURL(otpauthUrl)
    },

    verifyToken(secret, token_2fa) {
        return authenticator.verify({ token: token_2fa, secret })
    }
}

export default twoFactorService;