import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [error, setError] = useState("");
  const [unavailableTeachers, setUnavailableTeachers] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/timetable/get", {
        class_section: selectedClass + "th-" + selectedSection,
      });

      setTimetable(response.data.timetable);
    } catch (err) {
      setError("Failed to retrieve timetable");
    }
  };

  const handleUpdateTimetable = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/timetable/update", {
        class_section: selectedClass + "th-" + selectedSection,
        unavailable_teachers: unavailableTeachers.split(","),
      });

      setTimetable(response.data.timetable);
    } catch (err) {
      setError("Failed to update timetable");
    }
  };

  return (
    <div className="App">
      <header>
        <h1>SYNTAC EDU TIMETABLE</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <section>
            <h2>Select Class</h2>
            <select onChange={(e) => setSelectedClass(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                <option key={grade} value={grade}>{grade}th</option>
              ))}
            </select>
          </section>
          <section>
            <h2>Select Section</h2>
            <select onChange={(e) => setSelectedSection(e.target.value)}>
              {["A", "B"].map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </section>
          <button type="submit">Retrieve Timetable</button>
        </form>

        <input
          type="text"
          placeholder="Enter unavailable teachers"
          value={unavailableTeachers}
          onChange={(e) => setUnavailableTeachers(e.target.value)}
        />
        <button onClick={handleUpdateTimetable}>Update Timetable</button>

        {error && <p className="error">{error}</p>}

        {timetable && (
          <table>
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Teacher</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.time}</td>
                  <td>{entry.teacher}</td>
                  <td>{entry.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;
