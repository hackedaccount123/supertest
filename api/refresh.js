// Đặt loại nội dung là JSON cho tất cả phản hồi
const headers = {
    'Content-Type': 'application/json'
};

// Hàm ghi log lỗi (phiên bản đơn giản hóa của error_log trong PHP)
function logError(message) {
    console.error(`[${new Date().toISOString()}] ${message}`);
}

// Lấy cookie từ tham số URL
const urlParams = new URLSearchParams(window.location.search);
const cookie = urlParams.get('cookie');

if (!cookie) {
    document.write(JSON.stringify({
        success: false,
        error: "Yêu cầu phải có cookie"
    }));
    throw new Error("Yêu cầu phải có cookie");
}

async function fetchSessionCSRFToken(roblosecurityCookie) {
    try {
        const response = await fetch("https://auth.roblox.com/v2/logout", {
            method: "POST",
            headers: {
                "Cookie": `.ROBLOSECURITY=${roblosecurityCookie}`
            }
        });
        
        const csrfToken = response.headers.get("x-csrf-token");
        if (csrfToken) return csrfToken;
        
        logError("Không thể lấy mã CSRF.");
        return null;
    } catch (error) {
        logError(`Lỗi khi lấy mã CSRF: ${error.message}`);
        return null;
    }
}

async function generateAuthTicket(roblosecurityCookie) {
    const csrfToken = await fetchSessionCSRFToken(roblosecurityCookie);
    if (!csrfToken) return "Không thể lấy mã CSRF";

    try {
        const response = await fetch("https://auth.roblox.com/v1/authentication-ticket", {
            method: "POST",
            headers: {
                "x-csrf-token": csrfToken,
                "referer": "https://www.roblox.com/",
                "Content-Type": "application/json",
                "Cookie": `.ROBLOSECURITY=${roblosecurityCookie}`
            }
        });

        const authTicket = response.headers.get("rbx-authentication-ticket");
        if (authTicket) return authTicket;
        
        logError("Không thể lấy vé xác thực.");
        return "Không thể lấy vé xác thực";
    } catch (error) {
        logError(`Lỗi khi tạo vé xác thực: ${error.message}`);
        return "Không thể lấy vé xác thực";
    }
}

async function redeemAuthTicket(authTicket) {
    try {
        const response = await fetch("https://auth.roblox.com/v1/authentication-ticket/redeem", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "RBXAuthenticationNegotiation": "1"
            },
            body: JSON.stringify({ authenticationTicket: authTicket })
        });

        const cookies = response.headers.get("set-cookie");
        const cookieMatch = cookies?.match(/.ROBLOSECURITY=(.+?);/i);
        
        if (cookieMatch) {
            return {
                success: true,
                cookie: cookieMatch[1]
            };
        }
        
        logError("Không thể đổi vé xác thực.");
        return {
            success: false,
            error: "Không thể đổi vé xác thực"
        };
    } catch (error) {
        logError(`Lỗi khi đổi vé xác thực: ${error.message}`);
        return {
            success: false,
            error: "Không thể đổi vé xác thực"
        };
    }
}

async function main() {
    try {
        const authTicket = await generateAuthTicket(cookie);
        
        if (authTicket === "Không thể lấy vé xác thực" || 
            authTicket === "Không thể lấy mã CSRF") {
            document.write(JSON.stringify({
                success: false,
                error: authTicket
            }));
            return;
        }

        const redeemResult = await redeemAuthTicket(authTicket);
        document.write(JSON.stringify(redeemResult));
    } catch (error) {
        document.write(JSON.stringify({
            success: false,
            error: error.message
        }));
    }
}

// Thực thi hàm chính
main();
