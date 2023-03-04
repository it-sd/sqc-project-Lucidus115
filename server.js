require('dotenv').config()

const assert = require('assert')
const express = require('express')
const freesound = require('freesound')
const path = require('path')
const PORT = process.env.PORT || 5163
const { Pool } = require('pg')

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

const main = function () {
  freesound.setToken(process.env.FREESOUND_KEY)

  express()
    .use(express.static(path.join(__dirname, 'resources')))
    .use(express.json())
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/health', async function (_req, res) {
      const result = await runHealthQuery()
      res.status(result.status).send(result.msg)
    })
    .get('/', async function (_req, res) {
      const result = await runGatherUsersQuery()

      res.render('index', { accounts: result.results })
    })
    .get('/about', function (_req, res) {
      res.render('about')
    })
    .get('/audio-new', function (_req, res) {
      res.render('audio-new')
    })
    .post('/audio-search', async function (req, res) {
      const id = req.body.soundId

      let snd

      // Find sound from requested id
      freesound.getSound(id, function (sound) {
        snd = sound.previews['preview-hq-mp3']
      })

      if (snd === undefined) {
        console.warn(`Aieeee, sound with id ${id} does not exist`)
      }
      res.send({ sound: snd })
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`))
}

main()

module.exports = {
  query,
  runGatherUsersQuery,
  runHealthQuery,
  main
}
