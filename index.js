const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });
const { ExpressPeerServer } = require('peer');

// Integrated PeerJS Server
const peerServer = ExpressPeerServer(http, {
    debug: true,
    path: '/myapp'
});
app.use('/peerjs', peerServer);

// 1. Password Protection for Admin
app.get('/admin.html', (req, res) => {
    const password = req.query.pwd;
    if (password === 'alpine') {
        res.sendFile(path.join(__dirname, 'admin.html'));
    } else {
        res.status(403).send('Access Denied: Incorrect Password');
    }
});

// 2. Serve User HTML as the default Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'user.html'));
});

// Serve other static files (CSS, JS, images)
app.use(express.static(__dirname));

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

// Viewer simulation
setInterval(() => {
    if (userStatus === "Broadcasting") {
        viewerCount = Math.floor(Math.random() * (200 - 150 + 1)) + 150;
    } else {
        viewerCount = 0;
    }
    io.emit('update-views', viewerCount);
}, 3000);

// Use Railway's dynamic port or default to 3000
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
