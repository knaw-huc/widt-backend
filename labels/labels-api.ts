import express from 'express'
import { Sequelize, DataTypes } from 'sequelize'
import connection from './connection'
import { exec } from 'child_process'

const router = express.Router()
const port = 4445

router.use(express.urlencoded({ extended: true }));
router.use(express.json())

// const { DataTypes } = Sequelize;

const sequelize = new Sequelize(connection.database, process.env.MYSQL_USER, process.env.MYSQL_PASSWORD, {
  host: connection.host,
  // port: connection.port,
  dialect: 'mariadb'
});

const LABEL = sequelize.define('labels', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userid: { type: DataTypes.STRING },
  reactie: { type: DataTypes.TEXT },
  labels: { type: DataTypes.JSON },
  customlabels: { type: DataTypes.JSON }
});

LABEL.sync().catch(err => {
  console.warn('---\nCannot create table "labels".\n---')
})

router.all('/labels/pull', async (req, res, next) => {
  const command = "git pull"
  var child = exec(command, { cwd: "./../" })
  const alldata: Array<Object> = []
  child.stdout.on('data', function (data) {
    alldata.push(data)
  })
  child.stderr.on('data', function(data) {
    alldata.push('stderr: ' + data);
  });
  child.on('close', function (code) {
    res.send({alldata})
  })
  
})

router.all('/labels/*', async (req, res, next) => {
  res.header({
   "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": '*',
    "Access-Control-Expose-Headers": '*'
  })
  next()
})

// put
router.put('/labels/', async (req, res, next) => {
  // insert into database
  const result = await LABEL.create(req.body).catch(err => {
    res.status(500).send(err.message)
  })
  if (result) { res.send(result) }
})

// check
router.all('/labels/', async (req, res, next) => {
  res.send({ 'ok': 'thank you.' })
})

router.all('/labels/results', async (req, res, next) => {
  const all = await LABEL.findAll()
  res.send(all)
})

const labelsApi = router

export { labelsApi }