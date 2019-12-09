const path = require('path')
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

// io.on("connection", socket => {
//   // socket.leave(socketId);
//   // socket.join(socketId);
//   //   socket.to(doc.id).emit("document", doc);
//   io.emit("logRefresh", []);
//   const sendNotification = counter => {
//     socket.emit("newLog", { message: 'Log no'+counter});
//     setTimeout(sendNotification,1000,counter+1);
//   };
//   sendNotification(1);
// });

const startServer = port => {
  // For front-end UI
  app.use('/ui', express.static(path.join('client/build')))

  app.get('*', (req, res) => {
    res.sendFile(process.cwd() + '/client/build/index.html')
  })

  http.listen(port)
  console.log('Socket Server started on port :' + port)
}

const broadcastLog = log => {
  io.emit('newLog', {
    logTime: new Date(),
    ...log
  })
}

module.exports = {
  startServer,
  broadcastLog
}