
closeCashier = () => {
    ipcRenderer.send('close:cashier')
}

getProductName = () => {
    let query = `select * from products order by id desc`
    db.all(query, (err, rows) => {
        if(err) throw err
        let options = `<option value="">Nama Produk</option>`
        rows.forEach( row => {
            options+=`<option>${row.product_name}</option>`
        })
        $('#product_name').html(options)
    })
}
getProductName()

today = () => {
    let d = new Date()
    let date = d.getDate().toString().padStart(2,0)
    let month = d.getMonth().toString().padStart(2,0)
    let year = d.getFullYear()
    $('#info-sales-date').html(`${date}/${month}/${year}`)
}

today()

openSales = () => {
    let sales_number = $('#sales-number').val()
    let buyer = $('#buyer-select').val()
    let buyer_id = $('#buyer-id').val()
    let buyer_address = $('#buyer-address').val()
    let po_number = $('#po-number').val()
    let payment = $('#cash-credit').val()
    let due_date = $('#due-date').val()
    let term = $('#term').val()
    let description = $('#description').val()

    today()
    $('#info-sales-number').html(sales_number)
    $('#info-buyer').html(buyer)
    let tax_rate
    let tax_checked = []
    $('.sales-tax:checked').each(function() {
        tax_checked.push("checked")
    })
    if(tax_checked.length < 1) {
        tax_rate = 0
        $('#input-tax').val(tax_rate)
    } else {
        db.all(`select * from tax where id = 1`, (err, row) => {
            if(err) throw err
            tax_rate = parseFloat(row[0].percentage)/100
            $('#input-tax').val(tax_rate)
        })
    }

    $('#modal-new-sales').modal('hide')
    $('.sales-input').removeAttr('disabled')
    $('#btn-new-sales').prop('disabled', true)
    ipcRenderer.send('sales-number', sales_number)
}

let prdCodeArray = []

db.all(`select * from products`, (err, rows) => {
    if(err) throw err
    rows.map( row => {
        prdCodeArray.push(row.product_code)
    })
})

$('#product_code').autocomplete({
    source:prdCodeArray
})

getCodeByName = () => {
    let prd_name = $('#product_name').val()
    if(prd_name == "") {
        $('#product_code').val("")
    } else {
        let query = `select * from products where product_name = '${prd_name}'`
        db.all(query, (err, row) => {
            if(err) throw err
            if(row.length < 1){
                $('#product_code').val("")
            } else {
                $('#product_code').val(row[0].product_code)
            }
        })
    }
}

