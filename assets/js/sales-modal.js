let title
let inputTotalReceived
let inputTotalSales
let inputDiscountFinalMoney
let buyerAddress
ipcRenderer.on('load:tbody-tr', (e, content, titleBar, buyerInfo) => {
    $('#data').html(content)
    title = titleBar
    switch(title) {
        case 'checkout' :
            $('#btn-submit').html(`<i class="fa fa-print"></i> Print`)
            inputTotalReceived = IMask(
                document.getElementById('total-received'),
                {
                    mask: 'num',
                    blocks: {
                        num: {
                            mask: Number,
                            thousandsSeparator: '.',
                            scale: 3,
                            radix: '.',
                            mapToRadix: ['.'],
                            padFractionalZeros: false,
                            signed: false
                        }
                    }
                }
            )
            inputTotalSales = IMask(
                document.getElementById('total-sales'),
                {
                    mask: 'num',
                    blocks: {
                        num: {
                            mask: Number,
                            thousandsSeparator: '.',
                            scale: 3,
                            radix: '.',
                            mapToRadix: ['.'],
                            padFractionalZeros: false,
                            signed: false
                        }
                    }
                }
            )
            break;
        case 'discount-final' :
            inputDiscountFinalMoney = IMask(
                document.getElementById('discount-final-money'),
                {
                    mask: 'num',
                    blocks: {
                        num: {
                            mask: Number,
                            thousandsSeparator: '.',
                            scale: 3,
                            radix: ',',
                            mapToRadix: ['.'],
                            pradFractionalZeros: false,
                            signed: false
                        }
                    }
                }
            )
            break;
    }
    buyerAddress = buyerInfo
})

submitUpdate = () => {
    switch(title) {
        case 'discount-final' :
            submitDiscountFinal()
            break;
        case 'checkout' :
            printSales()
            break;
        default :
            submitUpdateSales()
            break;
    }
}

$('#data').on('keydown','#total-received', function(e) {
    if(e.keyCode == 13) {
        printSales()
    }
})

newDiscountFinal = () => {
    let total_sales = $('#total-sales').val()
    let discount_percent
    let discount_money
    if($('#discount-final-percent').val() != "") {
        discount_percent = $('#discount-final-percent').val()
    } else {
        discount_percent = 0
    }
    if($('#discount-final-money').val() != "") {
        discount_money = inputDiscountFinalMoney.unmaskedValue
    } else {
        discount_money = 0
    }
    let newTotalDiscountFinal = ((parseFloat(discount_percent/100)*(parseFloat(total_sales)))+parseFloat(discount_money))
    $('#total-discount-final').val(newTotalDiscountFinal)
}

newTotal = (data_id) => {
    let prd_price = $(`#input-prd-price-${data_id}`).val()
    let qty = $(`#input-qty-${data_id}`).val()
    let discount_percent
    let discount_money
    if($(`#input-discount-percent-${data_id}`).val() != "") {
        discount_percent = $(`#input-discount-percent-${data_id}`).val()
    } else {
        discount_percent = 0
    }
    if($(`#input-discount-money-${data_id}`).val() != "") {
        discount_money = $(`#input-discount-money-${data_id}`).val()
    } else {
        discount_money = 0
    }
    let newTotal
    if(qty != "") {
        newTotal = (parseFloat(prd_price)*parseInt(qty))-(((parseFloat(discount_percent)/100)*(parseFloat(prd_price)*parseInt(qty)))+parseFloat(discount_money))
    } else {
        newTotal = (parseFloat(prd_price)*parseInt(qty))-(((parseFloat(discount_percent)/100)*(parseFloat(prd_price)*parseInt(qty)))+parseFloat(discount_money))
    }
    $(`#input-total-${data_id}`).val(newTotal)
}

