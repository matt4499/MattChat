const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Autolinker = require('autolinker');
const markdown = require('markdown').markdown;
const urlregex = require('url-regex');

const formatMessage = require('./utils/messages.js');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users.js');
const botName = "Server";

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', socket => {
    console.log("Created new socket: " + socket.id + ' ' + socket.handshake.address);
    socket.on('joinRoom', ({username, room}) => {     
        const user = userJoin(socket.id, username, room);
        if(!user){ 
            socket.emit('customerror', "Username already in use");
            return;
        }
        if(username.toLowerCase() == "matt4499" && socket.handshake.address != "::ffff:192.168.1.222"){
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
        if(!user) return;
        const regex = /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/gmi;
        if(String(msg).match(regex)){
            var linkedMsg = Autolinker.link(msg);
            io.to(user.room).emit('message',  formatMessage(user.username, linkedMsg));
            return io.to(user.room).emit('ytMessage', youtube_parser(String(msg).match(regex)));
        }
        if(urlregex().test(msg)){
            var linkedMsg = Autolinker.link(msg);
            io.to(user.room).emit('message',  formatMessage(user.username, linkedMsg));
        } else {
            var MD = markdown.toHTML(msg);
            io.to(user.room).emit('message',  formatMessage(user.username, MD));
        }
    });
    // Broadcast when a user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {   
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has disconnected`));
            // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
        }
    });
});

app.use(express.static(path.join(__dirname, "public")));
server.listen(80, () => console.log("[Server] Now running on PORT 80"));

function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = String(url).match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}