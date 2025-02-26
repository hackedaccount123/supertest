// c:\Users\PC\discord-webhook-api\sendDiscordWebhook.js
import axios from 'axios';

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1281163629278003221/UsFxAWKVhLDb37jw3eQdN7hqsXAxVYR6aZQLKrYC4oja7qqhW5PLDR45f5ztbAM4rSmY';

export const sendDiscordWebhook = async (combinedWebhook) => {
    try {
        // Gửi webhook đến Discord
        await axios.post(DISCORD_WEBHOOK_URL, combinedWebhook);
        console.log('Gửi webhook đến Discord thành công');
    } catch (error) {
        console.error('Lỗi gửi webhook:', error.message);
    }
};