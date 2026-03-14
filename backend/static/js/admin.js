const API = "";

/* ==============================
   TAB SWITCHING
============================== */
function switchTab(tabId) {
    document.querySelectorAll(".tab").forEach(btn =>
        btn.classList.remove("active")
    );

    document.querySelectorAll(".tab-content").forEach(tab =>
        tab.classList.remove("active")
    );

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.classList.add("active");
    }

    document.querySelectorAll(".tab").forEach(btn => {
        const onclickValue = btn.getAttribute("onclick") || "";
        if (onclickValue.includes(tabId)) {
            btn.classList.add("active");
        }
    });
}

/* ==============================
   AUTO SWITCH AFTER QUIZ
============================== */
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("show") === "leaderboard") {
    switchTab("leaderboard");
}

/* ==============================
   LOAD ADMIN DATA
============================== */
async function loadAdminData() {
    try {
        const usersResponse = await fetch(API + "/admin/users");
        const scoresResponse = await fetch(API + "/admin/scores");
        const contentResponse = await fetch(API + "/admin/content");

        const usersData = await usersResponse.json();
        const scoresData = await scoresResponse.json();
        const contentData = await contentResponse.json();

        const users = usersData.users || [];
        const scores = scoresData.scores || [];
        const content = contentData.content || [];

        /* ===== DASHBOARD STATS ===== */
        const totalUsersEl = document.getElementById("totalUsers");
        const totalQuizzesEl = document.getElementById("totalQuizzes");
        const totalContentEl = document.getElementById("totalContent");
        const feedbackRateEl = document.getElementById("feedbackRate");

        if (totalUsersEl) totalUsersEl.innerText = users.length;
        if (totalQuizzesEl) totalQuizzesEl.innerText = scores.length;
        if (totalContentEl) totalContentEl.innerText = content.length;

        let totalAccuracy = 0;
        scores.forEach(s => totalAccuracy += Number(s.accuracy) || 0);

        const avgAccuracy = scores.length > 0
            ? (totalAccuracy / scores.length).toFixed(1)
            : 0;

        if (feedbackRateEl) {
            feedbackRateEl.innerText = avgAccuracy + "%";
        }

        /* ===== USERS TABLE ===== */
        let usersHTML = `
            <table class="admin-table">
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                </tr>
        `;

        if (users.length === 0) {
            usersHTML += `
                <tr>
                    <td colspan="2">No users found</td>
                </tr>
            `;
        } else {
            users.forEach(u => {
                usersHTML += `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.email}</td>
                    </tr>
                `;
            });
        }

        usersHTML += `</table>`;

        const usersTableEl = document.getElementById("usersTable");
        if (usersTableEl) {
            usersTableEl.innerHTML = usersHTML;
        }

        /* ===== LEADERBOARD TABLE ===== */
        scores.sort((a, b) => (b.score || 0) - (a.score || 0));

        let scoresHTML = `
            <table class="admin-table">
                <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Avg Time (s)</th>
                </tr>
        `;

        if (scores.length === 0) {
            scoresHTML += `
                <tr>
                    <td colspan="5">No quiz attempts yet</td>
                </tr>
            `;
        } else {
            scores.forEach((s, index) => {
                const highlight = index === 0 ? "top-performer" : "";

                scoresHTML += `
                    <tr class="${highlight}">
                        <td>${index + 1}</td>
                        <td>${s.user_email || "-"}</td>
                        <td>${s.score || 0}</td>
                        <td>${s.accuracy || 0}%</td>
                        <td>${s.avg_time || 0}s</td>
                    </tr>
                `;
            });
        }

        scoresHTML += `</table>`;

        const scoresTableEl = document.getElementById("scoresTable");
        if (scoresTableEl) {
            scoresTableEl.innerHTML = scoresHTML;
        }

        /* ===== CONTENT TABLE ===== */
        let contentHTML = `
            <table class="admin-table">
                <tr>
                    <th>ID</th>
                    <th>Preview</th>
                </tr>
        `;

        if (content.length === 0) {
            contentHTML += `
                <tr>
                    <td colspan="2">No content uploaded yet</td>
                </tr>
            `;
        } else {
            content.forEach(c => {
                const preview = c.text
                    ? (c.text.length > 80 ? c.text.substring(0, 80) + "..." : c.text)
                    : "-";

                contentHTML += `
                    <tr>
                        <td>${c.id}</td>
                        <td>${preview}</td>
                    </tr>
                `;
            });
        }

        contentHTML += `</table>`;

        const contentTableEl = document.getElementById("contentTable");
        if (contentTableEl) {
            contentTableEl.innerHTML = contentHTML;
        }

    } catch (error) {
        console.error("Admin Load Error:", error);

        const usersTableEl = document.getElementById("usersTable");
        const scoresTableEl = document.getElementById("scoresTable");
        const contentTableEl = document.getElementById("contentTable");

        if (usersTableEl) usersTableEl.innerHTML = "<p>Failed to load users.</p>";
        if (scoresTableEl) scoresTableEl.innerHTML = "<p>Failed to load leaderboard.</p>";
        if (contentTableEl) contentTableEl.innerHTML = "<p>Failed to load content.</p>";
    }
}

loadAdminData();