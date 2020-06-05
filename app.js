const express = require('express');
const app = express();

app.use(express.static('public'));

const http = require('http').Server(app);
let port = process.env.port || 3000;

const socketio = require('socket.io');
let io = socketio(http);

let pairs = [];

let onlineUsers = [];
let rooms = [];
let cmpRes = [];

let currentTime;

io.on('connection', socket => {
    console.log('connected');

    socket.on('disconnect', () => {
        let opponentId = null;

        pairs.forEach(item => {
            if (item.p1 === socket.id) {
                opponentId = item.p2;
            } else if (item.p2 === socket.id) {
                opponentId = item.p1;
            }
        });

        if (opponentId) {
            io.to(opponentId).emit('user-offline', 'Пользователь офлайн');
            pairs = pairs.filter(item => item.p1 !== opponentId && item.p2 !== opponentId);
        }
    });

    socket.on('new-user', (data) => {
        onlineUsers = getOnlineUsers(socket.id);
        if(onlineUsers.length == 0) {
            onlineUsers = 0;
        }
        io.emit('users-list', onlineUsers);
        io.to(socket.id).emit('id', socket.id);
    })

    socket.on('turn', data => {
        socket.broadcast.to(data.id).emit('turn', data);
    })

    socket.on('number', data => {
        socket.broadcast.to(data.id).emit('number', data.numbers);
    })

    socket.on('end', data => {
        socket.broadcast.to(data.id).emit('end', data.msg);
        pairs = pairs.filter(item => item.p1 !== data && item.p2 !== data);
    })

    socket.on('invite', pair => {
        onlineUsers = getOnlineUsers();
        let is = onlineUsers.includes(pair.p2);
        if(is){            
            socket.broadcast.to(pair.p2).emit('invitation', pair);
        }
        else{
            io.to(socket.id).emit('user-offline', 'Пользователь офлайн');
            if(onlineUsers.length == 0) {
                onlineUsers = 0;
            }
            io.to(socket.id).emit('users-list', onlineUsers);
        }
    })

    socket.on('canceled-invitation', op_id => {
        io.to(op_id).emit('canceled-invitation', null);
    })

    socket.on('confirmed-invitation', pair => {
        io.to(pair.p1).emit('start', pair);
        io.to(pair.p2).emit('start', pair);
        pairs.push(pair);
    })

    socket.on('close', id => {
        io.to(id).emit('close', 'Соперник покинул игру');
    })

    socket.on('new-participant', () => {
        let roomName = getRoomName();
        if(!roomName) {
            roomName = createRoomName();
            rooms.push({
                name: roomName,
                status: 'creating'
            });          
            setTimer(roomName, io);
            currentTime = 30;
        }
        socket.join(roomName);
        players = getPlayersList(roomName);
        io.to(socket.id).emit('set-timer', {time: currentTime-1, room: roomName});
        io.to(roomName).emit('players-list', players);
    })

    socket.on('leave-room', room => {
        socket.leave(room);
        players = getPlayersList(room);
        io.to(room).emit('players-list', players);
    })

    socket.on('end-cmp', room => {
        socket.to(room).emit('end-cmp', `You lost. ${socket.id} is winner!`);
    })

    socket.on('turns-count', data => {
        let prev = cmpRes.filter(c => c.room == data.room)[0];
        console.log('prev', prev);
        console.log('data', data);
        if(prev) {
            if(prev.count > data.count) {
                cmpRes.push({room: data.room, count: data.count, id: socket.id});
            }
        }
        else {
            cmpRes.push({room: data.room, count: data.count, id: socket.id});
        }
    })
})

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
})

http.listen(port, () => {
    console.log('listening on ' + port);
})

function getOnlineUsers(id) {
    let clients = io.sockets.clients().connected;
    let sockets = Object.values(clients);
    let users = sockets.map(s => s.id);
    users.remove(id);
    return users;
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function createRoomName() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

function getRoomName(){
    let free = rooms.filter(r => r.status === 'creating')[0];
    let res = free ? free.name : false;
    return res;
}

function setTimer(rName, socket) {
    let count = 30, timer = setInterval(function() {
        currentTime = count--;
        if(count == 1) {
            clearInterval(timer);
            let room = rooms.filter(r => r.name == rName)[0];
            if(room) {
                console.log('in room', room);
                let amount_players = getPlayersList(room.name);
                let _length = Object.keys(amount_players).length;
                console.log('amount',_length);
                if(_length > 1) {
                    console.log('playing');
                    room.status = 'playing';
                    socket.to(room.name).emit('start-competition', generateNumbers());
                    setTimeout(() => {
                        let players = getPlayersList(room.name);
                        console.log('players in game' ,players)
                        let res = cmpRes.filter(c => c.room == room.name)[0];
                        console.log(res);
                        if (res) {
                            delete players[res.id];
                            io.to(res.id).emit('end-cmp',' Вы выйграли!!!');
                            Object.entries(players).forEach(([key, value]) => {
                                io.to(key).emit('end-cmp', `Вы проиграли( Победитель угадал число за ${res.count} ходов`);
                            });
                        }    
                        else {
                            Object.entries(players).forEach(([key, value]) => {
                                io.to(key).emit('end-cmp', `Никто не угадал число(`);
                            });
                        }                                     
                        clearRoom(room.name, socket);                    
                    }, 60000);
                }
                else {
                    currentTime = 30;
                    io.to(room.name).emit('no-players', null);
                }
                
            }
            
            //
        }
    }, 1000);
}

function startGame() {
    console.log('startgame')
}

function getPlayersList(room) {
    let clients = io.sockets.adapter.rooms[room]; 
    if(clients) {
        clients = clients.sockets;
    }
    console.log('clients', clients);
    return clients;
}

function generateNumbers() {
    let arr = [];
    while(arr.length < 4){
        let r = Math.floor(Math.random() * 10);
        if(arr.indexOf(r) === -1) arr.push(r);
    }
    return arr;
}

function clearRoom(name, io) {
    console.log('clearing room');
    console.log(name);

    io.of('/').in(name).clients((error, socketIds) => {
        if (error) throw error;
      
        socketIds.forEach(socketId => io.sockets.sockets[socketId].leave('chat'));
      
    });

    console.log('finshed');
}