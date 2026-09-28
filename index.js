const express = require('express')
const mongoose = require('mongoose')

const app = express()
const cors = require('cors')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  log: [
    {
      description: String,
      duration: Number,
      date: Date
    }
  ]
})

const User = mongoose.model('User', userSchema)


app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))

app.post('/api/users', async (req, res) => {
  try {
    const user = new User({
      username: req.body.username
    })

    const savedUser = await user.save()

    res.json({
      username: savedUser.username,
      _id: savedUser._id
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username')
  res.json(users)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const user = await User.findById(req.params._id)

    if (!user) {
      return res.json({ error: 'User not found' })
    }

    const exercise = {
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date ? new Date(req.body.date) : new Date()
    }

    user.log.push(exercise)
    await user.save()

    res.json({
      username: user.username,
      _id: user._id,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id)

  if (!user) {
    return res.json({ error: 'User not found' })
  }

  let log = user.log

  if (req.query.from) {
    const fromDate = new Date(req.query.from)
    log = log.filter(exercise => exercise.date >= fromDate)
  }

  if (req.query.to) {
    const toDate = new Date(req.query.to)
    toDate.setHours(23, 59, 59, 999)
    log = log.filter(exercise => exercise.date <= toDate)
  }

  if (req.query.limit) {
    log = log.slice(0, Number(req.query.limit))
  }

  log = log.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  }))

  res.json({
    username: user.username,
    _id: user._id,
    count: user.log.length,
    log: log
  })
})
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
