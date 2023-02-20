require('dotenv').config()

const assert = require('assert')
const express = require('express')
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

const main = function () {
  express()
    .use(express.static(path.join(__dirname, 'resources')))
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/health', async function (_req, res) {
      const sql = `SELECT id, username, registered_date
        FROM user_account
        LIMIT 1;`
      
      const testUser = await query(sql)

      let status = 200
      let msg = 'healthy'

      // Query failed
      if (testUser === undefined) {
        status = 500;
        msg = 'Failed to query for `TestUser`'
      }

      res.status(status).send(msg)
    })
    .get('/', function (_req, res) {
      res.render('index', { msg: 'Hello World' })
    })
    .get('/about', function (_req, res) {
      res.render('about')
    })
    .listen(PORT, () => console.log(`Listening on ${PORT}`))
}

main()
