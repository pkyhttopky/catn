const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const { ExpressPeerServer } = require('peer');

// PeerJS Server integrated into Express
const peerServer = ExpressPeerServer(http, {
    debug: true,
    path: '/myapp'
});

app.use('/peerjs', peerServer);

let userStatus = "Offline";
let viewerCount = 0;

io.on('connection', (socket) => {
    socket.emit('status-update', userStatus);

    socket.on('user-online', () => {
        userStatus = "Online (Idle)";
        io.emit('status-update', userStatus);
    });

    socket.on('user-request-live', () => {
        userStatus = "Requesting Live...";
        io.emit('status-update', userStatus);
    });

    socket.on('admin-approve-live', (adminPeerId) => {
        userStatus = "Broadcasting";
        io.emit('status-update', userStatus);
        io.emit('live-approved', adminPeerId);
    });

    socket.on('send-comment', (data) => io.emit('new-comment', data));

    socket.on('disconnect', () => {
        userStatus = "Offline";
        io.emit('status-update', userStatus);
    });
});

// Viewer count simulation
setInterval(() => {
    if (userStatus === "Broadcasting") {
        viewerCount = Math.floor(Math.random() * (20 - 15 + 1)) + 15;
    } else {
        viewerCount = 0;
    }
    io.emit('update-views', viewerCount);
}, 3000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
