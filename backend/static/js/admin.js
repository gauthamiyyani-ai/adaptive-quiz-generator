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
   LOAD ADMIN DATA
============================== */
async function loadAdminData() {
    try {
        const usersResponse = await fetch(API + "/admin/users");
        const contentResponse = await fetch(API + "/admin/content");
        const scoresResponse = await fetch(API + "/admin/scores");

        const usersData = await usersResponse.json();
        const contentData = await contentResponse.json();
        const scoresData = await scoresResponse.json();

        const users = usersData.users || [];
        const content = contentData.content || [];
        const scores = scoresData.scores || [];

        /* ==============================
           DASHBOARD STATS
        ============================== */
        const totalUsersEl = document.getElementById("totalUsers");
        const totalContentEl = document.getElementById("totalContent");
        const activeUsersEl = document.getElementById("activeUsers");
        const avgAccuracyEl = document.getElementById("avgAccuracy");

        if (totalUsersEl) totalUsersEl.innerText = users.length;
        if (totalContentEl) totalContentEl.innerText = content.length;
        if (activeUsersEl) activeUsersEl.innerText = scores.length;

        let totalAccuracy = 0;
        scores.forEach(s => {
            totalAccuracy += parseFloat(s.accuracy || 0);
        });

        const avgAccuracy = scores.length > 0
            ? (totalAccuracy / scores.length).toFixed(1)
            : 0;

        if (avgAccuracyEl) avgAccuracyEl.innerText = avgAccuracy + "%";

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
                    const preview = c.text.length > 100
                        ? c.text.substring(0, 100) + "..."
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

        const usersTableEl = document.getElementById("usersTable");
        const contentTableEl = document.getElementById("contentTable");

        if (usersTableEl) usersTableEl.innerHTML = `<p>Failed to load users data.</p>`;
        if (contentTableEl) contentTableEl.innerHTML = `<p>Failed to load content data.</p>`;
    }
}

/* ==============================
   INIT
============================== */
loadAdminData();