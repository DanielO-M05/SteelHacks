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

    // const isFirstRender = useFirstRender();
    const [isFirstRender, setFirstRender] = useState(true);

    useEffect(() => {
        if (isFirstRender) {
            let name_input = window.prompt("Enter a name");
            while (name_input == null) {
                name_input = window.prompt("Must enter a name to continue");
            } 
            setName(name_input);
        } 
        setFirstRender(false);
    }, [isFirstRender]);

    function useFirstRender() {
        const ref = useRef(true);
        const firstRender = ref.current;
        ref.current = false;
        return firstRender;
    }

    const sendMessage = () => {
        if (ws) {
            ws.send('Hello from React!');
        }
    };

    const createNote = () => {
        if (input.trim() !== '') {
            const newNote = { name, text: input };
            setNotes([...notes, newNote]);
            setInput('');
        }

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
        </>
    );
}

export default App;

