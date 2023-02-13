require('dotenv').config()
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163

express()
  .use(express.static(path.join(__dirname, 'resources')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/health', function (req, res) {
    res.status(200).send("healthy");
  })
  .get('/', function (_req, res) {
    res.render('index', { msg: "Hello World" })
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))