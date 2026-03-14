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

    document.getElementById(tabId).classList.add("active");

    document.querySelectorAll(".tab").forEach(btn => {
        if (btn.getAttribute("onclick").includes(tabId)) {
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

        const usersData = await fetch(API + "/admin/users").then(r => r.json());
        const scoresData = await fetch(API + "/admin/scores").then(r => r.json());
        const contentData = await fetch(API + "/admin/content").then(r => r.json());

        const users = usersData.users || [];
        const scores = scoresData.scores || [];
        const content = contentData.content || [];

        /* ===== DASHBOARD STATS ===== */

        document.getElementById("totalUsers").innerText = users.length;
        document.getElementById("totalQuizzes").innerText = scores.length;
        document.getElementById("totalContent").innerText = content.length;

        let totalAccuracy = 0;
        scores.forEach(s => totalAccuracy += s.accuracy || 0);

        const avgAccuracy = scores.length > 0
            ? (totalAccuracy / scores.length).toFixed(1)
            : 0;

        document.getElementById("feedbackRate").innerText =
            avgAccuracy + "%";


        /* ===== USERS TABLE ===== */

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
        document.getElementById("usersTable").innerHTML = usersHTML;


        /* ===== LEADERBOARD TABLE ===== */

        scores.sort((a, b) => b.score - a.score);

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

        scores.forEach((s, index) => {

            const highlight = index === 0 ? "top-performer" : "";

            scoresHTML += `
                <tr class="${highlight}">
                    <td>${index + 1}</td>
                    <td>${s.user_email}</td>
                    <td>${s.score}</td>
                    <td>${s.accuracy || 0}%</td>
                    <td>${s.avg_time || 0}s</td>
                </tr>
            `;
        });

        scoresHTML += `</table>`;
        document.getElementById("scoresTable").innerHTML = scoresHTML;


        /* ===== CONTENT TABLE ===== */

        let contentHTML = `
            <table class="admin-table">
                <tr>
                    <th>ID</th>
                    <th>Preview</th>
                </tr>
        `;

        content.forEach(c => {
            contentHTML += `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.text.substring(0, 80)}...</td>
                </tr>
            `;
        });

        contentHTML += `</table>`;
        document.getElementById("contentTable").innerHTML = contentHTML;

    } catch (error) {
        console.error("Admin Load Error:", error);
    }
}

loadAdminData();