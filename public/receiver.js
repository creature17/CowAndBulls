let socket = io();
let timer;

socket.on('users-list', users => {
    if(users) {
        updateUsersList(users);
    }
    else {
        document.getElementById('online-users').textContent = 'Сейчас нет онлайн игроков.';
    }
})

socket.on('turn', data => {
    createLine(data.numbers, data.bc, 'statistic-user-op');
    makeTurn();
})

socket.on('number', numbers => {
    generatedNumbers = numbers;
    numberIsGot = true;
    if(numberIsSent){     
        console.log(generatedNumbers);
        document.getElementById('oponent-number').setAttribute('style', 'display:none');
        makeTurn();
        startGame('user');
    }
})

socket.on('end', msg => {
    alert(msg + generatedNumbers);
    clearGame('user');    
})

socket.on('canceled-invitation', () => {
    alert('Соперник отказался от игры');
})

socket.on('start', pair => {
    clearGame('user');
    document.getElementById('game-1by1').setAttribute('style','display:flex;')
})

socket.on('invitation', pair => {
    let q_start = confirm('Хотите сыграть 1 на 1 ?');
    if(q_start) {
        op_id = pair.p1;
        socket.emit('confirmed-invitation', pair);   
    }
    else{
        socket.emit('canceled-invitation', pair.p1);
    }
})

socket.on('user-offline', msg => {
    alert(msg);
})

socket.on('id', id => {
    my_id = id;
})

socket.on('close', msg => {
    alert(msg);
    clearGame('user');
})

socket.on('players-list', ids => {
    updatePlayersList(ids);
})

socket.on('set-timer', data => {
    document.getElementById('cmp-status').textContent = 'Собираем команду. Осталось ';
    let count = data.time;
    timer = setInterval(function() {
        document.getElementById('timer').textContent = count--;
        if(count == 0) clearInterval(timer);
    }, 1000);
    room = data.room;
})

socket.on('start-competition', number => {
    console.log('starting');
    clearInterval(timer);
    generatedNumbers = number;
    console.log(number);
    showElement('cmp-game');
    document.getElementById('cmp-status').textContent = 'До конца соревнований осталось ';
    let count = 60;
    timer = setInterval(function() {
        document.getElementById('timer').textContent = count--;
        if(count == 0) clearInterval(timer);
    }, 1000);
})

socket.on('end-cmp', msg => {
    alert(msg);
    clearGame('cmp');
    hideElement('cmp-game');
    document.location.href = "#home";
    clearInterval(timer);
    hideElement('cmp-home');
})

socket.on('no-players', () => {
    alert('Команда не собрана. Попробуйте позжe!');
    document.location.href = "#home";
    clearInterval(timer);
    hideElement('cmp-home');
})

