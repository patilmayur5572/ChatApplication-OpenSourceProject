var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

mongoose.Promise = Promise

//Mongo URI for establishing connection with MLab
var dbUrl = 'mongodb://user:user@ds155424.mlab.com:55424/learning-node'

//Model to store messages in database
var Message = mongoose.model('Message', {
    name: String,
    message: String
})

//GET API for retriving all the messages from DB
app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
})

//GET API for retrieving user specific messages by name from DB
app.get('/messages/:user', (req, res) => {
    var user = req.params.user
    Message.find({name: user}, (err, messages) => {
        res.send(messages)
    })
})

//POST API to store message and return in case new message to client without Postback
app.post('/messages', async (req, res) => {

    try {
        var message = new Message(req.body)

        var savedMessage = await message.save()

        console.log('saved')

        var censored = await Message.findOne({ message: 'badword' })

        if (censored)
            await Message.remove({ _id: censored.id })
        else
            io.emit('message', req.body)

        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
        return console.error(error)
    } finally {
        console.log('message post called')
    }
})


//Socket IO connection
io.on('connection', (socket) => {
    console.log('a user connected')
})

//Database connection
mongoose.connect(dbUrl, { useMongoClient: true }, (err) => {
    console.log('mongo db connection', err)
})

//Server to listen requests and reply
var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})