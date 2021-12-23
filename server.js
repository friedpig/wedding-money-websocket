const express = require('express');
const path = require('path');
const YAML = require('yaml');
const fs = require('fs');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());
const server = require('http').createServer(app);
const options = { path: '/ws' };
const io = require('socket.io')(server, options);
const redis = require('socket.io-redis');
const ConfigFilePath = path.join('./config_file/config.yaml');
const port = process.env.PORT || 5000;

const getConfig = () => {
  try {
    const configFile = fs.readFileSync(ConfigFilePath, 'utf-8');
    return YAML.parse(configFile);
  } catch (e) {
    throw new Error('Read config file error!');
  }
};

const CONFIG = getConfig();

io.adapter(
  redis({
    port: CONFIG.redis.port,
    host: CONFIG.redis.host,
    password: CONFIG.redis.password || '',
  })
);

const ws = io.of('ws');

ws.on('connection', (socket) => {
  socket.on('disconnecting', () => {});
});

app.post('/broadcast', function (req, res) {
  if (req.headers['secret-key'] === CONFIG.broadcast.secret_key) {
    ws.emit('broadcast', req.body);
    res.send({
      status: 'Ok',
      message: 'Success',
      data: null,
    });
  } else {
    res.status(403).send({
      status: 'Permission denied',
      message: 'Permission denied.',
      data: null,
    });
  }
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
