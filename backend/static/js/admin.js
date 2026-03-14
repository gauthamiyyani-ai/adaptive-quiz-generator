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

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add("active");
    }

    document.querySelectorAll(".tab").forEach(btn => {
        const onclickValue = btn.getAttribute("onclick") || "";
        if (onclickValue.includes(tabId)) {
            btn.classList.add("active");
        }
    });
}

/* ==============================
   AUTO SWITCH AFTER URL PARAM
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

        /* ==============================
           SORT LEADERBOARD BY SCORE
        ============================== */
        scores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return (b.accuracy || 0) - (a.accuracy || 0);
        });

        /* ==============================
           DASHBOARD STATS
        ============================== */
        const totalUsersEl = document.getElementById("totalUsers");
        const totalQuizzesEl = document.getElementById("totalQuizzes");
        const totalContentEl = document.getElementById("totalContent");
        const feedbackRateEl = document.getElementById("feedbackRate");

        if (totalUsersEl) totalUsersEl.innerText = users.length;
        if (totalQuizzesEl) totalQuizzesEl.innerText = scores.length;
        if (totalContentEl) totalContentEl.innerText = content.length;

        let totalAccuracy = 0;
        scores.forEach(s => {
            totalAccuracy += parseFloat(s.accuracy || 0);
        });

        const avgAccuracy = scores.length > 0
            ? (totalAccuracy / scores.length).toFixed(1)
            : 0;

        if (feedbackRateEl) feedbackRateEl.innerText = avgAccuracy + "%";

        /* ==============================
           USERS TABLE
        ============================== */
        const usersTableEl = document.getElementById("usersTable");

        if (usersTableEl) {
            if (users.length === 0) {
                usersTableEl.innerHTML = `<p>No registered users found.</p>`;
            } else {
                let usersHTML = `
                    <table class="admin-table">
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                        </tr>
                `;

                users.forEach(u => {
                    usersHTML += `
                        <tr>
                            <td>${u.id}</td>
                            <td>${u.email}</td>
                        </tr>
                    `;
                });

                usersHTML += `</table>`;
                usersTableEl.innerHTML = usersHTML;
            }
        }

        /* ==============================
           LEADERBOARD TABLE
        ============================== */
        const scoresTableEl = document.getElementById("scoresTable");

        if (scoresTableEl) {
            if (scores.length === 0) {
                scoresTableEl.innerHTML = `<p>No quiz attempts yet.</p>`;
            } else {
                let scoresHTML = `
                    <table class="admin-table">
                        <tr>
                            <th>Rank</th>
                            <th>User</th>
                            <th>Score</th>
                            <th>Accuracy</th>
                            <th>Avg Time (s)</th>
                            <th>Performance</th>
                        </tr>
                `;

                scores.forEach((s, index) => {
                    const highlight = index === 0 ? "top-performer" : "";

                    let performanceLabel = "Beginner";
                    const accuracy = parseFloat(s.accuracy || 0);

                    if (accuracy >= 80) {
                        performanceLabel = "Advanced";
                    } else if (accuracy >= 50) {
                        performanceLabel = "Intermediate";
                    }

                    scoresHTML += `
                        <tr class="${highlight}">
                            <td>${index + 1}</td>
                            <td>${s.user_email}</td>
                            <td>${s.score}</td>
                            <td>${s.accuracy || 0}%</td>
                            <td>${s.avg_time || 0}s</td>
                            <td>${performanceLabel}</td>
                        </tr>
                    `;
                });

                scoresHTML += `</table>`;
                scoresTableEl.innerHTML = scoresHTML;
            }
        }

        /* ==============================
           CONTENT TABLE
        ============================== */
        const contentTableEl = document.getElementById("contentTable");

        if (contentTableEl) {
            if (content.length === 0) {
                contentTableEl.innerHTML = `<p>No content uploaded yet.</p>`;
            } else {
                let contentHTML = `
                    <table class="admin-table">
                        <tr>
                            <th>ID</th>
                            <th>Preview</th>
                        </tr>
                `;

                content.forEach(c => {
                    const preview = c.text.length > 80
                        ? c.text.substring(0, 80) + "..."
                        : c.text;

                    contentHTML += `
                        <tr>
                            <td>${c.id}</td>
                            <td>${preview}</td>
                        </tr>
                    `;
                });

                contentHTML += `</table>`;
                contentTableEl.innerHTML = contentHTML;
            }
        }

    } catch (error) {
        console.error("Admin Load Error:", error);

        const scoresTableEl = document.getElementById("scoresTable");
        const usersTableEl = document.getElementById("usersTable");
        const contentTableEl = document.getElementById("contentTable");

        if (scoresTableEl) scoresTableEl.innerHTML = `<p>Failed to load leaderboard data.</p>`;
        if (usersTableEl) usersTableEl.innerHTML = `<p>Failed to load users data.</p>`;
        if (contentTableEl) contentTableEl.innerHTML = `<p>Failed to load content data.</p>`;
    }
}

/* ==============================
   INIT
============================== */
loadAdminData();