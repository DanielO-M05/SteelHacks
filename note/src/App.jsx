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
        const socket = new WebSocket('ws://localhost:3000');

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
    }, []);

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
            let note_combo = "";
            for (let i = 0; i < notes.length; i++) {
                note_combo += notes[i];
                note_combo += " --- ";
            }
            const result = await model.generateContent(prompt + note_combo);
            setSummary(result);
            console.log(text);
           // prompt = 
            setNotes([...notes, newNote]);
            setInput('');
        }

        try {
            // Wait for the content to be generated
            const result = await model.generateContent(prompt);
            
            // Access the text from the response
            console.log(result.response.text());
            
            // Optionally, you can also set it in your state
            setSummary(result.response.text());
        } catch (error) {
            console.error("Error generating content:", error);
        }

    };

    // Function to export notes as a PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;  // Get the height of the page
        let yOffset = 20;  // Start position for text

        doc.setFontSize(16);
        doc.text('Sticky Notes:', 10, 10);  // Add a title to the PDF

        notes.forEach((note, index) => {
            const noteText = `${note.name}: ${note.text}`;

            // Split long text into multiple lines
            const splitText = doc.splitTextToSize(noteText, 180);  // 180 is the line width

            // Check each line of text and handle page overflow
            splitText.forEach((line, lineIndex) => {
                if (yOffset + 10 > pageHeight) {  // If the next line would go out of bounds
                    doc.addPage();  // Add a new page
                    yOffset = 20;  // Reset y position
                }
                doc.text(line, 10, yOffset);
                yOffset += 10;  // Move to the next line position
            });

            yOffset += 10;  // Add space between notes
        });

        doc.save('notes.pdf');  // Save the PDF with a default file name
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
              {summary ? <p>Output is: {summary}</p> : <p>Nothing to Display</p>}              <br></br>
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

