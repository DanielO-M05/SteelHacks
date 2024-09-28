import { useEffect, useState } from 'react';

function App() {
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');
  const [ws, setWs] = useState(null);

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

  const handleInput = () => {
    console.log("yippee");
  }

  return (
    <>
      <div>
        <h1>Note Sharing App</h1>
        <input 
          value={input}         // Set input value from state
          onChange={(e) => setInput(e.target.value)} // Update state on input change
        />
        <button onClick = {handleInput()}>Submit</button>
        <p>You inputted: {input}</p>
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

