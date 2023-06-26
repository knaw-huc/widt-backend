import express from 'express'
import { router } from './game/socket-api.js'
import cors from 'cors'

const app = express()

app.use(cors())

app.use(router);

app.get('/', (req, res) => {
  res.send({test: "ok"})
})

app.listen(80)