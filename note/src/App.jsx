


import jsPDF from 'jspdf';
import { useRef, useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

function App() {
    const [response, setResponse] = useState('');
    const [input, setInput] = useState('');
    const [name, setName] = useState('');
    const [ws, setWs] = useState(null);
    const [summary, setSummary] = useState('');
    const [notes, setNotes] = useState([]);

    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Can you summarize these notes:";
 

    useEffect(() => {
        // Create WebSocket connection
        const socket = new WebSocket('ws://localhost:5173');
    
        // Set WebSocket instance
        setWs(socket);
    
        // Listen for messages from the server
        socket.onmessage = (event) => {
            const newNote = JSON.parse(event.data);
            setNotes((prevNotes) => [...prevNotes, newNote]);
        };
    
        socket.onopen = () => {
            console.log('Connected to the WebSocket server');
        };
    
        socket.onclose = () => {
            console.log('Disconnected from the WebSocket server');
        };
    
        // Cleanup on component unmount
        return () => {
            socket.close();
        };
    }, []);

/*
    useEffect(() => {
        // Create WebSocket connection
        const socket = new WebSocket('ws://localhost:5173');

        // Set WebSocket instance
        setWs(socket);

        // Listen for messages from the server
        socket.onmessage = (event) => {
            setResponse(event.data);
        };

        socket.onopen = () => {
            console.log('Connected to the WebSocket server');
        };

        socket.onclose = () => {
            console.log('Disconnected from the WebSocket server');
        };

        // Cleanup on component unmount
        return () => {
            socket.close();
        };
    }, []);*/

    const hasPromptedRef = useRef(false); // Create a ref to track if the prompt has been shown

    useEffect(() => {
        if (!hasPromptedRef.current) { // Check if the prompt has been shown
            let nameInput = window.prompt("Enter a name");
            while (nameInput == null || nameInput.trim() === '') { // Ensure input is valid
                nameInput = window.prompt("Must enter a name to continue");
            } 
            setName(nameInput);
            hasPromptedRef.current = true; // Mark that the prompt has been shown
        }
    }, []); // Empty dependency array to run only once


    const sendMessage = () => {
        if (ws) {
            ws.send('Hello from React!');
        }
    };

    const createNote = async () => {
        if (input.trim() !== '') {
            const newNote = { name, text: input };
            setInput('');

            // Update notes and generate summary based on the updated notes
            setNotes((prevNotes) => {
                const updatedNotes = [...prevNotes, newNote]; // Create a new array with the new note

                // Create the note combo for the prompt
                const note_combo = updatedNotes.map(note => `Note: ${note.text} --- `).join('');
                const temp_prompt = prompt + note_combo;

                // Generate summary
                model.generateContent(temp_prompt).then(result => {
                    setSummary(result.response.text());
                });

                return updatedNotes; // Return the updated notes
            });

            if (ws) {
                ws.send(JSON.stringify(newNote));
            }
        }
    };

    // Function to export notes as a PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;  // Get the height of the page
        let yOffset = 20;  // Initial y-offset position

        doc.setFontSize(16);

        // Include the summary at the top
        doc.text('Summary:', 10, 10);
        const summaryText = summary || "";  // Ensure `summary` is defined
        const splitSummary = doc.splitTextToSize(summaryText, 180);  // Wrap summary text if too long

        splitSummary.forEach((line) => {
            if (yOffset + 10 > pageHeight) {  // Check if the text would overflow
                doc.addPage();
                yOffset = 20;  // Reset y position on new page
            }
            doc.text(line, 10, yOffset);  // Print each line of the summary
            yOffset += 10;
        });

        yOffset += 10;  // Add space after the summary

        doc.text('Sticky Notes:', 10, yOffset);  // Add a title for the notes
        yOffset += 10;

        // Include all notes in the PDF
        notes.forEach((note, index) => {
            const noteText = `${note.name}: ${note.text}`;
            const splitText = doc.splitTextToSize(noteText, 180);  // Wrap note text

            splitText.forEach((line) => {
                if (yOffset + 10 > pageHeight) {  // Check for page overflow
                    doc.addPage();
                    yOffset = 20;  // Reset y position on new page
                }
                doc.text(line, 10, yOffset);
                yOffset += 10;  // Move to the next line position
            });

            yOffset += 10;  // Add space between notes
        });

        doc.save('notes.pdf');  // Save the PDF with the included summary
    };

    const handleInput = () => {
        console.log("yippee");
    }

    return (
        <>
          <div>
              <h1>Note Sharing App</h1>
              <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
              />
              <button onClick={createNote}>Add Sticky</button>
              <h3>Summary</h3>
              {summary ? <p>{summary}</p> : <p>Nothing to Display</p>}              <br></br>
              <br></br>
              <br></br>
              {/* <button onClick={sendMessage}>Send Message to Server</button>
      <p>Response from server: {response}</p> */}
          </div>
          <div>
              <h2>Your Notes</h2>
              {notes.map((note, index) => (
                  <div key={index} className="note">
                      <strong>{note.name}:</strong> {note.text}
                  </div>
              ))}
          </div>
          <div>
          <button onClick={exportToPDF}>Export Notes to PDF</button>
        </div>
        </>
    );
}

export default App;

