from flask import Flask, request, jsonify
import mysql.connector
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="root",
            database="syntac"
        )
        return conn
    except mysql.connector.Error as e:
        print(f"Database error: {str(e)}")
        raise

def pre_generate_timetables():
    conn = get_db_connection()
    c = conn.cursor(dictionary=True)

    c.execute("SELECT * FROM classes")
    classes = c.fetchall()

    c.execute("SELECT * FROM subjects")
    subjects = c.fetchall()

    c.execute("SELECT * FROM teachers_info")
    teachers = {t['id']: t for t in c.fetchall()}

    c.execute("SELECT * FROM timeslots ORDER BY start_time")
    time_slots = c.fetchall()

    all_timetables = {}

    for cls in classes:
        grade = cls['grade']
        class_id = cls['id']
        applicable_subjects = [s['name'] for s in subjects if str(grade) in s['grades'].split(',')]

        timetable = []
        for slot in time_slots:
            if not applicable_subjects:
                break
            subject = applicable_subjects.pop(0)
            valid_teachers = [t_id for t_id, t in teachers.items() if subject in t['subjects'].split(',') and str(grade) in t['grades'].split(',')]
            teacher = valid_teachers[0] if valid_teachers else "No Teacher"
            timetable.append({"time": f"{slot['start_time']} - {slot['end_time']}", "teacher": teacher, "subject": subject})

        all_timetables[class_id] = timetable
        c.execute("INSERT INTO stored_timetables (class_id, timetable_json) VALUES (%s, %s) ON DUPLICATE KEY UPDATE timetable_json = %s",
                  (class_id, json.dumps(timetable), json.dumps(timetable)))

    conn.commit()
    conn.close()
    return all_timetables

@app.route('/api/timetable/get', methods=['POST'])
def get_timetable():
    try:
        data = request.get_json()
        class_id = data.get("class_section", "")

        conn = get_db_connection()
        c = conn.cursor(dictionary=True)

        c.execute("SELECT timetable_json FROM stored_timetables WHERE class_id = %s", (class_id,))
        result = c.fetchone()

        conn.close()

        if result:
            return jsonify({"timetable": json.loads(result["timetable_json"])})
        else:
            return jsonify({"error": "No timetable found for this class"}), 404

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/api/timetable/update', methods=['POST'])
def update_timetable():
    try:
        data = request.get_json()
        class_id = data.get("class_section", "")
        unavailable_teachers = data.get("unavailable_teachers", "").split(",")

        conn = get_db_connection()
        c = conn.cursor(dictionary=True)

        c.execute("SELECT timetable_json FROM stored_timetables WHERE class_id = %s", (class_id,))
        result = c.fetchone()

        if not result:
            return jsonify({"error": "No existing timetable found"}), 404

        timetable = json.loads(result["timetable_json"])

        for entry in timetable:
            if entry["teacher"] in unavailable_teachers:
                entry["teacher"] = "No Teacher"

        c.execute("UPDATE stored_timetables SET timetable_json = %s WHERE class_id = %s", (json.dumps(timetable), class_id))
        conn.commit()
        conn.close()

        return jsonify({"timetable": timetable})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == "__main__":
    pre_generate_timetables()  # Generate all timetables at startup
    app.run(debug=True, host="0.0.0.0", port=5000)
