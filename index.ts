import { app, server } from './game/app'
import { socketApi } from './game/socket-api'
import { labelsApi } from './labels/labels-api'
import cors from 'cors'
import {run_backup_cron} from './game/backup'
// run backup
run_backup_cron()

app.use(cors())

app.use(socketApi);
app.use(labelsApi);

app.get('/', (req, res) => {
  res.send({test: "ok"})
})

console.log('listen to port 80')

server.listen(80)
