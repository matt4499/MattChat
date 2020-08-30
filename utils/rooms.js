const rooms = [];

function createRoom(name, owner, mods) {
    console.log("[SERVER] Creating new room: " + name + " " + owner);
    const room = { name, owner, mods };
    if (rooms.find(room => room.name == name)) { // If the room already exists
        return false; // return false because we cant create the room
    } else {
        rooms.push(room); // add our new room to the global room list
    }
}

function getAllRooms() {
    return rooms;
}

module.exports = {
    createRoom,
    getAllRooms
}