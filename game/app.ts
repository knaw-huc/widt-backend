import express from 'express'
export const app = express()
export const server = require('http').createServer(app);
