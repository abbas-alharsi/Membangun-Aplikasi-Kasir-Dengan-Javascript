const electron = require('electron')
const db = require('./config/database/db_config')
const {app, BrowserWindow, ipcMain, screen, webContents, dialog} = electron
const remote = require('@electron/remote/main')
const fs = require('fs')
const path = require('path')
const url = require('url')
const md5 = require('md5')
remote.initialize()

let mainWindow
let productWindow
let editDataModal
let toPdf
let printPage
let cashierWindow
mainWin = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        height: 550,
        resizable: false,
        title: 'My Cashier 1.0',
        autoHideMenuBar: true
    })

    mainWindow.loadFile('index.html')
    db.serialize( () => {
        console.log('we did it')
    })
    
}

app.on('ready', () => {
    mainWin()
})

ipcMain.on('load:product-window', () => {
    productWin()
})

productWin = () => {

    const {width, height} = screen.getPrimaryDisplay().workAreaSize

    productWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        width: width,
        height: height,
        title: 'My Cashier | Data Produk'
    })
    
    remote.enable(productWindow.webContents)

    productWindow.loadFile('windows/product.html')
    productWindow.webContents.on('did-finish-load', () => {
        mainWindow.hide()
    })

    productWindow.on('close', () => {
        mainWindow.show()
    })
}

editData = (docId, modalForm, modalWidth, modalHeight, rowId) => {
    let parentWin
    switch (docId) {
        case 'product-data':
            parentWin = productWindow
            break;
    }
    editDataModal = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: modalWidth,
        height: modalHeight,
        resizable: false,
        maximizable: false,
        minimizable: false,
        parent: parentWin,
        modal: true,
        title: 'Edit Data',
        autoHideMenuBar: true
    })
    remote.enable(editDataModal.webContents)
    editDataModal.loadFile('modals/edit-data.html')
    editDataModal.webContents.on('did-finish-load', () => {
        editDataModal.webContents.send('res:form', docId, modalForm, rowId)
    })
    editDataModal.on('close', () => {
        editDataModal = null
    })
}

ipcMain.on('load:edit', (event, msgDocId, msgForm, msgWidth, msgHeight, msgRowId) => {
    editData(msgDocId, msgForm, msgWidth, msgHeight, msgRowId)
})

ipcMain.on('update:success', (e, msgDocId) => {
    switch(msgDocId) {
        case 'product-data':
            productWindow.webContents.send('update:success', 'Successfully updates product data')
    }
    editDataModal.close()
})

writeCsv = (path, content) => {
    fs.writeFile(path, content, err => {
        if(err) throw err
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'csv file created'
        })
    })
}

ipcMain.on('write:csv', (e, msgPath, msgContent) => {
    writeCsv(msgPath, msgContent)
})


loadToPdf = (param1, param2, file_path, docId = false, title) => {
    toPdf = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        show:false
    })

    let d = new Date()
    let day = d.getDate().toString().padStart(2,0)
    let month = d.getMonth().toString().padStart(2,0)
    let year = d.getFullYear()
    let today = `${day}/${month}/${year}`

    titleObject = {
        title: title,
        date: today
    }

    db.all(`select * from profil order by id asc limit 1`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            titleObject.storeName = 'My Store',
            titleObject.storeAddress = 'Address',
            titleObject.storeLogo = 'shop.png'
        } else {
            titleObject.storeName = row[0].store_name
            titleObject.storeAddress = row[0].store_address
            if(row[0].logo == null || row[0].logo == "") {
                titleObject.storeLogo = 'shop.png'
            } else {
                titleObject.storeLogo = row[0].logo
            }
        }
    })

    switch(docId) {
        case 'sales-report':
            toPdf.loadFile('export-pdf/sales-record-pdf.html');
            break;
        default :
            toPdf.loadFile('export-pdf/toPdf.html')
    }

    toPdf.webContents.on('dom-ready', () => {
        toPdf.webContents.send('load:table-to-pdf', param1, param2, titleObject, file_path)
    })



}

ipcMain.on('load:to-pdf', (e, msgThead, msgTbody, msgFilePath, msgDocId, msgTitle) => {
    loadToPdf(msgThead, msgTbody, msgFilePath, msgDocId, msgTitle)
})

ipcMain.on('create:pdf', (e, file_path) => {
    toPdf.webContents.printToPDF({
        marginsType: 0,
        printBackground: true,
        printSelectionOnly: false,
        landscape: true
    }).then( data => {
        fs.writeFile(file_path, data, err => {
            if(err) throw err
            toPdf.close()
            dialog.showMessageBoxSync({
                title: 'Alert',
                type: 'info',
                message: 'Successfully export data to PDF'
            })
        })
    }).catch( error => {
        console.log(error)
    })
})

loadPrintPage = (param1, param2, docId = false, title) => {
    printPage = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    
    let d = new Date()
    let day = d.getDate().toString().padStart(2,0)
    let month = d.getMonth().toString().padStart(2,0)
    let year = d.getFullYear()
    let today = `${day}/${month}/${year}`

    titleObject = {
        title: title,
        date: today
    }

    db.all(`select * from profil order by id asc limit 1`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            titleObject.storeName = 'My Store',
            titleObject.storeAddress = 'Address',
            titleObject.storeLogo = 'shop.png'
        } else {
            titleObject.storeName = row[0].store_name
            titleObject.storeAddress = row[0].store_address
            if(row[0].logo == null || row[0].logo == "") {
                titleObject.storeLogo = 'shop.png'
            } else {
                titleObject.storeLogo = row[0].logo
            }
        }
    })

    switch(docId) {
        case 'sales-report':
            printPage.loadFile('export-pdf/sales-record-pdf.html');
            break;
        default :
            printPage.loadFile('print.html')
    }

    printPage.webContents.on('dom-ready', () => {
        printPage.webContents.send('load:table-to-print', param1, param2, titleObject)
    })

}

ipcMain.on('load:print-page', (e, msgThead, msgTbody, msgDocId, msgTitle) => {
    loadPrintPage(msgThead, msgTbody, msgDocId, msgTitle)
    //console.log(msgThead, msgTbody, msgDocId, msgTitle)
})

ipcMain.on('print:page', () => {
    printPage.webContents.print({
        printBackground: true
    }, () => {
        printPage.close()
    })
    printPage.on('close', () => {
        printPage = null
    })
})

cashierWin = () => {
    cashierWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        width: 1200,
        height: 720,
        title: 'My Cashier App || Cashier'
    })

    cashierWindow.loadFile('windows/cashier.html')

    //cashierWindow.setFullScreen(true)
    remote.enable(cashierWindow.webContents)
    cashierWindow.webContents.on('did-finish-load', () => {
        mainWindow.hide()
    })

    cashierWindow.on('close', () => {
        mainWindow.show()
    })
}

ipcMain.on('load:cashier-window', () => {
    cashierWin()
})

ipcMain.on('close:cashier', () => {
    cashierWindow.close()
})