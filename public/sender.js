let baseInputs = ['first-number','second-number','third-number','four-number'];
let generatedNumbers = [];
let numberIsGot = false;
let numberIsSent = false;
let op_id;
let my_id;
let room;

socket.emit('new-user', null); //

function sendNumber(gameType) {
    let numbers = readNumbers(gameType);    
    if(numbersAreValid(numbers)){
        let res = compareNumbers(numbers, generatedNumbers);
        if(res.bulls === 4){
            gotWinner(gameType);
        }
        else{   
            continueGame(gameType, numbers, res);                   
        }        
    }
}

function readNumbers(gameType) {
    let numbersToCheck = [];
    baseInputs.forEach(i => {
        i = i + '-' + gameType;
        let val = document.getElementById(i).value;
        numbersToCheck.push(val);
    })
    return numbersToCheck;
}

function numbersAreValid(numbers) {
    let bool = true ;
    numbers.forEach(n => {
        if (n === ""){
            bool =false;
        }
    })
    if(bool){
        let unique = new Set(numbers);
        if(unique.size != numbers.length){
            bool = false;
            alert('Числа не должны повторяться!');
        }
    }
    return bool;
}

function compareNumbers( arr1, arr2) {
    let cmp = {
        bulls:0,
        cows:0
    };
    arr1.forEach(n => {
        for(let i = 0; i < 4; i++ ) {
            if(n == arr2[i]) {
                if(arr1.indexOf(n) == i){
                    cmp.bulls += 1;
                }
                else {
                   cmp.cows += 1;
                }
            }
        }
    })
    return cmp;
}

function gotWinner(gameType) {    
    alert('Вы угадали число!');
    switch(gameType) {
        case('user'): {
            let data = {
                msg: `Вы проиграли! Ваше число `,
                id: op_id
            }
            socket.emit('end', data);
            break;
        }
        case('cmp'): {
            hideElement('cmp-game');
            countTurns();
        }
        default:
            break;
    }
    clearGame(gameType);
}

function clearGame(gameType) {
    clearInputs(gameType);
    clearElement('statistic-user');
    clearElement('statistic-user-op');
    clearElement('statistic-cpu');
    clearElement('statistic-cmp');
    if(gameType === 'user') {   
        document.getElementById('what-to-do').textContent = 'Загадайте число сопернику';
        hideElement('boards');
        showElement('oponent-number');
        hideElement('game-1by1');
        clearInputs('gnrt');
        reloadUsersOnline();
    }
    resetGlobalVariables();
}

function resetGlobalVariables() {
    generatedNumbers = [];
    numberIsGot = false;
    numberIsSent = false;
    op_id;
    my_id;
}

function continueGame(gameType, numbers, res) {    
    switch(gameType) {
        case('user'):{
            let turn = {
                numbers: numbers,
                bc: res,
                id:op_id
            };
            if (socket.connected) {
                socket.emit('turn', turn);
            } else {
                console.log('no internet');
            }
            waitForTurn();
            break;
        }
        default:
            break;
    }
    createLine(numbers, res, 'statistic-' + gameType);
    clearInputs(gameType);            
    setFocus('first-number-' + gameType);
}

function pickNumber() {
    let numbers = readNumbers('gnrt');
    if (numbersAreValid(numbers)) {
        let data = {
            numbers:numbers,
            id: op_id
        }
        socket.emit('number', data);
        numberIsSent = true;
        hideElement('oponent-number');
        if(numberIsGot) {
            console.log(generatedNumbers);
            waitForTurn();
            startGame('user');
        }
        else {
            document.getElementById('what-to-do').textContent = 'Ваш соперник загадывает число ...';
        }
    }
}

function chooseOponent(id) {
    let pair ={
        p1: my_id,
        p2: id
    }
    socket.emit('invite', pair);
    op_id = id;
}

function startGame(gameType) {
    switch(gameType) {
        case('cpu'): {
            generatedNumbers = generateNumbers();
            break;
        }
        case('user'): {
            showElement('boards');
            break;
        }
        default:
            break;
    }
    setFocus('first-number-' + gameType);
}

function reloadUsersOnline() {
    socket.emit('new-user', null);
}

function joinCompetition() {
    socket.emit('new-participant', null);
    document.getElementById('cmp-home').setAttribute('style', 'display:flex; z-index:100;');
}

function leaveRoom() {
    socket.emit('leave-room', room);
    clearInterval(timer);
    document.getElementById('timer').textContent = '';
    hideElement('cmp-home');
}

function countTurns() {
    let count = document.getElementById('statistic-cmp').childElementCount;
    console.log(count);
    socket.emit('turns-count', {count, room});
}

// function laeveWeb() {
//     alert('no connection');
//     console.log('no connection');
//     clearGame('user');
//     location.reload('index.html');
// }
  
//   // Update the online status icon based on connectivity
// //   window.addEventListener('online',  updateIndicator);
//   window.addEventListener('offline', laeveWeb);
