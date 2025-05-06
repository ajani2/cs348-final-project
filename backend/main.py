from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import text, func
import os
import shutil

SRC_DB_PATH = os.path.join(os.path.dirname(__file__), "health.db")
TMP_DB_PATH = "/tmp/health.db"
if not os.path.exists(TMP_DB_PATH):
    if os.path.exists(SRC_DB_PATH):
        shutil.copyfile(SRC_DB_PATH, TMP_DB_PATH)
    else:
        open(TMP_DB_PATH, 'a').close()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/health.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app, origins=[
    "http://localhost:3000",
    "https://cs348finalproject-459000.web.app"
], supports_credentials=True)

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    condition = db.Column(db.String(255), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)

class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(255), nullable=False)
    patients = db.relationship('Patient', backref='doctor', lazy=True)

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # YYYY-MM-DD
    time = db.Column(db.String(5), nullable=False)   # HH:MM
    duration = db.Column(db.Integer, nullable=False) # in minutes
    notes = db.Column(db.String(255), nullable=True)

    patient = db.relationship('Patient', backref='appointments', lazy=True)
    doctor = db.relationship('Doctor', backref='appointments', lazy=True)

with app.app_context():
    db.create_all()

@app.route('/patients', methods=['GET'])
def get_patients():
    query = Patient.query
    if request.args.get('name'):
        query = query.filter(Patient.name.like(f"%{request.args.get('name')}%"))
    if request.args.get('age'):
        query = query.filter(Patient.age == request.args.get('age'))
    if request.args.get('gender'):
        query = query.filter(func.lower(Patient.gender) == request.args.get('gender').lower())
    if request.args.get('condition'):
        query = query.filter(Patient.condition.like(f"%{request.args.get('condition')}%"))
    patients = query.all()
    return jsonify([{
        'id': p.id, 'name': p.name, 'age': p.age, 'gender': p.gender,
        'condition': p.condition, 'doctor_id': p.doctor_id
    } for p in patients])

