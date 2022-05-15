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
let salesModal
let salesNum
let printSalesPage
let buyerModal
ipcMain.on('sales-number', (e, msgSalesNumber) => {
    salesNum = msgSalesNumber
})
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

modalSales = (salesNumber, title, totalSales, buyerInfo) => {
    let width
    let height
    let frameBoolVal
    let titleBar
    let content
    let buyerAddress = buyerInfo
    let tr = ''
    switch(title) {
        case 'discount-final' :
            width = 620
            height = 350
            frameBoolVal = true
            titleBar = 'Potongan Final'
            db.all(`select sum(total) as total from sales where invoice_number = '${salesNumber}'`, (err, row) => {
                if(err) throw err
                if(row.length < 1) {
                    console.log(`no sales with number '${salesNumber}'`)
                } else {
                    let total_sales = row[0].total
                    db.all(`select * from discount_final where invoice_number = '${salesNumber}'`, (err, row) => {
                        if(err) throw err
                        if(row.length < 1) {
                            content = `<div class="mb-2">
                                            <small>* Silahkan beri diskon sesuai dengan jenis yang diinginkan (% atau tunai (Rp) atau kedua-duanya)</small><br>
                                            <small>* Masukkan persentase potongan tanpa diikuti tanda % dan jumlah potongan tanpa diikuti tanda Rp</small><br>
                                        </div>
                                        <div class="mb-2">
                                            <div class="mb-2">
                                                <label>Potongan (%)</label>
                                                <input type="hidden" id="total-sales" value="${total_sales}">
                                                <input type="hidden" class="invoice-number" id="invoice-number" value="${salesNumber}">
                                                <input type="hidden" id="total-discount-final">
                                                <input type="text" class="form-control form-control-sm" onkeyup="newDiscountFinal()" id="discount-final-percent">
                                            </div>
                                            <div class="mb-2">
                                            <label>Potongan Tunai (Rp)</label>
                                            <input type="text" class="form-control form-control-sm" onkeyup="newDiscountFinal()" id="discount-final-money">
                                            </div>
                                        </div>`
                        } else {
                            content = `<div class="mb-2">
                                            <small>* Silahkan beri diskon sesuai dengan jenis yang diinginkan (% atau tunai (Rp) atau kedua-duanya)</small><br>
                                            <small>* Masukkan persentase potongan tanpa diikuti tanda % dan jumlah potongan tanpa diikuti tanda Rp</small><br>
                                        </div>
                                        <div class="mb-2">
                                            <div class="mb-2">
                                                <label>Potongan (%)</label>
                                                <input type="hidden" id="total-sales" value="${total_sales}">
                                                <input type="hidden" class="invoice-number" id="invoice-number" value="${row[0].invoice_number}" data-id="${row[0].id}">
                                                <input type="hidden" id="total-discount-final" value="${row[0].total_discount_final}">
                                                <input type="text" class="form-control form-control-sm" onkeyup="newDiscountFinal()" id="discount-final-percent" value="${row[0].discount_percent}">
                                            </div>
                                            <div class="mb-2">
                                            <label>Potongan Tunai (Rp)</label>
                                            <input type="text" class="form-control form-control-sm" onkeyup="newDiscountFinal()" id="discount-final-money" value="${row[0].discount_money}">
                                            </div>
                                        </div>`
                        }
                    })
                }
            })
            //content = `<h1>${titleBar}</h1>`
            break;
        case 'discount' :
            width = 800
            height = 400
            frameBoolVal = true
            titleBar = 'Potongan Produk'
            db.all(`select * from sales where invoice_number = '${salesNumber}'`, (err, rows) => {
                if(err) throw err
                if(rows.length < 1) {
                    console.log(`no sales with number '${salesNumber}'`)
                } else {
                    rows.map( (row) => {
                        tr+=`<tr>
                                <td>
                                    <input type="text" class="form-control form-control-sm disable input-product-name" id="input-product-name-${row.id}" value="${row.product_name}" disabled>
                                    <input type="hidden" class="input-input-date" id="input-input-date-${row.id}" value="${row.input_date}" data-id="${row.id}">
                                    <input type="hidden" class="input-invoice-number" id="input-invoice-number-${row.id}" value="${row.invoice_number}" data-id="${row.id}">
                                    <input type="hidden" class="input-buyer" id="input-buyer-${row.id}" value="${row.buyer}" data-id="${row.id}">
                                    <input type="hidden" class="input-buyer-id" id="input-buyer-id-${row.id}" value="${row.buyer_id}" data-id="${row.id}">
                                    <input type="hidden" class="input-payment" id="input-payment-${row.id}" value="${row.payment}" data-id="${row.id}">
                                    <input type="hidden" class="input-description" id="input-description-${row.id}" value="${row.description}" data-id="${row.id}">
                                    <input type="hidden" class="input-po-number" id="input-po-number-${row.id}" value="${row.po_number}" data-id="${row.id}">
                                    <input type="hidden" class="input-due-date" id="input-due-date-${row.id}" value="${row.due_date}" data-id="${row.id}">
                                    <input type="hidden" class="input-term" id="input-term-${row.id}" value="${row.term}" data-id="${row.id}">
                                    <input type="hidden" class="input-sales-admin" id="input-sales-admin-${row.id}" value="${row.sales_admin}" data-id="${row.id}">
                                    <input type="hidden" class="input-cost-of-product" id="input-cost-of-product-${row.id}" value="${row.cost_of_product}" data-id="${row.id}">
                                    <input type="hidden" class="input-total" id="input-total-${row.id}" value="${row.total}" data-id="${row.id}">
                                    <input type="hidden" class="input-prd-price" id="input-prd-price-${row.id}" value="${row.price}" data-id="${row.id}">
                                    <input type="hidden" class="input-qty" id="input-qty-${row.id}" value="${row.qty}" data-id="${row.id}">
                                    <input type="hidden" class="input-unit" id="input-unit-${row.id}" value="${row.unit}" data-id="${row.id}">
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm disable input-product-code" id="input-product-code-${row.id}" value="${row.product_code}" disabled>    
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm input-discount-percent" onkeyup="newTotal(${row.id})" value="${row.discount_percent}" id="input-discount-percent-${row.id}">
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm input-discount-money" onkeyup="newTotal(${row.id})" value="${row.discount_money}" id="input-discount-money-${row.id}">
                                </td>
                            </tr>`
                    })
                    content = `<div class="mb-2">
                                    <small>* Silahkan beri diskon sesuai dengan jenis yang diinginkan (% atau tunai (Rp) atau kedua-duanya)</small><br>
                                    <small>* Masukkan persentase potongan tanpa diikuti tanda % dan jumlah potongan tanpa diikuti tanda Rp</small><br>
                                </div>
                                <div class="table-responsive">
                                    <table class="table table-sm table-borderless" style="font-size:13px;">
                                        <thead class="thead-light">
                                            <tr>
                                                <th>Nama Produk</th>
                                                <th>Kode Produk</th>
                                                <th>Potongan (%)</th>
                                                <th>Potongan (Rp)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${tr}
                                        </tbody>
                                    </table>    
                                </div>`
                }
            })
            //content = `<h1>${titleBar}</h1>`
            break;
        case 'qty' :
            width = 700
            height = 400
            frameBoolVal = true
            titleBar = 'Edit Qty'
            db.all(`select * from sales where invoice_number = '${salesNumber}'`, (err, rows) => {
                if(err) throw err
                if(rows.length < 1) {
                    console.log(`no sales with number '${salesNumber}'`)
                } else {
                    rows.map( (row) => {
                        tr+=`<tr>
                                <td>
                                    <input type="text" class="form-control form-control-sm disable input-product-name" id="input-product-name-${row.id}" value="${row.product_name}" disabled>
                                    <input type="hidden" class="input-input-date" id="input-input-date-${row.id}" value="${row.input_date}" data-id="${row.id}">
                                    <input type="hidden" class="input-invoice-number" id="input-invoice-number-${row.id}" value="${row.invoice_number}" data-id="${row.id}">
                                    <input type="hidden" class="input-buyer" id="input-buyer-${row.id}" value="${row.buyer}" data-id="${row.id}">
                                    <input type="hidden" class="input-buyer-id" id="input-buyer-id-${row.id}" value="${row.buyer_id}" data-id="${row.id}">
                                    <input type="hidden" class="input-payment" id="input-payment-${row.id}" value="${row.payment}" data-id="${row.id}">
                                    <input type="hidden" class="input-description" id="input-description-${row.id}" value="${row.description}" data-id="${row.id}">
                                    <input type="hidden" class="input-po-number" id="input-po-number-${row.id}" value="${row.po_number}" data-id="${row.id}">
                                    <input type="hidden" class="input-due-date" id="input-due-date-${row.id}" value="${row.due_date}" data-id="${row.id}">
                                    <input type="hidden" class="input-term" id="input-term-${row.id}" value="${row.term}" data-id="${row.id}">
                                    <input type="hidden" class="input-sales-admin" id="input-sales-admin-${row.id}" value="${row.sales_admin}" data-id="${row.id}">
                                    <input type="hidden" class="input-cost-of-product" id="input-cost-of-product-${row.id}" value="${row.cost_of_product}" data-id="${row.id}">
                                    <input type="hidden" class="input-total" id="input-total-${row.id}" value="${row.total}" data-id="${row.id}">
                                    <input type="hidden" class="input-prd-price" id="input-prd-price-${row.id}" value="${row.price}" data-id="${row.id}">
                                    <input type="hidden" class="input-unit" id="input-unit-${row.id}" value="${row.unit}" data-id="${row.id}">
                                    <input type="hidden" class="input-discount-percent" id="input-discount-percent-${row.id}" value="${row.discount_percent}" data-id="${row.id}">
                                    <input type="hidden" class="input-discount-money" id="input-discount-money-${row.id}" value="${row.discount_money}" data-id="${row.id}">
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm disable input-product-code" id="input-product-code-${row.id}" value="${row.product_code}" disabled>    
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm input-qty" onkeyup="newTotal(${row.id})" value="${row.qty}" id="input-qty-${row.id}" data-id="${row.id}">
                                </td>
                                <td>
                                    <input type="text" class="form-control form-control-sm disable" id="input-unit-${row.id}" value="${row.unit}" disabled>
                                </td>
                            </tr>`
                    })
                    content = `<div class="table-responsive">
                                    <table class="table table-sm table-borderless" style="font-size:13px;">
                                        <thead class="thead-light">
                                            <tr>
                                                <th>Nama Produk</th>
                                                <th>Kode Produk</th>
                                                <th>Qty</th>
                                                <th>Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${tr}
                                        </tbody>
                                    </table>    
                                </div>`
                }
            })
            //content = `<h1>${titleBar}</h1>`
            break;
        case 'checkout' :
            width = 400
            height = 400
            frameBoolVal = true
            titleBar = 'checkout'
            content = `<div class="table-responsive">
                            <table class="table table-borderless mb-5">
                                <tbody>
                                    <tr>
                                        <td>Total Belanja</td>
                                        <td><input type="text" id="total-sales" style="text-align:right;font-size:20px;" class="form-control" disabled value="${totalSales}"></td>
                                    </tr>
                                    <tr>
                                        <td>Total Diterima</td>
                                        <td><input type="text" id="total-received" style="text-align:right;font-size:20px;" class="form-control" onkeyup="cashReturn()" autofocus></td>
                                    </tr>
                                </tbody>
                            </table>
                            <table class="table table-borderless">
                                <tbody>
                                    <tr style="background-color:red;color:white">
                                        <td><span style="font-size:18px;">Kembali</span></td>
                                        <td><input type="hidden" id="total-returned" value="0"><span class="float-end" id="info-total-returned" style="font-size:20px;font-weight:bold">0</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>`
                break;
            //content = `<h1>${titleBar}</h1>`
    }

    salesModal = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true,
            width: width,
            height: height,
            parent: cashierWindow,
            modal: true,
            resizable: false,
            minimizable: false,
            frame: frameBoolVal,
            title: titleBar
        }
    )
    remote.enable(salesModal.webContents)
    salesModal.loadFile('modals/sales-modal.html')
    salesModal.webContents.on('dom-ready', () => {
        salesModal.webContents.send('load:tbody-tr', content, title, buyerAddress)
    })
}

