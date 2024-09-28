import { useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';



function App() {
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [ws, setWs] = useState(null);
  const [summary, setSummary] = useState('');

  const genAI = new GoogleGenerativeAI(process.env.API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Write a story about a magic backpack.";
  setSummary = model.generateContent(prompt);



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

    const sendMessage = () => {
        if (ws) {
            ws.send('Hello from React!');
        }
    };

    const handleClear = () => {
        // Save old input to notes
        setInput("");
    }

    const handleInput = () => {
        console.log("yippee");
    }

    return (
        <>
            <div>
                <h1>Note Sharing App</h1>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                />
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button onClick={handleClear}>Add Sticky</button>
                <p>You inputted: {input}</p>
                <p>Your name is: {name}</p>
                <p>Output is {summary}</p>
                <br></br>
                <br></br>
                <br></br>
                {/* <button onClick={sendMessage}>Send Message to Server</button>
        <p>Response from server: {response}</p> */}
            </div>
        </>
    );
}

export default App;

