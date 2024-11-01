const net = require('node:net');
const EventEmitter = require('node:events');

const PORT = 8008;
let count = 0;
const headerSize = 4;

const events = new EventEmitter();

const server = net.createServer((socket) => {
  console.log('socket connected');

  let buffer = Buffer.alloc(0);
  let messageLength = 0;
  socket.on('data', (chunk) => {
    console.log('received data', messageLength, chunk.byteLength);

    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.byteLength) {
      if (!messageLength) {
        messageLength = buffer.readUInt32LE(0);
      }

      // Проверяем, что все сообщение получено
      if (buffer.byteLength >= headerSize + messageLength) {
        // Извлекаем само сообщение
        const message = buffer.subarray(headerSize, headerSize + messageLength);

        // Обрабатываем сообщение (в данном случае просто выводим его)
        events.emit('message', message);
        // Обрезаем буфер, удаляя обработанное сообщение
        buffer = buffer.subarray(headerSize + messageLength);
        messageLength = 0;
      } else {
        // Если сообщение не полностью получено, ждем следующих данных
        break;
      }
    }
  });
  
  socket.once('end', () => {
    console.log('socket disconnected', count);
    buffer = null;
  });

}).on('error', (err) => {
  console.error('Server error', err);
});

events.on('message', (message) => {
  const data = JSON.parse(message.toString());
  console.log(`message received (${count})`, data.key);
  count++;
});

server.listen(PORT, () => {
  console.log(`opened server on ${PORT}`);
});

