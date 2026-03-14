const API = "";

/* =====================================
   REGISTER
===================================== */
if (document.getElementById("registerForm")) {
    document.getElementById("registerForm").onsubmit = async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(API + "/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Registered Successfully!");
                window.location.href = "/login-page";
            } else {
                alert(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Register Error:", error);
            alert("Something went wrong during registration.");
        }
    };
}

/* =====================================
   LOGIN
===================================== */
if (document.getElementById("loginForm")) {
    document.getElementById("loginForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(API + "/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("email", email);
                alert(data.message || "Login successful");
                window.location.href = "/dashboard-page";
            } else {
                alert(data.message || "Invalid credentials");
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Something went wrong during login.");
        }
    });
}

/* =====================================
   DASHBOARD UPLOAD
===================================== */
async function uploadContent() {
    const textArea = document.getElementById("content");
    const urlInput = document.getElementById("urlInput");
    const fileInput = document.getElementById("fileInput");
    const button = document.getElementById("uploadBtn");

    button.innerText = "Processing...";
    button.disabled = true;

    try {
        // ================= TEXT =================
        if (textArea && textArea.value.trim() !== "") {
            const response = await fetch(API + "/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: textArea.value })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || data.message || "Text upload failed.");
                button.disabled = false;
                button.innerText = "Upload & Generate Quiz";
                return;
            }
        }

        // ================= URL (currently saved as plain text) =================
        else if (urlInput && urlInput.value.trim() !== "") {
            const response = await fetch(API + "/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: urlInput.value })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || data.message || "URL upload failed.");
                button.disabled = false;
                button.innerText = "Upload & Generate Quiz";
                return;
            }
        }

        // ================= FILE (PDF / IMAGE) =================
        else if (fileInput && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);

            const response = await fetch(API + "/upload-file", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "File processing failed.");
                button.disabled = false;
                button.innerText = "Upload & Generate Quiz";
                return;
            }
        }

        // ================= NOTHING PROVIDED =================
        else {
            alert("Please provide learning material.");
            button.disabled = false;
            button.innerText = "Upload & Generate Quiz";
            return;
        }

        // ================= REDIRECT WITH SETTINGS =================
        const difficulty = document.getElementById("difficultyLevel")?.value || "Easy";
        const mcq = document.getElementById("mcqCount")?.value || 2;
        const tf = document.getElementById("tfCount")?.value || 2;
        const short = document.getElementById("shortCount")?.value || 1;
        const long = document.getElementById("longCount")?.value || 1;

        window.location.href =
            `/quiz-page?difficulty=${difficulty}&mcq=${mcq}&tf=${tf}&short=${short}&long=${long}`;

    } catch (error) {
        console.error("Upload Error:", error);
        alert("Something went wrong while uploading.");
        button.disabled = false;
        button.innerText = "Upload & Generate Quiz";
    }
}

/* =====================================
   QUIZ ENGINE
===================================== */
let questions = [];
let currentIndex = 0;
let userAnswers = [];
let correctCount = 0;
let totalTime = 0;
let startTime = 0;

if (document.getElementById("questionContainer")) {
    const params = new URLSearchParams(window.location.search);

    const difficulty = params.get("difficulty") || "Easy";
    const mcq = params.get("mcq") || 2;
    const tf = params.get("tf") || 2;
    const short = params.get("short") || 1;
    const long = params.get("long") || 1;

    fetch(API + `/generate-quiz?difficulty=${difficulty}&mcq=${mcq}&tf=${tf}&short=${short}&long=${long}`)
        .then(res => res.json())
        .then(data => {
            questions = data.questions || [];

            if (questions.length === 0) {
                document.getElementById("questionContainer").innerHTML =
                    "<h3>No quiz questions could be generated. Please upload more content.</h3>";
                document.getElementById("nextBtn").style.display = "none";
                return;
            }

            userAnswers = new Array(questions.length).fill(null);
            renderQuestion();
        })
        .catch(error => {
            console.error("Quiz Load Error:", error);
            document.getElementById("questionContainer").innerHTML =
                "<h3>Failed to load quiz. Please try again.</h3>";
            document.getElementById("nextBtn").style.display = "none";
        });
}

