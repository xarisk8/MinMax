import logging
from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, session, flash
from flask_wtf import FlaskForm
from flask_wtf.csrf import CSRFProtect
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime, timezone, timedelta

app = Flask(__name__)
app.secret_key = 'your_secret_key'
csrf = CSRFProtect(app)

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])

def init_db():
    conn = sqlite3.connect("todo.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    # Add position column if it doesn't exist
    cursor.execute("""
        PRAGMA table_info(tasks)
    """)
    columns = cursor.fetchall()
    if not any(column[1] == 'position' for column in columns):
        cursor.execute("""
            ALTER TABLE tasks
            ADD COLUMN position INTEGER
        """)
    
    # Add focus sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS focus_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()
    conn.close()

# Initialize the database when the app starts
init_db()

def get_tasks(user_id):
    conn = sqlite3.connect("todo.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, text, completed 
        FROM tasks 
        WHERE user_id = ? 
        ORDER BY position, id
    """, (user_id,))
    tasks = cursor.fetchall()
    conn.close()
    return tasks

def add_task_to_db(text, user_id, task_id=None):
    conn = sqlite3.connect("todo.db")
    cursor = conn.cursor()
    try:
        if task_id:
            cursor.execute("UPDATE tasks SET text = ? WHERE id = ? AND user_id = ?", 
                         (text, task_id, user_id))
        else:
            # Get the maximum position and add new task at the end
            cursor.execute("SELECT COALESCE(MAX(position), -1) + 1 FROM tasks WHERE user_id = ?", 
                         (user_id,))
            next_position = cursor.fetchone()[0]
            cursor.execute("""
                INSERT INTO tasks (text, user_id, position) 
                VALUES (?, ?, ?)
            """, (text, user_id, next_position))
            task_id = cursor.lastrowid
        conn.commit()
        return task_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def toggle_task_in_db(task_id, completed, user_id):
    try:
        conn = sqlite3.connect("todo.db")
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE tasks 
            SET completed = ? 
            WHERE id = ? AND user_id = ?
        """, (completed, task_id, user_id))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    except Exception as e:
        app.logger.error(f"Error toggling task: {e}")
        return False

def delete_task_from_db(task_id, user_id):
    try:
        # Ensure task_id is an integer
        task_id = int(task_id)
        
        conn = sqlite3.connect("todo.db")
        cursor = conn.cursor()
        
        # First get the task details
        cursor.execute("""
            SELECT id, text, completed 
            FROM tasks 
            WHERE id = ? AND user_id = ?
        """, (task_id, user_id))
        task = cursor.fetchone()
        
        if task:
            # Then delete it
            cursor.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
            conn.commit()
            
            # Return the deleted task info
            return {
                "id": task[0],
                "text": task[1],
                "completed": bool(task[2])  # Ensure boolean type
            }
    except (ValueError, TypeError):
        app.logger.error(f"Invalid task ID format: {task_id}")
        return None
    except Exception as e:
        app.logger.error(f"Error deleting task: {e}")
        return None
    finally:
        conn.close()

def delete_all_tasks_from_db(user_id):
    conn = sqlite3.connect("todo.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

def reorder_tasks_in_db(user_id, task_order):
    # Note: This complex task reordering implementation was developed with AI assistance
    conn = sqlite3.connect("todo.db")
    cursor = conn.cursor()
    try:
        # Verify all tasks belong to user
        task_ids = ','.join('?' * len(task_order))
        cursor.execute(f"""
            SELECT COUNT(*) 
            FROM tasks 
            WHERE user_id = ? AND id IN ({task_ids})
        """, (user_id, *task_order))
        
        count = cursor.fetchone()[0]
        if count != len(task_order):
            raise ValueError("Invalid task IDs in reorder request")

        # Update positions in a single transaction
        for position, task_id in enumerate(task_order):
            cursor.execute("""
                UPDATE tasks 
                SET position = ? 
                WHERE id = ? AND user_id = ?
            """, (position, task_id, user_id))
        
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Error reordering tasks: {e}")
        return False
    finally:
        conn.close()

@app.route("/register", methods=["GET", "POST"])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        password_hash = generate_password_hash(password)
        try:
            conn = sqlite3.connect("todo.db")
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
            conn.commit()
            conn.close()
            flash("Registration successful! Please log in.", "success")
            return redirect(url_for("login"))
        except sqlite3.IntegrityError:
            flash("Username already exists. Please choose a different one.", "danger")
    return render_template("register.html", form=form)

@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        conn = sqlite3.connect("todo.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()
        if user and check_password_hash(user[1], password):
            session["user_id"] = user[0]
            flash("Login successful!", "success")
            return redirect(url_for("dashboard"))
        else:
            flash("Invalid username or password.", "danger")
    return render_template("login.html", form=form)

@app.route("/logout")
def logout():
    session.pop("user_id", None)
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for("login"))

@app.route("/")
def landing():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return render_template("landing.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("login"))
    tasks = get_tasks(session["user_id"])
    return render_template("index.html", tasks=[{"id": task[0], "text": task[1], "completed": task[2]} for task in tasks])

@app.route("/add_task", methods=["POST"])
@csrf.exempt
def add_task():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    task_text = request.json.get("text", "")
    if task_text.strip():
        task_id = add_task_to_db(task_text, session["user_id"])
        return jsonify({"success": True, "message": "Task added successfully!", "id": task_id})
    return jsonify({"success": False, "message": "Task cannot be empty!"})

@app.route("/update_task", methods=["POST"])
@csrf.exempt
def update_task():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    task_id = request.json.get("id")
    task_text = request.json.get("text", "")
    if task_text.strip():
        add_task_to_db(task_text, session["user_id"], task_id)
        return jsonify({"success": True, "message": "Task updated successfully!"})
    return jsonify({"success": False, "message": "Task cannot be empty!"})

@app.route("/toggle_task", methods=["POST"])
@csrf.exempt
def toggle_task():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    
    try:
        task_id = request.json.get("id")
        completed = request.json.get("completed")
        
        if task_id is None or completed is None:
            return jsonify({"success": False, "message": "Invalid request"}), 400
            
        success = toggle_task_in_db(task_id, completed, session["user_id"])
        if success:
            return jsonify({"success": True, "message": "Task updated successfully"})
        return jsonify({"success": False, "message": "Task not found"}), 404
        
    except Exception as e:
        app.logger.error(f"Error in toggle_task: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

@app.route("/delete_task", methods=["POST"])
@csrf.exempt
def delete_task():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
        
    try:
        task_id = request.json.get("id")
        if task_id is None:
            return jsonify({"success": False, "message": "Invalid request"}), 400
            
        deleted_task = delete_task_from_db(task_id, session["user_id"])
        if deleted_task:
            return jsonify({
                "success": True, 
                "message": "Task deleted successfully",
                "task": deleted_task
            })
        return jsonify({"success": False, "message": "Task not found"}), 404
        
    except Exception as e:
        app.logger.error(f"Error in delete_task: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

@app.route("/delete_all_tasks", methods=["POST"])
@csrf.exempt
def delete_all_tasks():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    delete_all_tasks_from_db(session["user_id"])
    return jsonify({"success": True, "message": "All tasks deleted successfully!"})

@app.route("/tasks", methods=["GET"])
def get_all_tasks():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    tasks = get_tasks(session["user_id"])
    return jsonify([{"id": task[0], "text": task[1], "completed": task[2]} for task in tasks])

@app.route("/reorder_tasks", methods=["POST"])
@csrf.exempt
def reorder_tasks():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    
    try:
        task_order = request.json.get("taskOrder", [])
        if not task_order:
            return jsonify({"success": False, "message": "No task order provided"}), 400
            
        if reorder_tasks_in_db(session["user_id"], task_order):
            return jsonify({"success": True, "message": "Tasks reordered successfully"})
        return jsonify({"success": False, "message": "Failed to reorder tasks"}), 500
        
    except Exception as e:
        app.logger.error(f"Error in reorder_tasks: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

@app.route("/save_focus_session", methods=["POST"])
@csrf.exempt
def save_focus_session():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    
    try:
        duration = request.json.get("duration", 0)
        
        # Validate duration
        valid_durations = [25*60, 50*60]  # 25 or 50 minutes in seconds
        if duration not in valid_durations:
            app.logger.warning(f"Invalid focus duration received: {duration}")
            return jsonify({"success": False, "message": "Invalid duration"}), 400

        conn = sqlite3.connect("todo.db")
        cursor = conn.cursor()
        
        # Add session with explicit timestamp
        cursor.execute("""
            INSERT INTO focus_sessions (user_id, duration, completed_at)
            VALUES (?, ?, datetime('now', 'localtime'))
        """, (session["user_id"], duration))
        
        # Get inserted session
        cursor.execute("""
            SELECT duration, completed_at 
            FROM focus_sessions 
            WHERE id = last_insert_rowid()
        """)
        saved_session = cursor.fetchone()
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "saved_session": {
                "duration": saved_session[0],
                "completed_at": saved_session[1]
            }
        })
        
    except Exception as e:
        app.logger.error(f"Error saving focus session: {e}")
        return jsonify({"success": False, "message": "Server error"}), 500

@app.route("/get_focus_stats", methods=["GET"])
def get_focus_stats():
    # Note: The focus statistics query implementation was developed with AI assistance,
    # particularly the recursive CTE for date generation and proper timezone handling
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    
    conn = sqlite3.connect("todo.db")
    cursor = conn.cursor()
    
    # Get daily stats for the last 7 days with date localization
    cursor.execute("""
        WITH RECURSIVE dates(date) AS (
            SELECT date('now', 'localtime', '-6 days')
            UNION ALL
            SELECT date(date, '+1 day')
            FROM dates
            WHERE date < date('now', 'localtime')
        )
        SELECT dates.date, COALESCE(SUM(fs.duration), 0) as total_duration
        FROM dates
        LEFT JOIN focus_sessions fs 
            ON date(fs.completed_at, 'localtime') = dates.date 
            AND fs.user_id = ?
        GROUP BY dates.date
        ORDER BY dates.date ASC
    """, (session["user_id"],))
    
    daily_stats = cursor.fetchall()
    
    # Get today's total using local time
    cursor.execute("""
        SELECT COALESCE(SUM(duration), 0)
        FROM focus_sessions
        WHERE user_id = ? 
        AND date(completed_at, 'localtime') = date('now', 'localtime')
    """, (session["user_id"],))
    
    today_total = cursor.fetchone()[0]
    
    # Get all-time total
    cursor.execute("""
        SELECT COALESCE(SUM(duration), 0)
        FROM focus_sessions
        WHERE user_id = ?
    """, (session["user_id"],))
    
    total_time = cursor.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        "success": True,
        "stats": {
            "daily": [{"date": date, "duration": duration} for date, duration in daily_stats],
            "today": today_total,
            "total": total_time
        }
    })

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    """Serve audio files with proper MIME type and caching"""
    try:
        audio_dir = os.path.join(app.static_folder, 'audio')
        app.logger.debug(f'Serving audio file: {filename} from {audio_dir}')
        
        file_path = os.path.join(audio_dir, filename)
        if not os.path.exists(file_path):
            app.logger.error(f'Audio file not found: {file_path}')
            return 'Audio file not found', 404

        # Add CORS headers for audio files
        response = send_from_directory(audio_dir, filename, mimetype='audio/mpeg')
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['Cache-Control'] = 'public, max-age=31536000'
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response
        
    except Exception as e:
        app.logger.error(f'Error serving audio file: {e}')
        return str(e), 500

if __name__ == "__main__":
    app.run(debug=True)
