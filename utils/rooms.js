const rooms = [];

function createRoom(type, name, owner, mods) {
    console.log("[SERVER] Creating new room: " + name + " " + owner);
    const room = { type, name, owner, mods };
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

module.exports = {
    createRoom,
    getAllRooms,
    roomExists
}