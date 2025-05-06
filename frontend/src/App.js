import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "https://cs348finalproject-459000.uc.r.appspot.com";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

function App() {
  const [page, setPage] = useState("main");
  return (
    <div className="App">
      <div
        className="header-row"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1>Health Administration System</h1>
        <button
          className="nav-btn"
          style={{ marginTop: 12 }}
          onClick={() => setPage(page === "main" ? "appointments" : "main")}
        >
          {page === "main"
            ? "Go to Appointment Portal"
            : "Back to Main Portal"}
        </button>
      </div>
      {page === "main" ? <MainPortal /> : <AppointmentPortal />}
    </div>
  );
}

// ---- Main Portal ----

function MainPortal() {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]); // <-- NEW
  const [doctorReport, setDoctorReport] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [selectedDoctorForPatients, setSelectedDoctorForPatients] =
    useState(null);
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [allSpecialties, setAllSpecialties] = useState([]);
  const [searchParams, setSearchParams] = useState({
    name: "",
    age: "",
    gender: "",
    condition: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    condition: "",
    doctor_id: "",
  });
  const [editingPatient, setEditingPatient] = useState(null);
  const [doctorFormData, setDoctorFormData] = useState({
    name: "",
    specialty: "",
  });
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorError, setDoctorError] = useState("");

  // Fetch all doctors (unfiltered) for patient display
  const fetchAllDoctors = async () => {
    try {
      const response = await axiosInstance.get("/doctors");
      setAllDoctors(response.data);
    } catch (error) {
      setAllDoctors([]);
    }
  };

  // Fetch all specialties from all doctors (not just filtered ones)
  const fetchAllSpecialties = async () => {
    try {
      const response = await axiosInstance.get("/doctors");
      const specialties = [...new Set(response.data.map((d) => d.specialty))];
      setAllSpecialties(specialties);
    } catch (error) {
      setAllSpecialties([]);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchDoctorReport();
    fetchAllDoctors();
    fetchAllSpecialties();
    // eslint-disable-next-line
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axiosInstance.get(`/patients`, {
        params: searchParams,
      });
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchDoctors = async (specialty = "") => {
    try {
      let url = "/doctors";
      if (specialty)
        url = `/doctors/by-specialty?specialty=${encodeURIComponent(specialty)}`;
      const response = await axiosInstance.get(url);
      setDoctors(response.data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchDoctorReport = async () => {
    try {
      const response = await axiosInstance.get("/doctors/report");
      setDoctorReport(response.data);
    } catch (error) {
      console.error("Error fetching doctor report:", error);
    }
  };

  const fetchDoctorPatients = async (doctorId) => {
    try {
      const response = await axiosInstance.get(
        `/patients/by-doctor/${doctorId}`
      );
      setDoctorPatients(response.data);
      setSelectedDoctorForPatients(doctorId);
    } catch (error) {
      setDoctorPatients([]);
      setSelectedDoctorForPatients(null);
    }
  };

  const handleDoctorReportRowClick = (doctorId) => {
    if (selectedDoctorForPatients === doctorId) {
      setSelectedDoctorForPatients(null);
      setDoctorPatients([]);
    } else {
      fetchDoctorPatients(doctorId);
    }
  };

  // Patient Handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };
  const handleAddPatient = async () => {
    try {
      await axiosInstance.post(`/patients`, formData);
      fetchPatients();
      fetchDoctorReport();
      setFormData({
        name: "",
        age: "",
        gender: "",
        condition: "",
        doctor_id: "",
      });
    } catch (error) {
      alert("Error adding patient");
    }
  };
  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      condition: patient.condition,
      doctor_id: patient.doctor_id,
    });
  };
  const handleUpdatePatient = async () => {
    try {
      await axiosInstance.put(`/patients/${editingPatient.id}`, formData);
      fetchPatients();
      fetchDoctorReport();
      setEditingPatient(null);
      setFormData({
        name: "",
        age: "",
        gender: "",
        condition: "",
        doctor_id: "",
      });
    } catch (error) {
      alert("Error updating patient");
    }
  };
  const handleCancelEditPatient = () => {
    setEditingPatient(null);
    setFormData({
      name: "",
      age: "",
      gender: "",
      condition: "",
      doctor_id: "",
    });
  };
  const handleDeletePatient = async (id) => {
    try {
      await axiosInstance.delete(`/patients/${id}`);
      fetchPatients();
      fetchDoctorReport();
    } catch (error) {
      alert("Error deleting patient");
    }
  };

  // Doctor Handlers
  const handleDoctorFormChange = (e) => {
    const { name, value } = e.target;
    setDoctorFormData((f) => ({ ...f, [name]: value }));
  };
  const handleAddDoctor = async () => {
    try {
      setDoctorError("");
      await axiosInstance.post(`/doctors`, doctorFormData);
      fetchDoctors(specialtyFilter);
      fetchAllDoctors();
      fetchDoctorReport();
      fetchAllSpecialties();
      setDoctorFormData({ name: "", specialty: "" });
    } catch (error) {
      setDoctorError("Error adding doctor");
    }
  };
  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorFormData({
      name: doctor.name,
      specialty: doctor.specialty,
    });
    setDoctorError("");
  };
  const handleUpdateDoctor = async () => {
    try {
      setDoctorError("");
      await axiosInstance.put(`/doctors/${editingDoctor.id}`, doctorFormData);
      fetchDoctors(specialtyFilter);
      fetchAllDoctors();
      fetchDoctorReport();
      fetchAllSpecialties();
      setEditingDoctor(null);
      setDoctorFormData({ name: "", specialty: "" });
    } catch (error) {
      setDoctorError("Error updating doctor");
    }
  };
  const handleCancelEditDoctor = () => {
    setEditingDoctor(null);
    setDoctorFormData({ name: "", specialty: "" });
  };
  const handleDeleteDoctor = async (id) => {
    try {
      setDoctorError("");
      await axiosInstance.delete(`/doctors/${id}`);
      fetchDoctors(specialtyFilter);
      fetchAllDoctors();
      fetchDoctorReport();
      fetchAllSpecialties();
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.error
      ) {
        setDoctorError(error.response.data.error);
      } else {
        setDoctorError("Error deleting doctor");
      }
    }
  };

  // Search & Filter
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((s) => ({ ...s, [name]: value }));
  };
  const handleSpecialtyFilter = (e) => {
    setSpecialtyFilter(e.target.value);
  };
  const handleSpecialtyFilterButton = () => {
    fetchDoctors(specialtyFilter);
  };

  return (
    <>
      {/* Patient Search */}
      <div className="search-section">
        <h2>Search Patients</h2>
        <div className="search-fields">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={searchParams.name}
            onChange={handleSearchChange}
          />
          <input
            type="number"
            placeholder="Age"
            name="age"
            value={searchParams.age}
            onChange={handleSearchChange}
          />
          <input
            type="text"
            placeholder="Gender"
            name="gender"
            value={searchParams.gender}
            onChange={handleSearchChange}
          />
          <input
            type="text"
            placeholder="Condition"
            name="condition"
            value={searchParams.condition}
            onChange={handleSearchChange}
          />
          <button onClick={fetchPatients}>Search</button>
        </div>
      </div>
      {/* Add/Edit Patient */}
      <div className="form-section">
        <h2>{editingPatient ? "Edit Patient" : "Add New Patient"}</h2>
        <div className="form-fields">
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
          />
          <input
            type="number"
            placeholder="Age"
            name="age"
            value={formData.age}
            onChange={handleFormChange}
          />
          <input
            type="text"
            placeholder="Gender"
            name="gender"
            value={formData.gender}
            onChange={handleFormChange}
          />
          <input
            type="text"
            placeholder="Condition"
            name="condition"
            value={formData.condition}
            onChange={handleFormChange}
          />
          <select
            name="doctor_id"
            value={formData.doctor_id}
            onChange={handleFormChange}
          >
            <option value="">Select Doctor</option>
            {allDoctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} ({doctor.specialty})
              </option>
            ))}
          </select>
          {editingPatient ? (
            <>
              <button onClick={handleUpdatePatient}>Update</button>
              <button onClick={handleCancelEditPatient}>Cancel</button>
            </>
          ) : (
            <button onClick={handleAddPatient}>Add Patient</button>
          )}
        </div>
      </div>
      {/* Patient List */}
      <div className="patients-list">
        <h2>Patients List</h2>
        {patients.length > 0 ? (
          <ul>
            {patients.map((patient) => (
              <li key={patient.id}>
                <b>{patient.name}</b> ({patient.age}, {patient.gender}) -{" "}
                {patient.condition}
                <br />
                Doctor:{" "}
                {allDoctors.find((d) => d.id === patient.doctor_id)?.name ||
                  "None"}
                <div className="patient-actions">
                  <button onClick={() => handleEditPatient(patient)}>
                    Edit
                  </button>
                  <button onClick={() => handleDeletePatient(patient.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No patients found.</p>
        )}
      </div>
      {/* Doctors Section */}
      <div className="doctors-list">
        <h2>Doctors</h2>
        <div className="doctor-controls">
          <div className="doctor-filter">
            <select value={specialtyFilter} onChange={handleSpecialtyFilter}>
              <option value="">All Specialties</option>
              {allSpecialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
            <button onClick={handleSpecialtyFilterButton}>Filter</button>
          </div>
          <div className="doctor-add-edit">
            <input
              type="text"
              placeholder="Doctor Name"
              name="name"
              value={doctorFormData.name}
              onChange={handleDoctorFormChange}
            />
            <input
              type="text"
              placeholder="Specialty"
              name="specialty"
              value={doctorFormData.specialty}
              onChange={handleDoctorFormChange}
            />
            {editingDoctor ? (
              <>
                <button onClick={handleUpdateDoctor}>Update</button>
                <button onClick={handleCancelEditDoctor}>Cancel</button>
              </>
            ) : (
              <button onClick={handleAddDoctor}>Add Doctor</button>
            )}
          </div>
        </div>
        {doctorError && (
          <div style={{ color: "red", marginBottom: 10 }}>{doctorError}</div>
        )}
        {doctors.length > 0 ? (
          <ul>
            {doctors.map((doctor) => (
              <li key={doctor.id}>
                <b>{doctor.name}</b> ({doctor.specialty})
                <button onClick={() => handleEditDoctor(doctor)}>Edit</button>
                <button onClick={() => handleDeleteDoctor(doctor.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No doctors found.</p>
        )}
      </div>
      {/* Doctor Report */}
      <div className="report-section">
        <h2>Doctor Report (Patient Count)</h2>
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>Patient Count</th>
            </tr>
          </thead>
          <tbody>
            {doctorReport.map((row) => (
              <tr
                key={row.id}
                style={{ cursor: "pointer" }}
                onClick={() => handleDoctorReportRowClick(row.id)}
                className={
                  selectedDoctorForPatients === row.id ? "selected-row" : ""
                }
              >
                <td>{row.name}</td>
                <td>{row.specialty}</td>
                <td>{row.patient_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {doctorPatients.length > 0 && selectedDoctorForPatients && (
          <div className="doctor-patients">
            <h3>
              Patients of{" "}
              {allDoctors.find((d) => d.id === selectedDoctorForPatients)?.name}
            </h3>
            <ul>
              {doctorPatients.map((p) => (
                <li key={p.id}>
                  {p.name} ({p.age}, {p.gender}) - {p.condition}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

// ---- Appointment Portal ----

function AppointmentPortal() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    patient_id: "",
    doctor_id: "",
    date: "",
    time: "",
    duration: "",
    notes: "",
  });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [reportFilters, setReportFilters] = useState({
    patient_name: "",
    doctor_name: "",
    date_from: "",
    date_to: "",
    duration: "",
  });
  const [reportResults, setReportResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [durations, setDurations] = useState([]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
    fetchDurations();
    // eslint-disable-next-line
  }, []);

  const fetchAppointments = async () => {
    const res = await axiosInstance.get("/appointments");
    setAppointments(res.data);
  };
  const fetchPatients = async () => {
    const res = await axiosInstance.get("/patients");
    setPatients(res.data);
  };
  const fetchDoctors = async () => {
    const res = await axiosInstance.get("/doctors");
    setDoctors(res.data);
  };
  const fetchDurations = async () => {
    const res = await axiosInstance.get("/appointments/durations");
    setDurations(res.data);
  };

  // Autofill doctor when patient is selected
  useEffect(() => {
    if (formData.patient_id && !editingAppointment) {
      const patient = patients.find(
        (p) => p.id === Number(formData.patient_id)
      );
      if (patient) {
        setFormData((f) => ({ ...f, doctor_id: patient.doctor_id }));
      }
    }
    // eslint-disable-next-line
  }, [formData.patient_id, patients]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleAddAppointment = async () => {
    await axiosInstance.post("/appointments", formData);
    fetchAppointments();
    setFormData({
      patient_id: "",
      doctor_id: "",
      date: "",
      time: "",
      duration: "",
      notes: "",
    });
  };

  const handleEditAppointment = (appt) => {
    setEditingAppointment(appt);
    setFormData({
      patient_id: appt.patient_id,
      doctor_id: appt.doctor_id,
      date: appt.date,
      time: appt.time,
      duration: appt.duration,
      notes: appt.notes,
    });
  };

  const handleUpdateAppointment = async () => {
    await axiosInstance.put(`/appointments/${editingAppointment.id}`, formData);
    fetchAppointments();
    setEditingAppointment(null);
    setFormData({
      patient_id: "",
      doctor_id: "",
      date: "",
      time: "",
      duration: "",
      notes: "",
    });
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
    setFormData({
      patient_id: "",
      doctor_id: "",
      date: "",
      time: "",
      duration: "",
      notes: "",
    });
  };

  const handleDeleteAppointment = async (id) => {
    await axiosInstance.delete(`/appointments/${id}`);
    fetchAppointments();
  };

  // Report
  const handleReportFilterChange = (e) => {
    const { name, value } = e.target;
    setReportFilters((f) => ({ ...f, [name]: value }));
  };

  const handleGenerateReport = async () => {
    const params = {};
    Object.entries(reportFilters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    const res = await axiosInstance.get("/appointments/report", { params });
    // If backend returns {appointments: [...], stats: {...}}
    if (res.data.appointments && res.data.stats) {
      setReportResults(res.data.appointments);
      setStats(res.data.stats);
    } else {
      setReportResults(res.data);
      setStats(null);
    }
    setReportFilters({
      patient_name: "",
      doctor_name: "",
      date_from: "",
      date_to: "",
      duration: "",
    });
  };

  // Time options (1hr intervals)
  const timeOptions = [];
  for (let h = 0; h < 24; ++h) {
    timeOptions.push(`${h.toString().padStart(2, "0")}:00`);
  }

  return (
    <div>
      <h2>Appointment Portal</h2>
      {/* Add/Edit Appointment */}
      <div className="form-section">
        <h3>{editingAppointment ? "Edit Appointment" : "Create Appointment"}</h3>
        <div className="form-fields">
          <select
            name="patient_id"
            value={formData.patient_id}
            onChange={handleFormChange}
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="doctor_id"
            value={formData.doctor_id}
            onChange={handleFormChange}
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleFormChange}
          />
          <select
            name="time"
            value={formData.time}
            onChange={handleFormChange}
          >
            <option value="">Select Time</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="duration"
            placeholder="Duration (minutes)"
            value={formData.duration}
            onChange={handleFormChange}
            min={1}
          />
          <input
            type="text"
            name="notes"
            placeholder="Notes"
            value={formData.notes}
            onChange={handleFormChange}
          />
          {editingAppointment ? (
            <>
              <button onClick={handleUpdateAppointment}>Update</button>
              <button onClick={handleCancelEdit}>Cancel</button>
            </>
          ) : (
            <button onClick={handleAddAppointment}>Add Appointment</button>
          )}
        </div>
      </div>
      {/* Appointment List */}
      <div className="appointments-list">
        <h3>Appointments</h3>
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <ul>
            {appointments.map((a) => (
              <li key={a.id}>
                <b>{a.patient_name}</b> with <b>{a.doctor_name}</b> on {a.date} at {a.time} for {a.duration} min.
                <br />
                Notes: {a.notes}
                <div className="patient-actions">
                  <button onClick={() => handleEditAppointment(a)}>Edit</button>
                  <button onClick={() => handleDeleteAppointment(a.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Report */}
      <div className="report-section" style={{ marginTop: 32 }}>
        <h3>Generate Appointment Report</h3>
        <div className="search-fields">
          <input
            type="text"
            placeholder="Patient Name"
            name="patient_name"
            value={reportFilters.patient_name}
            onChange={handleReportFilterChange}
          />
          <input
            type="text"
            placeholder="Doctor Name"
            name="doctor_name"
            value={reportFilters.doctor_name}
            onChange={handleReportFilterChange}
          />
          <input
            type="date"
            name="date_from"
            value={reportFilters.date_from}
            onChange={handleReportFilterChange}
          />
          <input
            type="date"
            name="date_to"
            value={reportFilters.date_to}
            onChange={handleReportFilterChange}
          />
          <select
            name="duration"
            value={reportFilters.duration}
            onChange={handleReportFilterChange}
          >
            <option value="">All Durations</option>
            {durations.map((d) => (
              <option key={d} value={d}>
                {d} minutes
              </option>
            ))}
          </select>
          <button onClick={handleGenerateReport}>Generate Report</button>
        </div>
        {reportResults.length > 0 && (
          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {reportResults.map((a) => (
                  <tr key={a.id}>
                    <td>{a.patient_name}</td>
                    <td>{a.doctor_name}</td>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
                    <td>{a.duration}</td>
                    <td>{a.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {reportResults.length === 0 && <div>No results found.</div>}
        {/* Stats Section */}
        {stats && (
          <div className="stats-section">
            <h4>Appointment Statistics</h4>
            <div className="stats-grid">
              <div>
                <label>Average Duration:</label>
                <span>{stats.average_duration} mins</span>
              </div>
              <div>
                <label>Total Appointments:</label>
                <span>{stats.total_appointments}</span>
              </div>
              <div>
                <label>Avg Days Between Visits:</label>
                <span>
                  {stats.average_days_between_visits === null
                    ? "N/A"
                    : stats.average_days_between_visits}
                </span>
              </div>
              <div>
                <label>Unique Reasons:</label>
                <span>
                  {stats.unique_reasons && stats.unique_reasons.length > 0
                    ? stats.unique_reasons.join(", ")
                    : "None recorded"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