@app.route('/patients', methods=['POST'])
def add_patient():
    data = request.get_json()
    try:
        new_patient = Patient(
            name=data['name'],
            age=int(data['age']),
            gender=data['gender'],
            condition=data['condition'],
            doctor_id=int(data['doctor_id'])
        )
        db.session.add(new_patient)
        db.session.commit()
        return jsonify({'message': 'Patient added', 'id': new_patient.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/patients/<int:id>', methods=['PUT'])
def update_patient(id):
    try:
        patient = Patient.query.get_or_404(id)
        data = request.get_json()
        patient.name = data.get('name', patient.name)
        patient.age = int(data.get('age', patient.age))
        patient.gender = data.get('gender', patient.gender)
        patient.condition = data.get('condition', patient.condition)
        patient.doctor_id = int(data.get('doctor_id', patient.doctor_id))
        db.session.commit()
        return jsonify({'message': 'Patient updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/patients/<int:id>', methods=['DELETE'])
def delete_patient(id):
    try:
        patient = Patient.query.get_or_404(id)
        db.session.delete(patient)
        db.session.commit()
        return jsonify({'message': 'Patient deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/patients/by-doctor/<int:doctor_id>', methods=['GET'])
def get_patients_by_doctor(doctor_id):
    patients = Patient.query.filter_by(doctor_id=doctor_id).all()
    return jsonify([{
        'id': p.id, 'name': p.name, 'age': p.age, 'gender': p.gender,
        'condition': p.condition, 'doctor_id': p.doctor_id
    } for p in patients])

@app.route('/doctors', methods=['GET'])
def get_doctors():
    doctors = Doctor.query.all()
    return jsonify([{
        'id': d.id, 'name': d.name, 'specialty': d.specialty
    } for d in doctors])

@app.route('/doctors', methods=['POST'])
def add_doctor():
    data = request.get_json()
    try:
        new_doctor = Doctor(
            name=data['name'],
            specialty=data['specialty']
        )
        db.session.add(new_doctor)
        db.session.commit()
        return jsonify({'message': 'Doctor added', 'id': new_doctor.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/doctors/<int:id>', methods=['PUT'])
def update_doctor(id):
    try:
        doctor = Doctor.query.get_or_404(id)
        data = request.get_json()
        doctor.name = data.get('name', doctor.name)
        doctor.specialty = data.get('specialty', doctor.specialty)
        db.session.commit()
        return jsonify({'message': 'Doctor updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/doctors/<int:id>', methods=['DELETE'])
def delete_doctor(id):
    try:
        doctor = Doctor.query.get_or_404(id)
        if doctor.patients and len(doctor.patients) > 0:
            return jsonify({'error': 'Doctor has patients! Update patients to a new doctor first!'}), 400
        db.session.delete(doctor)
        db.session.commit()
        return jsonify({'message': 'Doctor deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/doctors/by-specialty', methods=['GET'])
def get_doctors_by_specialty():
    specialty = request.args.get('specialty', '')
    doctors = Doctor.query.filter(Doctor.specialty.ilike(f"%{specialty}%")).all()
    return jsonify([{
        'id': d.id, 'name': d.name, 'specialty': d.specialty
    } for d in doctors])

@app.route('/doctors/report', methods=['GET'])
def doctor_report():
    query = text("""
        SELECT d.id, d.name, d.specialty, COUNT(p.id) as patient_count
        FROM doctor d
        LEFT JOIN patient p ON d.id = p.doctor_id
        GROUP BY d.id, d.name, d.specialty
        ORDER BY d.name
    """)
    result = db.session.execute(query)
    report = [{
        'id': row[0],
        'name': row[1],
        'specialty': row[2],
        'patient_count': row[3]
    } for row in result]
    return jsonify(report)

# --- APPOINTMENT ROUTES ---

@app.route('/appointments', methods=['GET'])
def get_appointments():
    appointments = Appointment.query.all()
    return jsonify([
        {
            'id': a.id,
            'patient_id': a.patient_id,
            'doctor_id': a.doctor_id,
            'date': a.date,
            'time': a.time,
            'duration': a.duration,
            'notes': a.notes,
            'patient_name': a.patient.name if a.patient else "",
            'doctor_name': a.doctor.name if a.doctor else "",
        }
        for a in appointments
    ])

@app.route('/appointments', methods=['POST'])
def add_appointment():
    data = request.get_json()
    try:
        new_appointment = Appointment(
            patient_id=int(data['patient_id']),
            doctor_id=int(data['doctor_id']),
            date=data['date'],
            time=data['time'],
            duration=int(data['duration']),
            notes=data.get('notes', '')
        )
        db.session.add(new_appointment)
        db.session.commit()
        return jsonify({'message': 'Appointment added', 'id': new_appointment.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/<int:id>', methods=['PUT'])
def update_appointment(id):
    try:
        appointment = Appointment.query.get_or_404(id)
        data = request.get_json()
        appointment.patient_id = int(data['patient_id'])
        appointment.doctor_id = int(data['doctor_id'])
        appointment.date = data['date']
        appointment.time = data['time']
        appointment.duration = int(data['duration'])
        appointment.notes = data.get('notes', '')
        db.session.commit()
        return jsonify({'message': 'Appointment updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/<int:id>', methods=['DELETE'])
def delete_appointment(id):
    try:
        appointment = Appointment.query.get_or_404(id)
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({'message': 'Appointment deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/appointments/report', methods=['GET'])
def appointment_report():
    patient_name = request.args.get('patient_name', '')
    doctor_name = request.args.get('doctor_name', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    duration = request.args.get('duration', '')

    sql = """
        SELECT a.id, a.patient_id, a.doctor_id, a.date, a.time, a.duration, a.notes,
               p.name as patient_name, d.name as doctor_name
        FROM appointment a
        JOIN patient p ON a.patient_id = p.id
        JOIN doctor d ON a.doctor_id = d.id
        WHERE 1=1
    """
    params = {}
    if patient_name:
        sql += " AND p.name LIKE :patient_name"
        params['patient_name'] = f"%{patient_name}%"
    if doctor_name:
        sql += " AND d.name LIKE :doctor_name"
        params['doctor_name'] = f"%{doctor_name}%"
    if date_from:
        sql += " AND a.date >= :date_from"
        params['date_from'] = date_from
    if date_to:
        sql += " AND a.date <= :date_to"
        params['date_to'] = date_to
    if duration:
        sql += " AND a.duration = :duration"
        params['duration'] = duration

    sql += " ORDER BY a.date, a.time"

    result = db.session.execute(text(sql), params)
    appointments = [
        {
            'id': row[0],
            'patient_id': row[1],
            'doctor_id': row[2],
            'date': row[3],
            'time': row[4],
            'duration': row[5],
            'notes': row[6],
            'patient_name': row[7],
            'doctor_name': row[8],
        }
        for row in result
    ]
    return jsonify(appointments)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)
