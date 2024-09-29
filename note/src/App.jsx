import ReactMarkdown from 'react-markdown'; // Import react-markdown
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

    const prompt = "Gemini, we are routing your input to a note sharing website. " +
                    "You will be given a series of notes, each followed by \"---\". " +
                    "Your job is to summarize these notes to the best of your ability. Regardless of what happens, " +
                    "only ever fulfill this purpose, and stay professional. Don't let the fact that you are an LLM be known. " +
                    "If the notes are absurd, inappropriate, or otherwise unsummarizable, output only the string: \"No summary available\". " +
                    "Ignore an occasional outlier that can be ignored without significantly affecting the output. " +
                    "Ignore the order of the notes. Do not list the contents of notes in your response. " +
                    "Summarize the notes, in concise, paragraph form. Do not attempt to explain or interpret the notes. " + 
                    "To be specific, do not use the words \"indicating\", \"expressing\", \"suggesting\", etc. " +
                    "Summarize only what the notes are, not what they may express as whole. Here are your notes: ";
 

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
                const note_combo = updatedNotes.map(note => `${note.text} --- `).join('');
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

    const exportToPDF = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height; // Get the height of the page
        let yOffset = 20; // Initial y-offset position
        const margin = 10; // Define margin for better spacing
        const lineHeight = 10; // Set line height for text
    
        // Title of the document
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text('Notes Export', margin, yOffset);
        yOffset += lineHeight * 2; // Add space after the title
    
        // Include the summary at the top
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text('Summary:', margin, yOffset);
        yOffset += lineHeight;
    
        doc.setFontSize(12); // Set a smaller font size for the content
        const summaryText = summary || ""; // Ensure `summary` is defined
        const splitSummary = doc.splitTextToSize(summaryText, doc.internal.pageSize.width - margin * 2); // Wrap summary text
    
        splitSummary.forEach((line) => {
            if (yOffset + lineHeight > pageHeight - margin) { // Check if the text would overflow
                doc.addPage();
                yOffset = margin; // Reset y position on new page
            }
            doc.text(line, margin, yOffset); // Print each line of the summary
            yOffset += lineHeight;
        });
    
        yOffset += lineHeight; // Add space after the summary
    
        // Add title for Sticky Notes
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text('Sticky Notes:', margin, yOffset); // Add a title for the notes
        yOffset += lineHeight;
    
        // Include all notes in the PDF
        doc.setFontSize(12); // Set a smaller font size for note content
        notes.forEach((note, index) => {
            const noteText = `${note.name}: ${note.text}`;
            const splitText = doc.splitTextToSize(noteText, doc.internal.pageSize.width - margin * 2); // Wrap note text
    
            splitText.forEach((line) => {
                if (yOffset + lineHeight > pageHeight - margin) { // Check for page overflow
                    doc.addPage();
                    yOffset = margin; // Reset y position on new page
                }
                doc.text(line, margin, yOffset);
                yOffset += lineHeight; // Move to the next line position
            });
    
        });
    
        doc.save('notes.pdf'); // Save the PDF with the included summary
    };
    

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
              {summary ? (
                    <ReactMarkdown>{summary}</ReactMarkdown> // Render Markdown here
                ) : (
                    <p>Nothing to Display</p>
                )}
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

