import cron from 'node-cron';
import "dotenv/config";
import fs from 'fs'
import * as dataApi from "./data-api";

export async function backup(force?: boolean){
  
  const { createClient } = await import("webdav")

  const client = createClient("https://surfdrive.surf.nl/files/public.php/webdav/",{username: process.env.SURFUSER,password: process.env.SURFPASS});
  
  trytoupload: try {
    console.log('——————— start upload ———————')
    const tempname = '/tmp/backup.json'
    const name = new Date().toLocaleString().replace(',', '').replace(/\//g, '-') + (process.env.LOCALDEV ? 'local' : '') + '.json';
    // get data
    const data = await dataApi.backup()
    if (!data) { throw Error('No data.') }
    // compare data
    const datastring = JSON.stringify(data)
    if (fs.existsSync(tempname)) {
      const olddatastring = fs.readFileSync(tempname, 'utf-8')
      if (datastring === olddatastring && !force) {
        console.log('—————— nothing changed ——————')
        break trytoupload
      }
    }
    
    // write to local backup
    fs.writeFileSync(`/backup/${name}`, datastring)
    // Upload the file to the WebDAV server
    console.log('Uploading data...')
    const ret = await client.putFileContents(name, datastring, { overwrite: false });
    if (ret) {
      // write data to temp file to check if it changed
      fs.writeFileSync(tempname, datastring)
      console.log('...upload succesfull!')
    } else {
      throw Error('Upload failed.')
    }
    
  } catch (error) {
    console.log('———— Error backing up.')
    console.log(error)
    console.log('————')
  }
}

function cronjob() {
  backup().then(x => {}).catch(console.warn)
}

export const run_backup_cron = () => {
  if (process.env.LOCALDEV) {
    backup()
    cron.schedule('* * * * *', cronjob)
  } else {
    // backup everyday at 10:00
    cron.schedule('0 10 * * *', cronjob)
  }
}