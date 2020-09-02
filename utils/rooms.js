const rooms = [];

function createRoom(type, name, owner, mods) {
    const LastMessage = {};
    console.log("[SERVER] Creating new room: " + name + " " + owner);
    const room = { type, name, owner, mods, LastMessage };
    if (rooms.find(room => room.name == name)) { // If the room already exists
        return false; // return false because we cant create the room
    } else {
        rooms.push(room); // add our new room to the global room list
    }
}

function roomExists(name) {
    if (rooms.find(room => room.name == name)) { // If the room already exists
        return true;
    } else {
        return false;
    }
}

function getAllRooms() {
    return rooms;
}

function getRoomByName(name) {
    const RoomFound = rooms.find(room => room.name == name);
    if (RoomFound) {
        return RoomFound;
    } else {
        return null;
    }
}

function setRoomLastMessage(room3, message) {
    const room = rooms.find(room2 => room2.name == room3);
    if (room) {
        room.LastMessage = {};
        room.LastMessage = message;
        console.log("[SERVER] Changing room " + room.name + " lastMessage to " + message.username + " with id: " + message.id);
    } else {
        console.log("could not set room last message");
        return false;
    }
}

function getRoomLastMessage(name) {
    const room = getRoomByName(name);
    return room.LastMessage;
}

module.exports = {
    createRoom,
    getAllRooms,
    roomExists,
    setRoomLastMessage,
    getRoomLastMessage,
    getRoomByName
}