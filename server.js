const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// Объект для хранения координат пользователей
const users = {};

let starX = Math.floor(Math.random() * 1100); // Генерируем случайное значение от 0 до 599
let starY = Math.floor(Math.random() * 600); // Генерируем случайное значение от 0 до 399

wss.on('connection', (ws) => {
  let userId;
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data && data.userId && data.userId.trim() !== '') {
        if (data.type === 'join') {
          if (!users[data.userId]) {
            userId = data.userId;
            // Пользователь не существует, добавляем его
            users[data.userId] = { x: data.px, y: data.py, color: generateRandomColor(), score: 0 };      
          } else {
            console.error('Ошибка: Пользователь с таким userId уже существует!');
            // Здесь можно вернуть ошибку или принять другие меры в зависимости от вашей логики
          }
        }
        if (data.type === 'updatePosition') {
          users[data.userId] = { x: data.px, y: data.py, color: users[data.userId].color, score: users[data.userId].score };
        }
        if (data.type === 'collectedStar') {
          starX = Math.floor(Math.random() * 550); // Генерируем случайное значение от 0 до 599
          starY = Math.floor(Math.random() * 350); // Генерируем случайное значение от 0 до 399
          users[data.userId].score = users[data.userId].score + 1;
        }

        // Отправляем координаты всех пользователей всем подключенным клиентам
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'usersCoordinates', users }));
            client.send(JSON.stringify({ type: 'starPosition', starX: starX, starY: starY }));
          }
        });
      }
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error);
    }
  });

  ws.on('close', () => {
    // По закрытию WebSocket соединения удаляем игрока
    if (userId && users[userId]) {
      delete users[userId];
      

      // Оповестите остальных клиентов о выходе игрока
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'playerExit', userId }));
        }
      });
    }
  });
});


// Настройка сервера HTTP на порту 8080
//server.on('request', (req, res) => {
//  res.writeHead(200, { 'Content-Type': 'text/plain' });
//  res.end('WebSocket сервер работает!');
//});



function generateRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

server.listen(8080, () => {
  console.log('Сервер слушает на порту 8080.');
});