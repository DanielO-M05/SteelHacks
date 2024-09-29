const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let clients = [];

wss.on('connection', (ws) => {
    // Add new client to the list
    clients.push(ws);
    console.log('Client connected. Total clients:', clients.length);

    ws.on('message', (message) => {
        console.log('Received:', message);

        // Broadcast the new note to all clients
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        // Remove client from the list
        clients = clients.filter(client => client !== ws);
        console.log('Client disconnected. Total clients:', clients.length);
    });
});

// Start the server on port 5173
server.listen(5173, () => {
    console.log('WebSocket server is listening on ws://localhost:5173');
});


// server.js
/*const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5173 });

let clients = [];

wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.push(ws);

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        // Broadcast the message to all connected clients
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
});

console.log('WebSocket server is running on ws://localhost:5173');

*/

/*const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 5173 });
const clients = new Set();

server.on('connection', (ws) => {
  console.log('A user connected');
  clients.add(ws);

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

console.log('WebSocket server is running on ws://localhost:5173');*/

