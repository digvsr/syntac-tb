import React, {useState, useEffect} from 'react';


const Timetable = ({timetable}) => {
    const[t_timetable, setTimetable] = useState(null);

    useEffect(() => {
        fetch("http://localhost:5000/api/timetable", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ unavailable_teachers: [], class_events: [] }),
        })
        .then(response => response.json())
        .then(data => {
            console.log("Timetable data received:", data); // Debugging
            setTimetable(data);
        })
        .catch(error => console.error("Error fetching timetable:", error));
    }, []);
    if(loading){
        return <div>Loading timetable.....</div>;
    }
    if(error){
        return <div>Error loading timetbale : {error.message}</div>;
    }
    if (!timetable) {
        return <div>No timetable data available.</div>;
    }
    
    return(
        <div>
            <h1>Syntac Edu Timetable</h1>
            {Object.keys(timetable).map(cls =>{
                return(
                <div key={cls}>
                    <h2>{cls}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Teacher</th>
                                <th>Subject</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timetable[cls].map((slot, idx) =>(
                                <tr key={idx}>
                                    <td>{slot?.slot || 'N/A'}</td>
                                    <td>{slot?.teacher || 'Free'}</td>
                                    <td>{slot?.subject ||'Unknown'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
            );
            })}
        </div>
    );
};
export default Timetable;