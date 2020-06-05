function setFocus(id){
    document.getElementById(id).focus();
}

function changeNumber(e, id){
    if (e.keyCode !==13) {
        let element = document.getElementById(id);
        let number = element.value[element.value.length];
        if(!number) {
            element.value = number;
        }        
    }
}

function showElement(id) {
    document.getElementById(id).setAttribute('style','display: flex');
}

function clearInputs(gameType){
    baseInputs.forEach(i => {
        i = i + '-' + gameType;
        document.getElementById(i).value = '';
    })
}

function clearElement(id) {
    document.getElementById(id).innerHTML = '';
}

function hideElement(id) {
    document.getElementById(id).setAttribute('style', 'display: none');
}

function createLine(numbers, data, id) {
    let statistic = document.getElementById(id);

    let line = document.createElement('div');
    line.setAttribute('class', 'info-line');

    numbers.forEach(n => {
        let item = document.createElement('span');
        item.textContent = n;
        item.setAttribute('class','info-item');
        line.append(item);
    })
    
    let item = document.createElement('span');
    item.textContent = data.bulls;
    item.setAttribute('class','info-item-bulls');
    line.append(item);

    item = document.createElement('span');
    item.textContent = data.cows;
    item.setAttribute('class','info-item-cows');
    line.append(item);

    statistic.append(line);

    let objDiv = document.getElementById(id);
    objDiv.scrollTop = objDiv.scrollHeight;
}

function messageToWinner() {
    alert('Вы угадали число!');
}

function updateUsersList(users) {
    let list = document.getElementById('online-users');
    list.innerHTML = '';
    Object.entries(users).forEach(([key, value]) => {
        let user = document.createElement('li');
        user.textContent = value;
        user.setAttribute('id', value);
        user.setAttribute('onclick', `chooseOponent(this.id)`);
        user.setAttribute('title', 'Пригласить')
        list.append(user);        
    });
}

function waitForTurn() {
    document.getElementById('what-to-do').textContent = 'Соперник делает ход ... ';
    document.getElementById('make-turn').disabled = true;    
}

function makeTurn() {
    document.getElementById('what-to-do').textContent = 'Ваш ход ...';
    document.getElementById('make-turn').disabled = false;   
}

function generateNumbers() {
    let arr = [];
    while(arr.length < 4){
        let r = Math.floor(Math.random() * 10);
        if(arr.indexOf(r) === -1) arr.push(r);
    }
    return arr;
}

function startGame(gameType) {
    switch(gameType) {
        case('user'): {
            showElement('boards');
            setFocus('first-number-' + gameType);
            break;
        }
        case('cpu'): {
            generatedNumbers = generateNumbers();
            break;
        }
    }
}

function goHome() {
    ['user', 'cpu'].forEach(g => {
        clearGame(g);
    })
}

function updatePlayersList(players) {
    let list = document.getElementById('players');
    list.innerHTML = '';

    let user = document.createElement('li');
    user.textContent = 'Участники';
    user.setAttribute('class', 'title-players');
    list.append(user);  

    Object.entries(players).forEach(([key, value]) => {
        user = document.createElement('li');
        user.textContent = key;
        user.setAttribute('id', key);
        list.append(user);        
    });
}

// window.addEventListener('offline',() => {
//     console.log('nav', navigator.onLine);
//     if (!navigator.onLine) alert('Соединение отсутствует!');
// });

// window.addEventListener('online',() => window.location.reload());

window.addEventListener("offline", () => {
    console.log('inside');
    if (!navigator.onLine) alert('Соединение отсутствует!');
})