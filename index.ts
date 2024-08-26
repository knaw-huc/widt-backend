import { app, server } from './game/app'
import { socketApi } from './game/socket-api'
import { labelsApi } from './labels/labels-api'
import cors from 'cors'

app.use(cors())

app.use(socketApi);
app.use(labelsApi);

app.get('/', (req, res) => {
  res.send({test: "ok"})
})

server.listen(80)