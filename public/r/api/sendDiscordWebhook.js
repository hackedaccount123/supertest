// c:\Users\PC\discord-webhook-api\sendDiscordWebhook.js
import axios from 'axios';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1348841245392371802/JMvBB1WMwEomiHcvYmgyqzCaL_xhYJc1f9NKsG1RFMQC_LFmT6u24c0H3FWxKGBv7o8h';

export const sendDiscordWebhook = async (combinedWebhook) => {
    try {
        // Gửi webhook đến Discord
        await axios.post(DISCORD_WEBHOOK_URL, combinedWebhook);
        console.log('Gửi webhook đến Discord thành công');
    } catch (error) {
        console.error('Lỗi gửi webhook:', error.message);
    }
};
