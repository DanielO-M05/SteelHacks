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

  const prompt = "Write a story about a magic backpack.";
  //setSummary(model.generateContent(prompt));

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
            setNotes([...notes, newNote]);
            setInput('');
        }

        try {
            // Wait for the content to be generated
            const result = await model.generateContent(prompt);
            
            // Optionally, you can also set it in your state
            setSummary(result.response.text());
        } catch (error) {
            console.error("Error generating content:", error);
        }
    };

    // Function to export notes as a PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Sticky Notes:', 10, 10);  // Add a title to the PDF

        notes.forEach((note, index) => {
            const noteText = `${note.name}: ${note.text}`;
            doc.text(noteText, 10, 20 + index * 10);  // Add each note to the PDF
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
              {/* <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
              /> */}
              <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
              />
              <button onClick={createNote}>Add Sticky</button>
              <p>Your name is: {name}</p>
              <p>Output is: {summary}</p>
              <br></br>
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

