const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3000 });

server.on('connection', (ws) => {
  console.log('A user connected');

  // Listen for messages from the client
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);

    // Echo the message back to the client
    ws.send(`Server received: ${message}`);
  });

  ws.on('close', () => {
    console.log('A user disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:3000');