ipcMain.on('load:sales-modal', (e, msgSalesNumber, msgTitle, msgTotalSales, msgBuyerInfo) => {
    modalSales(msgSalesNumber, msgTitle, msgTotalSales, msgBuyerInfo)
})

ipcMain.on('update-success:sales-edit', () => {
    salesModal.close()
    cashierWindow.webContents.send('update-success:sales-edit')
})

ipcMain.on('print:sales', (e, msgTotalSales, msgTotalReceived, msgTotalReturned, msgBuyerInfo, msgDocId) => {
    printSales(salesNum, msgTotalSales, msgTotalReceived, msgTotalReturned, msgBuyerInfo, msgDocId)
})

numberFormat = (number) => {
    let numFormat = new Intl.NumberFormat('de-DE').format(number)
    return numFormat
}

printSales = (salesNumber, totalSales, totalReceived, totalReturned, buyerInfo, docId) => {
    printSalesPage = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true
        }
    )

    let salesDate
    let d = new Date()
    let date = d.getDate().toString().padStart(2,0)
    let month = d.getMonth().toString().padStart(2,0)
    let year = d.getFullYear()
    salesDate = `${date}/${month}/${year}`
    

    let storeInfo = {}
    db.all(`select * from profil order by id asc limit 1`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            storeInfo.name = 'My Store'
            storeInfo.address = 'Address'
            storeInfo.taxNumber = ''
            storeInfo.telp = ''
            storeInfo.logo = 'shop.png'
        } else {
            storeInfo.name = row[0].store_name
            storeInfo.address = row[0].store_address
            if(row[0].store_tax_id == "" || row[0].store_tax_id == null) {
                storeInfo.taxNumber = ""
            } else {
                storeInfo.taxNumber = `NPWP. ${row[0].store_tax_id}`
            }
            if(row[0].phone_number == "" || row[0].phone_number == null) {
                storeInfo.telp = ""
            } else {
                storeInfo.telp = `| Telp. ${row[0].phone_number}`
            }
            if(row[0].logo == "") {
                storeInfo.logo = 'shop.png'
            } else {
                storeInfo.logo = row[0].logo
            }
        }
    })

    let salesHeader = {
        date: salesDate,
        number: salesNumber,
        buyerAddress: buyerInfo
    }
    
    let salesRecord = ''
    db.all(`select * from sales where invoice_number = '${salesNumber}'`, (err, rows) => {
        if(err) throw err
        if(rows.length < 1) {
            console.log('no sales to print')
        } else {
            let subtotal = 0
            salesHeader.admin = rows[0].sales_admin
            rows.map( row => {
                let discountPercent = row.discount_percent
                let discountMoney = row.discount_money
                let discountInfo
                if(discountPercent == "" && discountMoney == "") {
                    discountInfo = ""
                } else if(discountPercent != "" && discountMoney == "") {
                    discountInfo = `${discountPercent}%`
                } else if(discountPercent != "" && discountMoney != "") {
                    discountInfo = `${discountPercent}%+${numberFormat(discountMoney)}`
                } else if(discountPercent == "" && discountMoney != "") {
                    discountInfo = `${numberFormat(discountMoney)}`
                }
                subtotal+=parseFloat(row.total)
                salesRecord += `<tr>
                                    <td>${row.product_name} (${row.qty}x${numberFormat(row.price)})</td>
                                    <td>${discountInfo}</td>
                                    <td><span class="float-end">${numberFormat(row.total)}</span></td>
                                </tr>`
                salesFooter.subTotal = numberFormat(subtotal)
            })
        }
    })

    let salesFooter = {
        grandTotal: numberFormat(totalSales),
        totalCashReceived: numberFormat(totalReceived),
        totalCashReturned: numberFormat(totalReturned)
    }

    db.all(`select * from discount_final where invoice_number = '${salesNumber}'`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            salesFooter.discountFinal = ''
        } else {
            let discountPercent = row[0].discount_percent
            let discountMoney = row[0].discount_money
            let discountFinalInfo
            if(discountPercent == "" && discountMoney == "") {
                discountFinalInfo == ""
            } else if(discountPercent != "" && discountMoney == "") {
                discountFinalInfo = `${discountPercent}%`
            } else if(discountPercent != "" && discountMoney != "") {
                discountFinalInfo = `${discountPercent}%+${numberFormat(discountMoney)}`
            } else if(discountPercent == "" && discountMoney != "") {
                discountFinalInfo = `${numberFormat(discountMoney)}`
            }
            salesFooter.discountFinal = discountFinalInfo
        }
        db.all(`select * from sales_tax where invoice_number = '${salesNumber}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                salesFooter.tax = ''
            } else {
                salesFooter.tax = numberFormat(row[0].total_tax)
            }
        })
    })

    remote.enable(printSalesPage.webContents)

    printSalesPage.loadFile('windows/receipt.html')

    printSalesPage.webContents.on('dom-ready', () => {
        printSalesPage.webContents.send('load:print', salesRecord, storeInfo, salesHeader, salesFooter)
    })

}

ipcMain.on('print:sales-evidence', (e, docId) => {
            
    switch(docId) {
        case 'cashier' :
            cashierWindow.webContents.send('load:blank-sales')
            salesModal.close()
            break;
    }
    
    printSalesPage.webContents.print({
        printBackground: true
    }), () => {
        db.run(`insert into sales_evidence_info(invoice_number, print_status) values('${salesNumber}', 'printed')`, err => {
            if(err) throw err
        })
        printSalesPage.close()
        salesNum = ""
    }

    printSalesPage.on('close', () => {
        printSalesPage = null
        salesNum = ""
    })
})

modalBuyer = () => {
    buyerModal = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            autoHideMenuBar: true,
            width: 300,
            height: 400,
            parent: cashierWindow,
            modal: true,
            resizeable: false,
            title: ' Add Buyer/Customer'
        }
    )
    remote.enable(buyerModal.webContents)
    buyerModal.loadFile('modals/buyer-form.html')
    buyerModal.on('close', () => {
        cashierWindow.webContents.send('load:buyer-select')
    })
}

ipcMain.on('load:buyer-form', () => {
    modalBuyer()
})