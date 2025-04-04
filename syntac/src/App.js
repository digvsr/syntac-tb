import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [timetableData, setTimetableData] = useState(null);
  const [currentClassSection, setCurrentClassSection] = useState(""); // New state
  const [errorMessage, setErrorMessage] = useState("");
  const [unavailableTeachersInput, setUnavailableTeachersInput] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const resetForm = () => {
    setSelectedGrade("");
    setSelectedSection("");
    setErrorMessage("");
  };

  const fetchTimetable = async (e) => {
    e.preventDefault();
    if (!selectedGrade || !selectedSection) {
      setErrorMessage("Please select a grade and section.");
      console.log("Missing grade or section:", { selectedGrade, selectedSection });
      return;
    }
    const classSection = `${selectedGrade}th-${selectedSection}`;
    console.log("Fetching timetable for:", classSection);
    try {
      const response = await axios.post("http://localhost:5000/api/timetable/get", {
        class_section: classSection,
      });
      console.log("Response from server:", response.data);
      setTimetableData(response.data.timetable);
      setCurrentClassSection(classSection); // Set the class-section
      resetForm();
    } catch (err) {
      console.error("Error fetching timetable:", err.response?.data || err.message);
      setErrorMessage("Failed to retrieve timetable.");
    }
  };

  const generateAllTimetables = async () => {
    console.log("Starting generate all timetables...");
    try {
      const gradeSections = [];
      for (let grade = 1; grade <= 10; grade++) {
        for (let section of ["A", "B"]) {
          gradeSections.push(`${grade}th-${section}`);
        }
      }
      console.log("Grade sections to fetch:", gradeSections);

      const allTimetables = {};
      for (let gradeSection of gradeSections) {
        console.log("Fetching for:", gradeSection);
        const response = await axios.post("http://localhost:5000/api/timetable/get", {
          class_section: gradeSection,
        });
        allTimetables[gradeSection] = response.data.timetable;
      }
      console.log("All timetables fetched:", allTimetables);

      let htmlContent = "<html><body>";
      for (const [gradeSection, timetable] of Object.entries(allTimetables)) {
        htmlContent += `<h2>${gradeSection}</h2>`;
        htmlContent += "<table border='1'><thead><tr><th>Time Slot</th><th>Teacher</th><th>Subject</th></tr></thead><tbody>";
        htmlContent += timetable
          .map(
            (entry) =>
              `<tr><td>${entry.time}</td><td>${entry.teacher}</td><td>${entry.subject}</td></tr>`
          )
          .join("");
        htmlContent += "</tbody></table><br>";
      }
      htmlContent += "</body></html>";

      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "all_timetables.html";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating all timetables:", err.response?.data || err.message);
      setErrorMessage("Failed to generate all timetables.");
    }
  };

  const updateTimetable = async () => {
    if (!selectedGrade || !selectedSection || !unavailableTeachersInput) {
      setErrorMessage("Please select a grade, section, and enter unavailable teachers.");
      console.log("Missing data for update:", { selectedGrade, selectedSection, unavailableTeachersInput });
      return;
    }
    const classSection = `${selectedGrade}th-${selectedSection}`;
    console.log("Updating timetable for:", classSection, "with unavailable:", unavailableTeachersInput);
    try {
      const response = await axios.post("http://localhost:5000/api/timetable/update", {
        class_section: classSection,
        unavailable_teachers: unavailableTeachersInput,
      });
      console.log("Update response:", response.data);
      setTimetableData(response.data.timetable);
      setCurrentClassSection(classSection); // Update class-section after update too
      setUnavailableTeachersInput("");
    } catch (err) {
      console.error("Error updating timetable:", err.response?.data || err.message);
      setErrorMessage("Failed to update timetable.");
    }
  };

  const handleOptionSelection = (option) => {
    setShowOptions(false);
    console.log("Selected option:", option);
    switch (option) {
      case "generate":
        alert("Generate new table - TBD");
        break;
      case "shuffle":
        alert("Teacher shuffling - TBD");
        break;
      case "unavailable":
        updateTimetable();
        break;
      case "classes":
        alert("Changes in classes - TBD");
        break;
      default:
        break;
    }
  };

  return (
    <div className="App">
      <header>
        <h1>SYNTAC EDU TIMETABLE</h1>
      </header>
      <main>
        <form onSubmit={fetchTimetable}>
          <section>
            <h2>Select Grade</h2>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
              <option value="">Select Grade</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((grade) => (
                <option key={grade} value={grade}>{grade}th</option>
              ))}
            </select>
          </section>
          <section>
            <h2>Select Section</h2>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
              <option value="">Select Section</option>
              {["A", "B"].map((section) => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </section>
          <button type="submit">Generate Timetable</button>
        </form>

        <input
          type="text"
          placeholder="Enter unavailable teachers (e.g., T001,T002)"
          value={unavailableTeachersInput}
          onChange={(e) => setUnavailableTeachersInput(e.target.value)}
        />

        <button onClick={generateAllTimetables}>Generate All Timetables</button>

        <div style={{ position: "relative" }}>
          <button onClick={() => setShowOptions(!showOptions)}>Options</button>
          {showOptions && (
            <div style={{ position: "absolute", background: "white", border: "1px solid #ddd", padding: "10px" }}>
              <button onClick={() => handleOptionSelection("generate")}>Generate New Table</button>
              <button onClick={() => handleOptionSelection("shuffle")}>Teacher Shuffling</button>
              <button onClick={() => handleOptionSelection("unavailable")}>Teacher Unavailability</button>
              <button onClick={() => handleOptionSelection("classes")}>Changes in Classes</button>
            </div>
          )}
        </div>

        {errorMessage && <p className="error">{errorMessage}</p>}

        {timetableData && (
          <div className="timetable-section">
            <h2>Timetable for {currentClassSection}</h2>
            <table>
              <thead>
                <tr>
                  <th>Time Slot</th>
                  <th>Teacher</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {timetableData.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.time}</td>
                    <td>{entry.teacher}</td>
                    <td>{entry.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;