function renderQuestion() {
    const q = questions[currentIndex];
    startTime = Date.now();

    document.getElementById("progressText").innerText =
        `Question ${currentIndex + 1} of ${questions.length}`;

    document.getElementById("difficultyDisplay").innerText =
        q.difficulty || "Easy";

    let html = `<h3>${q.question}</h3>`;

    if (q.type === "mcq" || q.type === "truefalse") {
        html += `<div class="options-group">`;

        q.options.forEach(option => {
            const safeOption = option.replace(/'/g, "\\'");
            const selected = userAnswers[currentIndex] === option ? "selected" : "";

            html += `
                <div class="option-item ${selected}"
                     onclick="selectOption(event, '${safeOption}')">
                    ${option}
                </div>
            `;
        });

        html += `</div>`;
    }

    else if (q.type === "short") {
        html += `
            <input type="text"
                   class="short-input"
                   value="${userAnswers[currentIndex] || ''}"
                   oninput="userAnswers[currentIndex] = this.value">
        `;
    }

    else if (q.type === "long") {
        html += `
            <textarea class="short-input"
                      rows="5"
                      oninput="userAnswers[currentIndex] = this.value">${userAnswers[currentIndex] || ''}</textarea>
        `;
    }

    document.getElementById("questionContainer").innerHTML = html;

    document.getElementById("nextBtn").innerText =
        currentIndex === questions.length - 1 ? "Evaluate" : "Next Question";
}

function selectOption(event, value) {
    userAnswers[currentIndex] = value;

    document.querySelectorAll(".option-item")
        .forEach(opt => opt.classList.remove("selected"));

    event.target.classList.add("selected");
}

function nextQuestion() {
    if (!questions.length) return;

    if (!userAnswers[currentIndex] || userAnswers[currentIndex].toString().trim() === "") {
        alert("Please answer before continuing.");
        return;
    }

    const timeTaken = (Date.now() - startTime) / 1000;
    totalTime += timeTaken;

    const q = questions[currentIndex];

    if (q.type === "mcq" || q.type === "truefalse") {
        if (
            userAnswers[currentIndex].toString().toLowerCase().trim() ===
            q.correct.toString().toLowerCase().trim()
        ) {
            correctCount++;
        }
    }

    updateLiveStats();

    if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        evaluateQuiz();
    }
}

function updateLiveStats() {
    const answered = currentIndex + 1;
    const accuracy = Math.round((correctCount / answered) * 100);
    const avgTime = (totalTime / answered).toFixed(1);

    document.getElementById("scoreText").innerText = `Score: ${accuracy}%`;
    document.getElementById("accuracy").innerText = `${accuracy}%`;
    document.getElementById("avgTime").innerText = `${avgTime}s`;
}

function evaluateQuiz() {
    if (!questions.length) return;

    const accuracy = Math.round((correctCount / questions.length) * 100);
    const avgTime = (totalTime / questions.length).toFixed(1);

    fetch(API + "/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: localStorage.getItem("email") || "guest@example.com",
            score: correctCount,
            accuracy: accuracy,
            avgTime: avgTime
        })
    })
    .then(res => res.json())
    .then(() => {
        window.location.href = "/admin-page?show=leaderboard";
    })
    .catch(error => {
        console.error("Save Score Error:", error);
        alert("Quiz completed, but score could not be saved.");
        window.location.href = "/admin-page?show=leaderboard";
    });
}

/* =====================================
   DASHBOARD TAB SWITCHING
===================================== */
function showTab(tabName) {
    document.querySelectorAll(".upload-content")
        .forEach(tab => tab.classList.remove("active"));

    document.querySelectorAll(".tab-btn")
        .forEach(btn => btn.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");

    // Highlight active button
    document.querySelectorAll(".tab-btn").forEach(btn => {
        if (btn.getAttribute("onclick")?.includes(tabName)) {
            btn.classList.add("active");
        }
    });
}