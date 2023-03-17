require('dotenv').config()

const assert = require('assert')
const express = require('express')
const cookieParser = require('cookie-parser')
const { SoundEditor, Project } = require('./sound-editor')
const path = require('path')
const PORT = process.env.PORT || 5163
const { Pool } = require('pg')
const CryptoJS = require('crypto-js')
const e = require('express')

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

const runGatherProjectsQuery = async function () {
  const sql = `SELECT * FROM project`
  const results = await query(sql)

  return results
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
            const user = await runFindUserQuery(cookie.username)
            const query = await runGatherProjectsQuery()
            let projects = []

            if (user.projects !== null) {
              projects = query.filter((e) => user.projects.indexOf(e.id) !== -1)
            }
            
            res.render('account', {
              username: user.username,
              projects: projects
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
    .get('/', function (_req, res) {
      res.render('index')
    })
    .get('/about', function (_req, res) {
      res.render('about')
    })
    .get('/sound-editor/:project', async function (req, res) {
      const cookie = req.cookies.signedInUser
      if (cookie === undefined) {
        res.render('login')
        return
      }
      // Make sure user owns this project and project id is valid
      const user = await runFindUserQuery(cookie.username)
    
      let projectId = Number.parseInt(req.params.project)
      if (!Number.isInteger(projectId) || (user.projects !== null && user.projects.indexOf(projectId) === -1)) {
        const projects = await runGatherProjectsQuery()
        projectId = projects.length + 1
      }
      res.render('sound-editor', {
        projectId: projectId
      })
    })
    .post('/sound-editor/load/:project', async function (req, res) {
      console.info(`Attempting to load project: ${req.params.project}`)

      const projectId = Number.parseInt(req.params.project)
      const projects = await runGatherProjectsQuery()
      const projectData = projects[projectId - 1]

      // Create new project object
      const project = new Project(projectId)

      // Initialize project with data
      if (projectData && JSON.parse(projectData.sound_data).length > 0) {
        console.info('Found project data. Initializing...')
        project.title = projectData.title

        const soundData = JSON.parse(projectData.sound_data)
        for (const layer of soundData) {
          const tlLayer = project.timeline.addLayer()
          tlLayer.color = layer.color
          tlLayer.name = layer.name
          
          for (const sample of layer.samples) {
            tlLayer.insertSample(sample)
          }
        }
      } else {
        // Add default layer to new projects
        project.timeline.addLayer()
      }

      const layers = sndEdit.project.timeline.layers
      const soundInfo = {}

      for (const layer of layers) {
        for (const sample of layer.samples) {
          const sound = await sndEdit.getSoundData(sample.soundId)
          soundInfo[sample.soundId] = sound.name
        }
      }

      sndEdit.project = project
      const result = {
        title: sndEdit.project.title,
        layers: layers,
        soundInfo: soundInfo
      }
      res.send(result)
    })
    .post('/sound-editor/save', async function (req, res) {
      console.info(`Attempting to save project: ${sndEdit.project.id}`)
      const result = {
        success: true
      }
      try {
        const client = await pool.connect()
        const projects = await runGatherProjectsQuery()
        
        // Insert if project is undefined
        if (!projects[sndEdit.project.id - 1]) {

          const cookie = req.cookies.signedInUser
          if (cookie === undefined) {
            res.render('login')
            return
          }
          // Get logged in user and set as owner
          const user = await runFindUserQuery(cookie.username)

          console.info('Adding data to database...')
          const sql = `INSERT INTO project (title, date_created, date_modified, sound_data, user_id)
            VALUES ($1, NOW(), NOW(), $2, $3);`
          const author = user.id
          await client.query(sql, [sndEdit.project.title, JSON.stringify(sndEdit.project.timeline.layers), author])

          let userProjects = []
          if (user.projects !== null) {
            userProjects = user.projects
          }

          userProjects.push(sndEdit.project.id)
          const userSql = `UPDATE user_account
            SET projects='{${userProjects}}'
            WHERE id='${user.id}';`
          await client.query(userSql)
        } else {
          console.info('Updating data...')
          const sql = `UPDATE project
            SET title = $1, date_modified = NOW(), sound_data = $2
            WHERE id='${sndEdit.project.id}';`
          await client.query(sql, [sndEdit.project.title, JSON.stringify(sndEdit.project.timeline.layers)])
        }
        
      } catch (err) {
        console.error(err)
        result.success = false
      }

      console.info('Finished!')
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
          const layer = sndEdit.project.timeline.addLayer()
          result['addedLayer'] = {
            name: layer.name,
            color: layer.color,
            id: sndEdit.project.timeline.numOfLayers - 1
          }
          break;

        case 'remove/:id':
          const id = Number.parseInt(req.params.action.split(':')[1])
          if (!Number.isInteger(id)) {
            console.warn('Layer id must be an integer value');
          }
          result['wasRemoved'] = sndEdit.project.timeline.removeLayer(id)
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
          sndEdit.project.timeline.getLayer(req.body.layerId).insertSample({
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
