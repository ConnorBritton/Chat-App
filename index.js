// Github repo: ConnorBritton/Chat-App

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var XRegExp = require('xregexp');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

var users = [];
var chatLog = [];
const chatLogSize = 200;

io.on('connection', (socket) => {
    // get username    
    let username = 'User' + users.length;
    users.push({
        username: username,
        online: true,
        color: "#000000"
    });
    console.log(username + ' connected');
    socket.emit('set username', username);
    io.emit('users update', users);

    // get the timestamp
    let dateObj = new Date();
    let timeStamp = ("0" + (dateObj.getHours())).slice(-2) + ':' + ("0" + (dateObj.getMinutes())).slice(-2) + ' ';

    // handle user connections
    //io.emit('connection message', { "timeStamp": timeStamp, "username": username, "msg": " connected..." });
    chatLog.push({
        timeStamp: timeStamp,
        user: users[users.findIndex((obj => obj.username == username))],
        msg: " connected..."
    });
    if(chatLog.length > chatLogSize) chatLog.shift(); // only display last 200 messages at most
    io.emit('chat message', chatLog);

    // handle user messages
    socket.on('chat message', (msg) => {
        // check if empty message
        if(msg != "") {
            let invalid = false;
        
            // change username        
            if(msg.split(" ")[0] == "/name") {
                // check if the username is already taken or if the new name is blank
                if(users.findIndex((obj => obj.username == msg.split(" ")[1])) == -1 && msg.split(" ")[1] !== "") {
                    const oldUsername = username;
                    username = msg.split(" ")[1];    
                    console.log('changed username of \"' + oldUsername + '\" to \"' + username + '\"'); 
                    socket.emit('set username', username);
                    users[users.findIndex((obj => obj.username == oldUsername))].username = username;
                    msg = "changed username...";
                    
                    io.emit('users update', users);  
                } else {
                    console.log('username \"' + msg.split(" ")[1] + '\" is already taken or blank...');
                    invalid = true;
                }                                        
            } else if(msg.split(" ")[0] == "/color") {
                //check to see if the input is a valid color
                const colorInput = msg.split(" ")[1];

                let valid = XRegExp('^[0-9A-F]{6}');
                console.log(colorInput);          
                if(valid.exec(colorInput) === null) {
                    // valid hex
                    users[users.findIndex((obj => obj.username == username))].color = "#" + msg.split(" ")[1];
                    msg = "changed color..."

                    io.emit('users update', users); 
                    console.log("valid input color, changing color for this user");
                } else {
                    // invalid hex
                    console.log("invalid input color, NOT changing color for this user");
                    invalid = true;
                }            
            }
            if(!invalid) {
                chatLog.push({
                    timeStamp: timeStamp,
                    user: users[users.findIndex((obj => obj.username == username))],
                    msg: msg
                });
                if(chatLog.length > chatLogSize) chatLog.shift(); // only display last 200 messages at most
                io.emit('chat message', chatLog);
            }            
        }
    });

    // handle user disconnections
    socket.on('disconnect', () => {
        //io.emit('disconnection message', { "timeStamp": timeStamp, "username": username, "msg": " disconnected..." });
        chatLog.push({
            timeStamp: timeStamp,
            user: users[users.findIndex((obj => obj.username == username))],
            msg: " disconnected..."
        });
        if(chatLog.length > chatLogSize) chatLog.shift(); // only display last 200 messages at most
        io.emit('chat message', chatLog);
        // change online status of the user
        users[users.findIndex((obj => obj.username == username))].online = false;
        io.emit('users update', users);
        console.log(username + ' disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});