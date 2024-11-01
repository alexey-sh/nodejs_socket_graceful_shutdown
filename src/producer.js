const net = require('node:net');
const { once } = require('node:events');

const PORT = 8008;
const MSG_SIZE = 100;

function generateData(key, index) {
  const data = {key, data: []};
  for (let i = 0; i < MSG_SIZE + index; i++) {
    data.data.push((Math.random() * 100).toString().substring(0, 2));
  }
  const payload = Buffer.from(JSON.stringify(data));
  
  const header = Buffer.allocUnsafe(4);
  // 4294967295 max val
  header.writeUInt32LE(payload.byteLength);
  return Buffer.concat([header, payload]);
}
/**
 * @return Promise<Socket>
 * */
async function connect() {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ 
      host: 'localhost',
      port: PORT,
    }, () => {
      socket.setKeepAlive(true);
      socket.setTimeout(0);
      resolve(socket);
    });
    socket.once('error', (err) => {
      reject(err);
    });
    socket.setTimeout(1000, function() {
      socket.end();
      socket.destroy();
      reject(new Error('connect ETIMEDOUT'));
    });
  })
}
async function main() {
  const socket = await connect();
  console.log('connected');
  let lastStatus;
  for (let i = 0; i < 3; i++) {
    const data = generateData(i, i);
    console.log('send', data.byteLength);
    lastStatus = socket.write(data);
    console.log('status', lastStatus);
  }
  console.log('write end', lastStatus);

  if (!lastStatus) {
    await once(socket, 'drain');
    console.log('drain end');
  }
  socket.destroy();
  console.log('exit');
}

main().catch((e) => console.error('Main error', e));