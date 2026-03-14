from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import random
import pytesseract
from PyPDF2 import PdfReader
from PIL import Image
import re
import os

app = Flask(__name__)
CORS(app)

# ================= DATABASE =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        score INTEGER,
        accuracy REAL,
        avg_time REAL
    )
    """)

    conn.commit()
    conn.close()


init_db()

# ================= UTIL =================
def clean_text(text):
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^A-Za-z0-9.,!? ]+', '', text)
    return text.strip()


# ================= PAGE ROUTES =================
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/login-page")
def login_page():
    return render_template("login.html")


@app.route("/register-page")
def register_page():
    return render_template("register.html")


@app.route("/dashboard-page")
def dashboard_page():
    return render_template("dashboard.html")


@app.route("/quiz-page")
def quiz_page():
    return render_template("quiz.html")


@app.route("/admin-page")
def admin_page():
    return render_template("admin.html")


# ================= OPTIONAL HEALTH CHECK =================
@app.route("/api-status")
def api_status():
    return jsonify({"message": "Backend Running Successfully"})


# ================= REGISTER =================
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    if not data or "email" not in data or "password" not in data:
        return jsonify({"message": "Email and password required"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (email, password) VALUES (?, ?)",
            (data["email"], data["password"])
        )
        conn.commit()
        return jsonify({"message": "Registered successfully"})
    except sqlite3.IntegrityError:
        return jsonify({"message": "User already exists"}), 400
    except Exception as e:
        return jsonify({"message": f"Registration failed: {str(e)}"}), 500
    finally:
        conn.close()


# ================= LOGIN =================
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    if not data or "email" not in data or "password" not in data:
        return jsonify({"message": "Email and password required"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email=? AND password=?",
        (data["email"], data["password"])
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"message": "Login success"})
    return jsonify({"message": "Invalid credentials"}), 401


# ================= TEXT UPLOAD =================
@app.route("/upload", methods=["POST"])
def upload():
    data = request.json

    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    text = clean_text(data["text"])

    if not text:
        return jsonify({"error": "Text is empty after cleaning"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO content (text) VALUES (?)", (text,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Text uploaded successfully"})


# ================= FILE UPLOAD =================
@app.route("/upload-file", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = file.filename.lower()
    extracted_text = ""

    try:
        if filename.endswith(".pdf"):
            reader = PdfReader(file)
            for page in reader.pages:
                extracted_text += page.extract_text() or ""

        elif filename.endswith((".png", ".jpg", ".jpeg")):
            # NOTE:
            # This requires Tesseract OCR installed on system.
            # If not installed, it will throw an error.
            image = Image.open(file)
            extracted_text = pytesseract.image_to_string(image)

        else:
            return jsonify({"error": "Unsupported file type"}), 400

    except Exception as e:
        return jsonify({"error": f"File processing failed: {str(e)}"}), 500

    extracted_text = clean_text(extracted_text)

    if not extracted_text:
        return jsonify({"error": "No readable text found"}), 400

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO content (text) VALUES (?)", (extracted_text,))
    conn.commit()
    conn.close()

    return jsonify({"message": "File processed successfully"})


# ================= GENERATE QUIZ =================
@app.route("/generate-quiz", methods=["GET"])
def generate_quiz():
    difficulty = request.args.get("difficulty", "Easy")
    mcq_count = int(request.args.get("mcq", 2))
    tf_count = int(request.args.get("tf", 2))
    short_count = int(request.args.get("short", 1))
    long_count = int(request.args.get("long", 1))

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT text FROM content ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"questions": []})

    text = row["text"]
    sentences = [s.strip() for s in text.split(".") if len(s.strip()) > 20]

    if not sentences:
        return jsonify({"questions": []})

    questions = []

    # MCQ
    for sentence in sentences[:mcq_count]:
        words = sentence.split()
        if len(words) < 5:
            continue

        hidden = random.choice(words)
        blank = sentence.replace(hidden, "______", 1)

        unique_words = list(set(words))
        if hidden not in unique_words:
            unique_words.append(hidden)

        options = random.sample(unique_words, min(4, len(unique_words)))

        if hidden not in options:
            if len(options) < 4:
                options.append(hidden)
            else:
                options[random.randint(0, len(options) - 1)] = hidden

        random.shuffle(options)

        questions.append({
            "type": "mcq",
            "question": blank,
            "correct": hidden,
            "options": options,
            "difficulty": difficulty
        })

    # True / False
    for sentence in sentences[:tf_count]:
        questions.append({
            "type": "truefalse",
            "question": sentence,
            "correct": "True",
            "options": ["True", "False"],
            "difficulty": difficulty
        })

    # Short Answer
    for sentence in sentences[:short_count]:
        questions.append({
            "type": "short",
            "question": f"Explain briefly: {sentence}",
            "correct": "subjective",
            "difficulty": difficulty
        })

    # Long Answer
    for sentence in sentences[:long_count]:
        questions.append({
            "type": "long",
            "question": f"Explain in detail: {sentence}",
            "correct": "subjective",
            "difficulty": difficulty
        })

    return jsonify({"questions": questions})


# ================= SAVE SCORE =================
@app.route("/save-score", methods=["POST"])
def save_score():
    data = request.json

    required_fields = ["email", "score", "accuracy", "avgTime"]
    if not data or not all(field in data for field in required_fields):
        return jsonify({"message": "Missing score data"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO scores (user_email, score, accuracy, avg_time)
        VALUES (?, ?, ?, ?)
    """, (
        data["email"],
        data["score"],
        data["accuracy"],
        data["avgTime"]
    ))

    conn.commit()
    conn.close()

    return jsonify({"message": "Score saved"})


# ================= ADMIN ROUTES =================
@app.route("/admin/users")
def get_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email FROM users")
    users = cursor.fetchall()
    conn.close()
    return jsonify({"users": [dict(u) for u in users]})


@app.route("/admin/scores")
def get_scores():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_email, score, accuracy, avg_time FROM scores")
    scores = cursor.fetchall()
    conn.close()
    return jsonify({"scores": [dict(s) for s in scores]})


@app.route("/admin/content")
def get_content():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, text FROM content")
    content = cursor.fetchall()
    conn.close()
    return jsonify({"content": [dict(c) for c in content]})


# ================= RUN =================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)