insertSales = () => {
    let sales_number = $('#sales-number').val()
    let buyer = $('#buyer-select').val()
    let buyer_id = $('#buyer-id').val()
    let po_number = $('#po-number').val()
    let payment = $('#cash-credit').val()
    let due_date = $('#due-date').val()
    let term = $('#term').val()
    let description = $('#description').val()
    let product_code = $('#product_code').val().toUpperCase()
    let tax_rate = $('#input-tax').val()
    
    if(product_code != "" && product_code != null) {
        db.all(`select * from products where product_code = '${product_code}' or barcode = '${product_code}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                let alert = dialog.showMessageBoxSync(
                    {
                        title: 'Alert',
                        type: 'info',
                        message: 'no product with code '+product_code
                    }
                )
                if(alert == 0) {
                    $('#product_code').val("")
                }
            } else {
                let prd_name = row[0].product_name
                let prd_code = row[0].product_code
                let prd_price = row[0].selling_price
                let prd_cost = row[0].cost_of_product
                let unit = row[0].unit
                let discount_percent = ''
                let discount_money = ''
                db.all(`select * from sales where product_code = '${prd_code}' and invoice_number = '${sales_number}'`, (err, row) => {
                    if(err) throw err
                    if(row.length < 1) {
                        let qty = 1
                        let total = qty*prd_price
                        db.run(`insert into sales (input_date, invoice_number, buyer, buyer_id, payment, description, po_number, due_date, term, sales_admin, product_name, product_code, cost_of_product, price, qty, unit, discount_percent, discount_money, total) values(datetime('now','localtime'), '${sales_number}', '${buyer}', '${buyer_id}', '${payment}', '${description}', '${po_number}', '${due_date}', '${term}', '', '${prd_name}', '${prd_code}', '${prd_cost}', '${prd_price}', '${qty}', '${unit}', '${discount_percent}', '${discount_money}', '${total}')`, err => {
                            if(err) throw err
                            loadSales(sales_number)
                            $('#product_code').val("")
                            
                            if(tax_rate != "") {
                                salesTax(sales_number, tax_rate)
                            } else {
                                totalSales(sales_number)
                            }
                        })
                    } else {
                        let disc_percent
                        let disc_money
                        if(row[0].discount_percent != "") {
                            disc_percent = row[0].discount_percent
                        } else {
                            disc_percent = 0
                        }
                        if(row[0].discount_money != "") {
                            disc_money = row[0].discount_money
                        } else {
                            disc_money = 0
                        }
                        let qty = parseInt(row[0].qty)
                        let new_qty = qty+1
                        let new_total = parseInt(new_qty)*parseFloat(prd_price)
                        let discount_percent = parseFloat(disc_percent)*new_total
                        let discount_money = parseFloat(disc_money)
                        let net_new_total = new_total-discount_percent-discount_money
                        db.run(`update sales set input_date = datetime('now', 'localtime'), qty = '${new_qty}', total = '${net_new_total}' where product_code = '${prd_code}' and invoice_number = '${sales_number}'`, err => {
                            if(err) throw err
                            loadSales(sales_number)
                            $('#product_code').val("")
                            
                            if(tax_rate != "") {
                                salesTax(sales_number, tax_rate)
                            } else {
                                totalSales(sales_number)
                            }
                        })
                    }
                })
            }
        })
    } else {
        dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Please insert product code first'
            }
        )
    }
}

loadSales = (sales_num) => {
    let query = `select * from sales where invoice_number = '${sales_num}'`
    db.all(query, (err, rows) => {
        if(err) throw err
        let tr = ''
        if(rows.length < 1) {
            tr+=''
        } else {
            rows.map( row => {
                let discount_percent = row.discount_percent
                let discount_money = row.discount_money
                let discount_info
                if(discount_percent == "" && discount_money == "") {
                    discount_info = ""
                } else if (discount_percent != "" && discount_money == "") {
                    discount_info = `${discount_percent}%`
                } else if(discount_percent !="" && discount_money != "") {
                    discount_info = `${discount_percent}%+${numberFormat(discount_money)}`
                } else if(discount_percent == "" && discount_money != "") {
                    discount_info = `${numberFormat(discount_money)}`
                }
                tr += `<tr>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td><span class="float-end">${numberFormat(row.price)}</span></td>
                            <td style="text-align:center">${numberFormat(row.qty)}</td>
                            <td>${row.unit}</td>
                            <td>${discount_info}</td>
                            <td><span class="float-end">${numberFormat(row.total)}</span></td>
                        </tr>`
            })
        }
        $('tbody#sales-data').html(tr)
    })
}

$('#product_code, #product_name').keydown(function(e) {
    if(e.keyCode == 13) {
        insertSales()
    }
})

totalSales = (sales_number) => {
    let query = `select sum(total) as total_sales from sales where invoice_number = '${sales_number}'`
    db.all(query, (err, row) => {
        if(err) throw err
        let total_sales = row[0].total_sales
        db.all(`select * from discount_final where invoice_number = '${sales_number}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                db.all(`select total_tax from sales_tax where invoice_number = '${sales_number}'`, (err, row) => {
                    if(err) throw err
                    if(row.length < 1) {
                        $('#total-and-tax').html(numberFormat(total_sales))
                    } else {
                        let total_tax = row[0].total_tax
                        let net_total_sales = parseFloat(total_sales) + parseFloat(total_tax)
                        $('#total-and-tax, #info-total-sales').html(numberFormat(net_total_sales))
                        $('#input-total-and-tax').val(net_total_sales)
                    }
                })
            } else {
                let discount_percent = row[0].discount_percent
                let discount_money = row[0].discount_money
                let discount_final_info
                if(discount_percent == "" && discount_money == "") {
                    discount_final_info = ""
                } else if (discount_percent != "" && discount_money == "") {
                    discount_final_info = `${discount_percent}%`
                } else if(discount_percent !="" && discount_money != "") {
                    discount_final_info = `${discount_percent}%+${numberFormat(discount_money)}`
                } else if(discount_percent == "" && discount_money != "") {
                    discount_final_info = `${numberFormat(discount_money)}`
                }
                
                $('#discount-final').html(discount_final_info)
                let total_discount_final = row[0].total_discount_final
                db.all(`select total_tax from sales_tax where invoice_number = '${sales_number}'`, (err, row) => {
                    if(err) throw err
                    if(row.length < 1) {
                        let net_total_sales = parseFloat(total_sales) - parseFloat(total_discount_final)
                        $('#total-and-tax').html(numberFormat(net_total_sales))
                        $('#input-total-and-tax').val(net_total_sales)
                    } else {
                        let total_tax = row[0].total_tax
                        let net_total_sales = (parseFloat(total_sales) - parseFloat(total_discount_final)) + parseFloat(total_tax)
                        $('#total-and-tax, #info-total-sales').html(numberFormat(net_total_sales))
                        $('#input-total-and-tax').val(net_total_sales)
                    }
                })
            }
        })
    })
}

