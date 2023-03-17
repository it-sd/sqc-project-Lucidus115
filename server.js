require('dotenv').config()

const assert = require('assert')
const express = require('express')
const cookieParser = require('cookie-parser')
const { SoundEditor, Timeline } = require('./sound-editor')
const path = require('path')
const PORT = process.env.PORT || 5163
const { Pool } = require('pg')
const CryptoJS = require('crypto-js')

const freesoundKey = process.env.FREESOUND_KEY
const sndEdit = new SoundEditor(freesoundKey)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const query = async function (sql) {
  assert.strictEqual(typeof sql, 'string',
    'Expected src to be a string')
  let client
  let results = []
  try {
    client = await pool.connect()
    const response = await client.query(sql)
    if (response && response.rows) {
      results = response.rows
    }
  } catch (err) {
    console.error(err)
  }
  if (client) client.release()
  return results
}

const runHealthQuery = async function () {
  const sql = `SELECT id, username, registered_date
  FROM user_account
  LIMIT 1;`

  const testUser = await query(sql)

  let status = 200
  let msg = 'healthy'

  // Query failed
  if (testUser === undefined) {
    status = 500
    msg = 'Failed to query for `TestUser`'
  }

  return { status, msg }
}

const runGatherUsersQuery = async function () {
  const sql = `SELECT id, username, registered_date, projects
  FROM user_account;`

  const results = await query(sql)

  let status = 200
  let msg = 'healthy'

  // Query failed
  if (results === undefined) {
    status = 500
    msg = 'Failed to query for all accounts'
  }

  return { status, msg, results }
}

const runFindUserQuery = async function (username) {
  const sql = `SELECT * FROM user_account
  WHERE username='${username}'
  LIMIT 1`

  const user = await query(sql)
  return user[0]
}

// Shamelessly stolen from teacher
const getServerUrl = function (req) {
  const port = PORT === 80 ? '' : `:${PORT}`
  return `${req.protocol}://${req.hostname}${port}`
}

const main = function () {  
  express()
    .use(cookieParser())
    .use(express.static(path.join(__dirname, 'resources')))
    .use(express.json())
    .use(function (req, res, next) {
      let origin = req.header('Origin')

      if (origin === undefined) {
        origin = '*'
      }

      res.header('Access-Control-Allow-Origin', origin)
      res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE')
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization')

      next()
    })
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/health', async function (_req, res) {
      const result = await runHealthQuery()
      res.status(result.status).send(result.msg)
    })
    .get('/account', async function (req, res) {
        // Check if logged in
        const cookie = req.cookies.signedInUser
        if (cookie !== undefined) {
            // const user = await runFindUserQuery(cookie.username)
            // const projects = 'todo'
            res.render('account', {
              username: cookie.username
            })
            return
        }
        res.render('login')
    })
    .get('/register', function (_req, res) {
      res.render('register')
    })
    .post('/register', async function (req, res) {
      const emptyOrUndefined = function(str) {
        return str === undefined || str === ''
      }
      const result = {
        success: false,
        msg: ''
      }

      if (emptyOrUndefined(req.body.username)) {
        result.msg += 'Username must not be empty<br>'
      }
      if (emptyOrUndefined(req.body.password)) {
        result.msg += 'Password must not be empty<br>'
      }
      if (req.body.password !== req.body.passwordConf) {
        result.msg += 'Passwords must match<br>'
      }

      const user = await runFindUserQuery(req.body.username)
      if (user !== undefined) {
        result.msg += 'This username was taken<br>'
      }
      // If there is an error message, we can safely assume success is false
      result.success = result.msg === ''

      if (result.success) {
        try {
          const client = await pool.connect()
          const password = CryptoJS.SHA256(req.body.password).toString()
  
          const sql = `INSERT INTO user_account (username, password, email, registered_date)
            VALUES ($1::VARCHAR(25), $2::TEXT, $3::VARCHAR(254), NOW());`
          await client.query(sql, [req.body.username, password, 'notareal@email.lol'])
        } catch (err) {
          console.error(err)
          result.success = false
        }
        
        // Log new user in
        const url = new URL('/login', getServerUrl(req))
        const resFetch = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            username: req.body.username,
            password: req.body.password
          }),
          headers: { 'Content-Type': 'application/json' }
        })
        const resultFetch = await resFetch.json()
        result.success = resultFetch.success
      }
      res.send(result)
    })
    .post('/login', async function (req, res) {
        const password = CryptoJS.SHA256(req.body.password).toString()
        const user = await runFindUserQuery(req.body.username)
        const success = user !== undefined && password === user.password

        if (success) {
          res.cookie('signedInUser', {
            username: req.body.username,
            password: password
          }, { maxAge: 99999999, httpOnly: true })
        }

        const result = {
          success: success
        }
        res.send(result)
    })
    .get('/', async function (_req, res) {
      res.render('index')
    })
    .get('/about', function (_req, res) {
      res.render('about')
    })
    .get('/sound-editor', function (req, res) {
      const cookie = req.cookies.signedInUser
      if (cookie === undefined) {
        res.render('login')
        return
      }
      res.render('sound-editor')
    })
    .post('/sound-editor/load/:project', function (req, res) {
      //TODO: Use project id to load from database
      sndEdit.timeline = new Timeline()
      const timeline = sndEdit.timeline
      const result = {
        layers: timeline.layers
      }

      res.send(result)
    })
    .post('/sound-editor/search', async function (req, res) {
      const text = req.body.textSearch

      // Search sounds with text
      const soundResults = await sndEdit.searchSounds(text)

      const result = {
        soundResults: soundResults
      }

      res.send(result)
    })
    .post('/sound-editor/layer/:action', function (req, res) {
      let result = {}
      switch (req.params.action) {
        case 'add':
          const layer = sndEdit.timeline.addLayer()
          result['addedLayer'] = {
            name: layer.name,
            color: layer.color,
            id: sndEdit.timeline.numOfLayers - 1
          }
          break;

        case 'remove/:id':
          const id = Number.parseInt(req.params.action.split(':')[1])
          if (!Number.isInteger(id)) {
            console.warn('Layer id must be an integer value');
          }
          result['wasRemoved'] = sndEdit.timeline.removeLayer(id)
          break;
      
        default:
          break;
      }

      res.send(result)
    })
    .post('/sound-editor/timeline/:action', async function (req, res) {
      let result = {}
      switch (req.params.action) {
        case 'addSample':
          const soundId = Number.parseInt(req.body.sampleId.split('-')[1])
          const data = await sndEdit.getSoundData(soundId)
          sndEdit.timeline.getLayer(req.body.layerId).insertSample({
            startTime: req.body.startTime,
            duration: data.duration * 1000, // Convert from seconds to milliseconds
            soundId: soundId
          })          

          result['duration'] = data.duration
          break;

        case 'retrieveSoundData':
          result['soundData'] = await sndEdit.retrieveSoundData()
      
        default:
          break;
      }

      res.send(result)
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`))
}

main()

module.exports = {
  query,
  runGatherUsersQuery,
  runHealthQuery,
  freesoundKey,
  main
}
