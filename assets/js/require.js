const electron = require('electron')
const {ipcRenderer} = electron
const db = require('../config/database/db_config')
const {dialog} = require('@electron/remote')
let imask = require('imask')