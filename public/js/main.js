const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const chatInput = document.getElementById('msg');

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
ignoreQueryPrefix: true
});

const socket = io();

socket.on('customerror', errormsg => {
    window.alert(errormsg);
    window.location.replace("http://mattchat.us.to");
});

// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

// Message from server
socket.on('message', message => {
    if(message){
        outputMessage(message);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('ytMessage', id => {
    outputYTembed(id);
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const msg = e.target.elements.msg.value;
    const CleanMSG = DOMPurify.sanitize(msg);
    // Emit message to server
    socket.emit('chatMessage', CleanMSG);

    // Clear inputs
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// Output message to dom
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
    <div class="container message-container">
    <div class="message-text">
    <p >${message.username} <span>${message.time}</span></p>
  <p>
    ${message.text}
  </p>
  </div>
  </div>`;
    document.querySelector('.chat-messages').appendChild(div);
}

function outputYTembed(id){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
    <iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${id}?controls=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
    document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to dom
function outputRoomName(room) {
    roomName.innerText = room;
}

// Add users to dom
function outputUsers(users){
    userList.innerHTML = `
    ${users.map(user => `<li> ${user.username} </li>`).join('')}
    `;
}

// function geeks(event) { 
//     // 13 is the keycode for "enter" 
//     if (event.keyCode == 13 && !event.shiftKey) { 
//         e.preventDefault();
//         $('.send-button').click();
//         return false;
//     }
// } 

$(document).ready(function() {
    $('textarea').characterCounter();
    $('.character-counter').css("color", "white");
});