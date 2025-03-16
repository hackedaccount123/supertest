const axios = require('axios');

// Helper function to simulate preg_match behavior
function pregMatch(regex, str) {
    if (!str) return null;
    const matches = str.match(regex);
    return matches ? matches[1] : null;
}

// Vercel Serverless Function handler
module.exports = async (req, res) => {
    // Log the start of the function
    console.log('Function invoked with query:', req.query);

    const cookie = req.query.cookie;
    if (!cookie) {
        console.log('Missing cookie parameter');
        return res.status(400).json({ error: 'Missing cookie parameter' });
    }

    try {
        console.log('Fetching CSRF token...');
        const csrfToken = await csrf(cookie);
        if (csrfToken === 'ratelimited') {
            console.log('Rate limited during CSRF fetch');
            return res.status(429).json({ error: 'Rate limited by Roblox' });
        }
        if (!csrfToken) {
            console.log('CSRF token not found');
            return res.status(400).json({ error: 'Failed to obtain CSRF token' });
        }

        console.log('Refreshing cookie with CSRF:', csrfToken);
        const refreshedCookie = await refresh(cookie, csrfToken);
        if (refreshedCookie === 'ratelimited') {
            console.log('Rate limited during refresh');
            return res.status(429).json({ error: 'Rate limited by Roblox' });
        }
        if (refreshedCookie === 'invalid cookie') {
            console.log('Invalid cookie detected');
            return res.status(400).json({ error: 'Invalid cookie provided' });
        }

        console.log('Successfully refreshed cookie');
        return res.status(200).json({ cookie: refreshedCookie });
    } catch (error) {
        console.error('Error in function:', error.message, error.stack);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

async function csrf(cookie) {
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

    if (response.status === 429) return 'ratelimited';
    return pregMatch(/X-CSRF-TOKEN:\s*(\S+)/i, response.headers['x-csrf-token'] || '');
}

async function refresh(cookie, csrfToken) {
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

    if (ticketResponse.status === 429) return 'ratelimited';
    const authTicket = pregMatch(/rbx-authentication-ticket:\s*([^\s]+)/i, ticketResponse.headers['rbx-authentication-ticket'] || '');
    if (!authTicket) return 'invalid cookie';

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

    if (redeemResponse.status === 429) return 'ratelimited';
    const output = redeemResponse.headers['set-cookie'] ? redeemResponse.headers['set-cookie'].join(';') : '';
    if (!output.includes('.ROBLOSECURITY=')) return 'invalid cookie';

    const bypassed = output.split('.ROBLOSECURITY=')[1].split(';')[0];
    const newCookie = bypassed.replace('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_', '');
    return newCookie.length === 0 ? 'invalid cookie' : newCookie;
}