salesTax = (sales_number, tax_rate) => {
    queryTax = (sales_number, total_tax) => {
        db.all(`select * from sales_tax where invoice_number = '${sales_number}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                db.run(`insert into sales_tax(input_date, invoice_number, total_tax) values(datetime('now', 'localtime'), '${sales_number}', '${total_tax}')`, (err, row) => {
                    if(err) throw err
                    $('#tax').html(numberFormat(total_tax))
                    totalSales(sales_number)
                })
            } else {
                db.run(`update sales_tax set input_date = datetime('now','localtime'), total_tax = '${total_tax}' where invoice_number = '${sales_number}'`, err => {
                    if(err) throw err
                    $('#tax').html(numberFormat(total_tax))
                    totalSales(sales_number)
                })
            }
        })
    }

    db.all(`select sum(total) as total_sales from sales where invoice_number = '${sales_number}'`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            console.log(row)
        } else {
            let total_sales = row[0].total_sales
            db.all(`select total_discount_final from discount_final where invoice_number = '${sales_number}'`, (err, row) => {
                if(err) throw err
                if(row.length < 1) {
                    let total_tax = parseFloat(tax_rate)*parseFloat(total_sales)
                    queryTax(sales_number, total_tax)
                } else {
                    let total_discount_final = row[0].total_discount_final
                    let total_sales_after_disc = parseFloat(total_sales)-parseFloat(total_discount_final)
                    let total_tax = parseFloat(tax_rate)*parseFloat(total_sales_after_disc)
                    queryTax(sales_number, total_tax)
                }
            })
        }
    })
}

salesModal = (title) => {
    let buyer_address = $('#buyer-address').val()
    let sales_number = $('#sales-number').val()
    let total_sales = $('#input-total-and-tax').val()
    if(sales_number != "") {
        db.all(`select * from sales where invoice_number = '${sales_number}'`, (err, rows) => {
            if(rows.length < 1) {
                let alert = dialog.showMessageBoxSync(
                    {
                        title: 'Alert',
                        type: 'info',
                        message: 'Tidak terdapat record penjualan yang dapat diedit, silahkan masukkan record penjualan terlebih dahulu'
                    }
                )
            } else {
                ipcRenderer.send('load:sales-modal', sales_number, title, total_sales, buyer_address)
				console.log(total_sales)
            }
        })
    } else {
        let alert = dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Silahkan buat penjualan baru terlebih dahulu'
            }
        )
        if(alert == 0) {
            $('#btn-new-sales').focus()
        }
    }
}

ipcRenderer.on('update-success:sales-edit', () => {
    let sales_number = $('#sales-number').val()
    let tax_rate = $('#input-tax').val()
    loadSales(sales_number)
    if(tax_rate != "") {
        salesTax(sales_number, tax_rate)
    } else {
        totalSales(sales_number)
    }
})

$(document).scannerDetection(
    {
        timeBeforeScanTest: 200,
        avgTimeByChar: 40,
        endChar: [13],
        onComplete: function(barcode) {
            validScan = true
            $('#product_code').val(barcode)
            insertSales()
        }
    }
)

blankSales = () => {
    $('#sales-number').val("")
    $('#buyer-select').val("")
    $('#buyer-id').val("")
    $('#buyer-address').val("")
    $('#po-number').val("")
    $('#cash-kredit').val("")
    $('#due-date').val("")
    $('#term').val("")
    $('#description').val("")

    $('#info-sales-number').html("")
    $('#info-buyer').html("")
    $('#info-total-sales').html("")

    $('#sales-data').html("")
    $('#discount-final').html("")
    $('#tax').html("")
    $('#total-and-tax').html("")

    $('.sales-input').attr('disabled', true)
    $('#btn-new-sales').removeAttr('disabled')
    $('#btn-new-sales').focus()
}

ipcRenderer.on('load:blank-sales', () => {
    blankSales()
})

salesNumber = () => {
    let query = `select max(substr(invoice_number, 7, 7)) as sales_number from sales`
    db.all(query, (err, row) => {
        if(err) throw err
        let number
        if(row[0].sales_number == null) {
            number = 1
        } else {
            number = parseInt(row[0].sales_number)+1
        }
        let suffixNum = number.toString().padStart(7,0)
        let d = new Date()
        let month = d.getMonth().toString().padStart(2,0)
        let year = d.getFullYear()
        let salesNum = `${year}${month}${suffixNum}`
        $('#sales-number').val(salesNum)
        $('#btn-create-new-sales').focus()
    })
}

loadBuyer = () => {
    let query = `select * from buyers order by id desc`
    db.all(query, (err, rows) => {
        if(err) throw err
        let options = `<option value="">Buyer/Customer</option>`
        if(rows.length < 1) {
            options+=''
        } else {
            rows.map(row => {
                options+=`<option value="${row.name}">${row.name}</option>`
            })
        }
        $('#buyer-select').html(options)
    })
}

loadBuyerForm = () => {
    ipcRenderer.send('load:buyer-form')
}

ipcRenderer.on('load:buyer-select', () => {
    loadBuyer()
})