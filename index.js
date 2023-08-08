import express from 'express'
import { socketApi } from './game/socket-api.js'
import { labelsApi } from './labels/labels-api.js'
import cors from 'cors'

const app = express()

app.use(cors())

app.use(socketApi);
app.use(labelsApi);

app.get('/', (req, res) => {
  res.send({test: "ok"})
})

app.listen(80)