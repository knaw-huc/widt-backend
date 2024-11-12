"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run_backup_cron = exports.backup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const dataApi = __importStar(require("./data-api"));
function backup(force) {
    return __awaiter(this, void 0, void 0, function* () {
        const { createClient } = yield import("webdav");
        const client = createClient("https://surfdrive.surf.nl/files/public.php/webdav/", { username: process.env.SURFUSER, password: process.env.SURFPASS });
        trytoupload: try {
            console.log('——————— start upload ———————');
            const tempname = '/tmp/backup.json';
            const name = new Date().toLocaleString().replace(',', '').replace(/\//g, '-') + (process.env.LOCALDEV ? 'local' : '') + '.json';
            // get data
            const data = yield dataApi.backup();
            if (!data) {
                throw Error('No data.');
            }
            // compare data
            const datastring = JSON.stringify(data);
            if (fs_1.default.existsSync(tempname)) {
                const olddatastring = fs_1.default.readFileSync(tempname, 'utf-8');
                if (datastring === olddatastring && !force) {
                    console.log('—————— nothing changed ——————');
                    break trytoupload;
                }
            }
            // upload data
            console.log('Uploading data...');
            // Upload the file to the WebDAV server
            const ret = yield client.putFileContents(name, datastring, { overwrite: false });
            if (ret) {
                // write data    
                fs_1.default.writeFileSync(tempname, datastring);
                console.log('...upload succesfull!');
            }
        }
        catch (error) {
            console.log('———— Error backing up.');
            console.log(error);
            console.log('————');
        }
    });
}
exports.backup = backup;
function cronjob() {
    backup().then(x => { }).catch(console.warn);
}
const run_backup_cron = () => {
    if (process.env.LOCALDEV) {
        backup();
        node_cron_1.default.schedule('* * * * *', cronjob);
    }
    else {
        // backup everyday at 10:00
        node_cron_1.default.schedule('0 10 * * *', cronjob);
    }
};
exports.run_backup_cron = run_backup_cron;
