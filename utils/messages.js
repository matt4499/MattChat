const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

function formatMessage(username, text) {
    const id = uuidv4();
    console.log("[SERVER] Generated message with ID " + id + " by " + username);
    return {
        username,
        text,
        time: moment().format('h:mm a'),
        id
    }
}

module.exports = formatMessage;