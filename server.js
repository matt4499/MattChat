const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const socketio = require('socket.io');
const Autolinker = require('autolinker');
const fs = require('fs');
const markdown = require('markdown').markdown;

const formatMessage = require('./utils/messages.js');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users.js');
const { getAllRooms, createRoom } = require("./utils/rooms.js");
const { truncate, fstat } = require('fs');
const botName = "Server";

const app = express();

const server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/mattchat.us.to/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/mattchat.us.to/cert.pem'),
    ca: fs.readFileSync('/etc/letsencrypt/live/mattchat.us.to/chain.pem')
}, app).listen(443, () => {
    console.log("[SERVER] HTTPS server started")
});

const io = socketio(server);

createRoom("public", "Public", "Matt4499", ["None"]);

io.on('connection', socket => {
    console.log("Created new socket: " + socket.id + ' ' + socket.handshake.address);
    socket.emit('showAllRooms', getAllRooms());
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        if (!user) {
            socket.emit('customerror', "Username already in use");
            return;
        }
        if (username.toLowerCase() == "matt4499" && socket.handshake.address != "::ffff:192.168.1.222") {
            socket.emit('customerror', "Username not allowed.");
            return;
        }
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, `Welcome to ${user.room}`)); //Emits only to user connected

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`)); //Emits to all users EXCEPT the one connecting

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });
    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        if (!user) return;
        const regex = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/gmi;
        if (String(msg).match(regex)) {
            var linkedMsg = Autolinker.link(msg);
            io.to(user.room).emit('message', formatMessage(user.username, linkedMsg));
            return io.to(user.room).emit('ytMessage', youtube_parser(String(msg).match(regex)));
        }
        var urlregex = new RegExp(
            "^" +
            // protocol identifier (optional)
            // short syntax // still required
            "(?:(?:(?:https?|ftp):)?\\/\\/)" +
            // user:pass BasicAuth (optional)
            "(?:\\S+(?::\\S*)?@)?" +
            "(?:" +
            // IP address exclusion
            // private & local networks
            "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
            "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
            "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
            // IP address dotted notation octets
            // excludes loopback network 0.0.0.0
            // excludes reserved space >= 224.0.0.0
            // excludes network & broadcast addresses
            // (first & last IP address of each class)
            "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
            "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
            "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
            "|" +
            // host & domain names, may end with dot
            // can be replaced by a shortest alternative
            // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
            "(?:" +
            "(?:" +
            "[a-z0-9\\u00a1-\\uffff]" +
            "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
            ")?" +
            "[a-z0-9\\u00a1-\\uffff]\\." +
            ")+" +
            // TLD identifier name, may end with dot
            "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
            ")" +
            // port number (optional)
            "(?::\\d{2,5})?" +
            // resource path (optional)
            "(?:[/?#]\\S*)?" +
            "$", "i"
        );
        if (String(msg).match(urlregex)) {
            var linkedMsg = Autolinker.link(msg);
            io.to(user.room).emit('message', formatMessage(user.username, linkedMsg));
        } else {
            var MD = markdown.toHTML(msg);
            io.to(user.room).emit('message', formatMessage(user.username, MD));
        }
    });
    // Broadcast when a user disconnects
    socket.on('disconnect', (reason) => {
        var RealReason;
        switch(reason){
            case "transport close":
                RealReason = "Disconnected Normally";
                break;
            case "client namespace disconnect":
                RealReason = "Manually terminated socket";
                break;
            case "server namespace disocnnect":
                RealReason = "Connection terminated by server";
                break;
            case "ping timeout":
                RealReason = "User timed out";
                break;
            case "transport error":
                RealReason = "An error occured";
                break;
            default:
                RealReason = "Unknown Reason";
        }
        const user = userLeave(socket.id);
        if (user) {
            console.log(`${user.username} disconnected due to ${RealReason}`);
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has disconnected: ${RealReason}` ));
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({
    extended: true
}));

// app.post('/create-room', (req, res) => {

// });

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, './public', "404.html"));
    console.log("[SERVER] " + req.ip + " just error 404'd while looking for: " + req.originalUrl);
});

function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = String(url).match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
}