submitUpdateSales = () => {
    let id = []
    let input_date = []
    let sales_number = $(`.input-invoice-number`).val()
    let buyer = $(`.input-buyer`).val()
    let buyer_id = $(`.input-buyer-id`).val()
    let payment = $(`.input-payment`).val()
    let description = $(`.input-description`).val()
    let po_number = $(`.input-po-number`).val()
    let due_date = $(`.input-due-date`).val()
    let term = $(`.input-term`).val()
    let sales_admin = $(`.input-sales-admin`).val()
    let product_name = []
    let product_code = []
    let cost_of_product = []
    let price = []
    let qty = []
    let unit = []
    let discount_percent = []
    let discount_money = []
    let total = []
    let values = []
    $('#data').find('.input-input-date').each(function() {
        let input_input_date = $(this).val()
        input_date.push(input_input_date)
    })
    $('#data').find('.input-product-name').each(function() {
        let input_prd_name = $(this).val()
        product_name.push(input_prd_name)
    })
    $('#data').find('.input-product-code').each(function() {
        let input_prd_code = $(this).val()
        product_code.push(input_prd_code)
    })
    $('#data').find('.input-cost-of-product').each(function() {
        let input_cost_of_product = $(this).val()
        cost_of_product.push(input_cost_of_product)
    })
    $('#data').find('.input-prd-price').each(function() {
        let input_price = $(this).val()
        price.push(input_price)
    })
    $('#data').find('.input-qty').each(function() {
        let input_qty = $(this).val()
        let input_id = $(this).attr('data-id')
        qty.push(input_qty)
        id.push(input_id)
    })
    $('#data').find('.input-unit').each(function() {
        let input_unit = $(this).val()
        unit.push(input_unit)
    })
    $('#data').find('.input-discount-percent').each(function() {
        let input_discount_percent = $(this).val()
        discount_percent.push(input_discount_percent)
    })
    $('#data').find('.input-discount-money').each(function() {
        let input_discount_money = $(this).val()
        discount_money.push(input_discount_money)
    })
    $('#data').find('.input-total').each(function() {
        let input_total = $(this).val()
        total.push(input_total)
    })
    
    for(let i=0;i<id.length;i++) {
        values.push(`('${id[i]}','${input_date[i]}','${sales_number}','${buyer}', '${buyer_id}', '${payment}', '${description}', '${po_number}', '${due_date}', '${term}', '${sales_admin}', '${product_name[i]}', '${product_code[i]}', '${cost_of_product[i]}', '${price[i]}', '${qty[i]}', '${unit[i]}', '${discount_percent[i]}', '${discount_money[i]}','${total[i]}')`)
    }

    let joinValues = values.join(",")

    let query = `replace into sales(id, input_date, invoice_number, buyer, buyer_id, payment, description, po_number, due_date, term, sales_admin, product_name, product_code, cost_of_product, price, qty, unit, discount_percent, discount_money, total) values${joinValues}`
    
    db.run(query, err => {
        if(err) throw err
        ipcRenderer.send('update-success:sales-edit')
    })
}

submitDiscountFinal = () => {
    let sales_number = $(`#invoice-number`).val()
    let discount_percent = $(`#discount-final-percent`).val()
    let discount_money = inputDiscountFinalMoney.unmaskedValue
    let total_discount_final = $(`#total-discount-final`).val()
    let values
    db.all(`select * from discount_final where invoice_number = '${sales_number}'`, (err, row) => {
        if(err) throw err
        if(row.length < 1) {
            values = `(datetime('now','localtime'), '${sales_number}', '${discount_percent}', '${discount_money}', '${total_discount_final}')`
            db.run(`insert into discount_final(input_date, invoice_number, discount_percent, discount_money, total_discount_final) values${values}`, err => {
                if(err) throw err
                ipcRenderer.send('update-success:sales-edit')
            })
        } else {
            values = `('${row[0].id}',datetime('now','localtime'), '${sales_number}', '${discount_percent}', '${discount_money}', '${total_discount_final}')`
            db.run(`replace into discount_final(id, input_date, invoice_number, discount_percent, discount_money, total_discount_final) values${values}`, err => {
                if(err) throw err
                ipcRenderer.send('update-success:sales-edit')
            })
        }
    })
}

numberFormat = (number) => {
    let numFormat = new Intl.NumberFormat('de-DE').format(number)
    return numFormat
}

cashReturn = () => {
    let totalSales = inputTotalSales.unmaskedValue
    let totalReceived = inputTotalReceived.unmaskedValue
    let totalReturned = totalReceived - totalSales
    $('#info-total-returned').html(numberFormat(totalReturned))
    $('#total-returned').val(totalReturned)
}

printSales = () => {
    let totalSales = inputTotalSales.unmaskedValue
    let totalReceived = inputTotalReceived.unmaskedValue
    let totalReturned = totalReceived - totalSales
    ipcRenderer.send('print:sales', totalSales, totalReceived, totalReturned, buyerAddress, 'cashier')
}