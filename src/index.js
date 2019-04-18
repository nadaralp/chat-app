const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,generateLocationMessage } = require('./utils/messages')
const { addUser,getUser,getUsersInRoom, removeUser } = require('./utils/users')


const publicDirectoryPath = path.join(__dirname,'../public')



const app = express()
const server = http.createServer(app)
const io = socketio(server)



app.use(express.static(publicDirectoryPath))

app.get('/',(req,res) => {
    res.render('index')
})

io.on('connection', socket => {

   socket.on('join', ({username,room}, cb) => {
    const { error,user } = addUser({id:socket.id,username,room})

    if(error) return cb(error)

    socket.join(user.room)

    socket.emit('message', generateMessage(`Welcome ${user.username}`), 'Admin' )
    socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined the room`))

    io.to(user.room).emit('roomData', {
        room:user.room,
        users: getUsersInRoom(user.room)
    })

    cb()
   })
   
   socket.on('uMsg', (msg,cb) => {
    const user = getUser(socket.id)
    const filter = new Filter() 

    if(filter.isProfane(msg)) {
        return cb('Profanity is not allowed')
    } 

    io.to(user.room).emit('message',generateMessage(msg),user.username)
    cb()
   })

   socket.on('sendLocation', ({lat,long},cb) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('locationInfo',generateLocationMessage(`https://google.com/maps/?q=${lat},${long}`), user.username)
    cb('Location has been shared')
   })

   socket.on('disconnect', () => {
       const user = removeUser(socket.id)
      
       if(user) {
        io.to(user.room).emit('message', generateMessage(`${user.username} has left !`))

        io.to(user.room).emit('roomData', {
            room:user.room,
            users: getUsersInRoom(user.room)
        })
       }

   })
})

server.listen(process.env.PORT, () => {
    console.log(`App is running on port ${process.env.PORT}`)
})