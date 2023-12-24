const player = document.getElementById("player1");
const star = document.getElementById("star");

const userList = document.getElementById('userList');

const playerSpeed = 5;
const starRadius = 15;
const gameWidth = 1200;
const gameHeight = 700;

let playerX = Math.floor(Math.random() * 1100);
let playerY = Math.floor(Math.random() * 650);

let starX = 1000;
let starY = 1000;

const playerElements = {}; // Объект для хранения элементов игроков
const socket = new WebSocket('ws://localhost:8080');

let playerId = "";

function startGame() {
  playerId = document.getElementById("playerNameInput").value;

    if (playerId.trim() !== "") {
        // Скрыть меню и показать игру
        document.getElementById("menu").style.display = "block";
        document.getElementById("game").style.display = "block";
        document.getElementById("auth").style.display = "none";

        // Отправить информацию о подключении игрока
        sendCoordinates("join");
    } else {
        alert("Введите ваше имя перед началом игры!");
    }
}


socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    
    if (data.type === 'playerExit') {
      const exitedUserId = data.userId;
      
      removePlayerElement(exitedUserId);
    }
    
    if (data.type === 'usersCoordinates') {
      // Обрабатываем координаты пользователей
      const users = data.users;

      userList.innerHTML = ''; // Очищаем список перед обновлением
      for (const userId in users) {
        if (userId !== playerId) {
          // Создаем элементы игроков, если их еще нет
          if (!playerElements[userId]) {
            createPlayerElement(userId, users[userId]);
          }
          // Обновляем элементы игроков
          updatePlayerElement(userId, users[userId]);
        }
        createUserListItem(userId, users[userId]);
      }
    }

    if (data.type === 'starPosition') {
      updateStarPosition(data.starX, data.starY)
    }
    
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
  }
}

function sendCoordinates(inputType) {
  const message = {
    type: inputType,
    userId: playerId,
    px: playerX,
    py: playerY,
  };
  socket.send(JSON.stringify(message));
  player.style.left = playerX + "px";
  player.style.top = playerY + "px";
}

function collectStar()
{
  const message = {
    type: 'collectedStar',
    userId: playerId
  };
  socket.send(JSON.stringify(message));
}

function checkCollision() {
  const distance = Math.sqrt(
    (playerX - starX) ** 2 + (playerY - starY) ** 2
  );
  
  if (distance < starRadius) {
    collectStar();
  }
}

document.addEventListener("keydown", (event) => {
  if (playerId != '') {
    if (event.key === "ArrowLeft" && playerX > 0) {
      playerX -= playerSpeed;
    } else if (event.key === "ArrowRight" && playerX < gameWidth - 20) {
      playerX += playerSpeed;
    } else if (event.key === "ArrowUp" && playerY > 0) {
      playerY -= playerSpeed;
    } else if (event.key === "ArrowDown" && playerY < gameHeight - 20) {
      playerY += playerSpeed;
    }
    sendCoordinates('updatePosition');
    checkCollision();
  }
  
});


// Функция для создания элемента игрока
function createPlayerElement(playerId, playerData) {
  const playerElement = document.createElement('div');
  playerElement.className = 'player';
  playerElement.id = playerId;
  playerElement.style.backgroundColor = playerData.color;

  const playerNameElement = document.createElement('div');
  playerNameElement.className = 'player-name';
  playerNameElement.textContent = playerId;
  playerNameElement.style.color = playerData.color;
  console.log(playerData.color);

  document.getElementById('game').appendChild(playerElement);
  document.getElementById('game').appendChild(playerNameElement);

  playerElements[playerId] = { playerElement, playerNameElement };
  updatePlayerElement(playerId, playerData);
}

// Функция для обновления элемента игрока
function updatePlayerElement(playerId, playerData) {
  const { playerElement, playerNameElement } = playerElements[playerId];
  if (playerElement && playerNameElement) {
    playerElement.style.left = playerData.x + 'px';
    playerElement.style.top = playerData.y + 'px';

    const playerNameOffsetX = 0;
    const playerNameOffsetY = -15;

    playerNameElement.style.left = playerData.x + playerNameOffsetX + 'px';
    playerNameElement.style.top = playerData.y + playerNameOffsetY + 'px';
  }
}

//Функция обновления звездочки
function updateStarPosition(sX, sY) {
  starX = sX;
  starY = sY;
  star.style.left = starX + "px";
  star.style.top = starY + "px";
} 

function createUserListItem(playerId, playerData) {
  const userItem = document.createElement('li');
  userItem.className = 'user-item';
  userItem.innerHTML = `<span>${playerId}</span>: ${playerData.score}`;
  userList.appendChild(userItem);
}

function removePlayerElement(playerId) {
  const { playerElement, playerNameElement } = playerElements[playerId];

  if (playerElement && playerNameElement) {
    playerElement.remove(); // Удаление элемента игрока из DOM
    playerNameElement.remove(); // Удаление элемента с именем игрока из DOM

    delete playerElements[playerId]; // Удаление из объекта playerElements
  }
}

