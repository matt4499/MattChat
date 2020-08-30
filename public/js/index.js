const socket = io({
    reconnectionAttempts: 5,
    timeout: 8000
});

const roomlist = $('roomlist');

// Join chatroom
socket.emit('getAllRooms');

// Message from server
socket.on('showAllRooms', rooms => {
    if (rooms.length < 1) {
        window.alert("The server returned no rooms.");
        window.location.replace("http://mattchat.us.to");
    }
    $('.room-list').empty();
    rooms.forEach(function (room) {
        console.log("[CLIENT] Recieved room: '" + room.name + "' Owner: " + room.owner + " Mods: " + room.mods);
        $(".room-list").append(`
        <select name="room" id="room">
						<option value="${room.name}">(${room.type}) '${room.name}' owned by: ${room.owner}</option>
					</select>
        `); // add room to the list of rooms
        $('select').formSelect(); // refresh the list
    });
});
