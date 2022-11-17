
let inputPrdPrice = IMask(
    document.getElementById('product_price'),
    {
        mask: 'Rp num',
        blocks: {
            num: {
                mask: Number,
                thousandsSeparator: '.',
                scale: 3,
                radix: ',',
                mapToRadix: ['.'],
                padFractionalZeros: false,
                signed: false
            }
        }
    }
)
let inputPrdCost = IMask(
    document.getElementById('product_cost'),
    {
        mask: 'Rp num',
        blocks: {
            num: {
                mask: Number,
                thousandsSeparator: '.',
                scale: 3,
                radix: ',',
                mapToRadix: ['.'],
                padFractionalZeros: false,
                signed: false
            }
        }
    }
)
let inputPrdInitQty = IMask(
    document.getElementById('product_initial_qty'),
    {
        mask: 'num',
        blocks: {
            num: {
                mask: Number,
                thousandsSeparator: '.',
                padFractionalZeros: false,
                signed: false
            }
        }
    }
)

totalPrdPage = (total_row_displayed, searchVal) => {

    let query
    if(searchVal != "") {
        query = `select count(*) as total_row from products where product_name like '%${searchVal}%' escape '!' or product_code like '%${searchVal}%' escape '!' or barcode like '%${searchVal}%' escape '!' or category like '%${searchVal}%' escape '!' or selling_price like '%${searchVal}%' escape '!' or cost_of_product like '%${searchVal}%' escape '!'`
    } else {
        query = `select count(*) as total_row from products`
    }

    db.serialize( () => {
        db.each(query, (err, result) => {
            if(err) throw err
            let total_page
            if(result.total_row%total_row_displayed == 0) {
                total_page = parseInt(result.total_row)/parseInt(total_row_displayed)
            } else {
                total_page = parseInt(result.total_row/total_row_displayed)+1
            }
            $('#total_pages').val(total_page)
        })
    })
}

function loadProduct(page_number, total_row_displayed, searchVal) {
    let row_number
    if(page_number < 2) {
        row_number = 0
    } else {
        row_number = (page_number-1)*total_row_displayed
    }
    total_page(total_row_displayed, searchVal)

    let query
    if(searchVal != "") {
        query = `select * from products where product_name like '%${searchVal}%' escape '!' or product_code like '%${searchVal}%' escape '!' or barcode like '%${searchVal}%' escape '!' or category like '%${searchVal}%' escape '!' or selling_price like '%${searchVal}%' escape '!' or cost_of_product like '%${searchVal}%' escape '!' order by id desc limit ${row_number}, ${total_row_displayed}`
    } else {
        query = `select * from products order by id desc limit ${row_number}, ${total_row_displayed}`
    }

    db.serialize( () => {
        db.all(query, (err, rows) => {
            if (err) throw err
            let tr = ''
            if(rows.length < 1) {
                tr += ''
            } else {
                rows.forEach((row) => {
                    tr+=`<tr data-id=${row.id}>
                            <td data-colname="Id">
                                ${row.id}
                                <input type="checkbox" style="visibility:hidden" id="${row.id}" class="data-checkbox">
                            </td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.unit}</td>
                            <td>${numberFormat(row.selling_price)}</td>
                            <td>${numberFormat(row.cost_of_product)}</td>
                            <td>${row.product_initial_qty}</td>
                            <td>
                                <button class="btn btn-sm btn-light btn-light-bordered" onclick="editRecord(${row.id})" id="edit-data"><i class="fa fa-edit"></i></button>
                                <button class="btn btn-sm btn-danger" onclick="deleteAction(${row.id}, '${row.product_name}')" id="delete-data"><i class="fa fa-trash"></i></button>
                            </td>
                        </tr>`
                })
            }
            $('tbody#data').html(tr)
        })
    })
}

blankForm = () => {
    $('#product_name').val("")
    $('#product_barcode').val("")
    $('#product_price').val("")
    $('#product_cost').val("")
    $('#product_initial_qty').val("")
}

insertProduct = () => {
    let prd_name = $('#product_name').val()
    let prd_barcode = $('#product_barcode').val()
    let prd_category = $('#product_category').val()
    let prd_price = inputPrdPrice.unmaskedValue
    let prd_cost = inputPrdCost.unmaskedValue
    let prd_init_qty = inputPrdInitQty.unmaskedValue
    let prd_unit = $('#product_unit').val()

    let required = $('[required]')
    let required_array = []
    required.each(function() {
        if($(this).val() != "") {
            required_array.push($(this).val())
        }
    })

    if(required_array.length < 4) {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Nama produk, Harga jual, Harga pokok, dan Satuan harus diisi'
        }) 
    } else if(parseInt(prd_price) < parseInt(prd_cost)) {
        dialog.showMessageBoxSync({
            title: 'Alert',
            type: 'info',
            message: 'Harga jual lebih kecil dari harga pokok'
        }) 
    } else {
        db.serialize( () => {
            db.each(`select count(*) as row_number from products where product_name = '${prd_name}'`, (err, res) => {
                if(err) throw err
                if(res.row_number < 1) {
                    db.run(`insert into products(product_name, barcode, category, selling_price, cost_of_product, product_initial_qty, unit) values('${prd_name}','${prd_barcode}','${prd_category}','${prd_price}','${prd_cost}','${prd_init_qty}','${prd_unit}')`, err => {
                        if(err) throw err
                        //generate kode produk secara otomatis
                        db.each(`select id from products where product_name = '${prd_name}'`, (err, row) => {
                            if(err) throw err
                            db.run(`update products set product_code = 'PR'||substr('000000'||${row.id},-6,6) where product_name = '${prd_name}'`, err => {
                                if(err) throw err
                                blankForm()
                                $('#product_name').focus()
                                let total_row_displayed = $('#row_per_page').val()
                                load_data(1, total_row_displayed)
                            })
                        })
                    })
                } else {
                    dialog.showMessageBoxSync({
                        title: 'Alert',
                        type: 'info',
                        message: 'Nama produk sudah ada dalam database, silahkan gunakan nama produk lain'
                    }) 
                }
            })

        })
    }

}

loadCategoryOptions = () => {
    db.all(`select * from categories order by id desc`, (err, rows) => {
        if(err) throw err
        let option = '<option value="">Kategori</option>'
        rows.map( (row) => {
            option+=`<option value="${row.category}">${row.category}</option>`
        })
        $('#product_category').html(option)
    })
}

loadUnitOptions = () => {
    db.all(`select * from units order by id desc`, (err, rows) => {
        if (err) throw err
        let option ='<option value="">Satuan</option>'
        rows.map( (row) => {
            option+=`<option value="${row.unit}">${row.unit}</option>`
        })
        console.log(option)

        $('#product_unit').html(option)
    })
}

function selectUnitOption(unitOpt, unit) {
    let options = unitOpt.replace(`value="${unit}">`, `value="${unit}" selected>`)
    return options
}
function selectCategoryOption(categoryOpt, category) {
    let options = categoryOpt.replace(`value="${category}">`, `value="${category}" selected>`)
    return options
    console.log(options)
}
editPrdData = (id) => {
    let sqlUnit = `select * from units`
    let sqlCategory = `select * from categories`
    let sql = `select * from products where id = ${id}`

    db.all(sqlUnit, (err, result) => {
        if(err) {
            throw err
        } else {
            let unitOption
            let unitOpts = '<option></option>'
            result.forEach( (item) => {
                unitOpts +=`<option value="${item.unit}">${item.unit}</option>`
            })
            unitOption = unitOpts
            console.log(unitOption)
            db.all(sqlCategory, (err, result) => {
                if(err) {
                    throw err
                } else {
                    let categoryOption
                    let categoryOpts =`<option></option>`
                    result.forEach( (item) => {
                        categoryOpts+=`<option value="${item.category}">${item.category}</option>`
                    })
                    categoryOption = categoryOpts
                    db.all(sql, (err, result) => {
                        if(err) {
                            throw err
                        } else {
                            let row = result[0]
                            let editForm
                            editForm = `<div class="mb-3">
                                            <input type="text" value="${row.product_name}" id="editPrdName" placeholder="Nama Produk" class="form-control form-control-sm">
                                            <input type="hidden" value="${row.product_name}" id="prevPrdName">
                                            <input type="hidden" value="${id}" id="rowId">
                                        </div>
                                        <div class="mb-3">
                                            <input type="text" value="${row.barcode}" id="editPrdBarcode" placeholder="Barcode" class="form-control form-control-sm">
                                            <input type="hidden" value="${row.barcode}" id="prevPrdBarcode">
                                        </div>
                                        <div class="mb-3">
                                            <select id="editPrdCategory" class="form-select form-select-sm">
                                                ${selectCategoryOption(categoryOption, row.category)}
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <select id="editPrdUnit" class="form-select form-select-sm">
                                                ${selectUnitOption(unitOption, row.unit)}
                                            </select>
                                        </div>
                                        <div class="mb-3">
                                            <input type="text" value="${row.selling_price}" placeholder="Harga Jual" id="editPrdPrice" class="form-control form-control-sm">
                                        </div>
                                        <div class="mb-3">
                                            <input type="text" value="${row.cost_of_product}" placeholder="Harga Pokok" id="editPrdCost" class="form-control form-control-sm">
                                        </div>
                                        <div class="mb-3">
                                            <input type="text" value="${row.product_initial_qty}" placeholder="Stock Awal" id="editPrdInitQty" class="form-control form-control-sm">
                                        </div>
                                        <div class="d-grid gap-2">
                                            <button class="btn btn-sm btn-primary btn-block" onclick="submitEditPrdData(${id})" id="btn-submit-edit"><i class="fa fa-paper-plane"></i> Submit</button>
                                        </div>
                                        `
                            ipcRenderer.send('load:edit','product-data', editForm, 300, 450, id)
                        }
                    })
                }
            })
        }
    })
}

ipcRenderer.on('update:success', (e, msg) => {
    alertSuccess(msg)
    let page_number = $('#page_number').val()
    let total_row_displayed = $('#row_per_page').val()
    load_data(page_number, total_row_displayed)
})
exportCsvPrdData = (filePath, ext, joinIds = false) => {
    let sql
    let file_path = filePath.replace(/\\/g,'/')
    if(joinIds) {
        sql = `select * from products where id IN(${joinIds}) order by id desc`
    } else {
        sql = `select * from products order by id desc`
    }

    db.all(sql, (err, result) => {
        if(err) throw err
        convertToCsv = (arr) => {
            let array = [Object.keys(arr[0])].concat(arr)
            return array.map( (item) => {
                return Object.values(item).toString()
            }).join('\r\n')
        }
        let content = convertToCsv(result)
        ipcRenderer.send('write:csv', file_path, content)
    })
}

exportPdfPrdData = (filePath, ext, joinIds = false) => {
    let file_path = filePath.replace(/\\/g, '/')
    let sql
    if(joinIds) {
        
        
        sql = `select * from products where id IN(${joinIds}) order by id desc`
        console.log(sql)
        
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Kategori</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Satuan</th>
                            <th>Stok Awal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_initial_qty}</td>
                        </tr>`
            })

            ipcRenderer.send('load:to-pdf', thead, tbody, file_path, 'product-data', 'Data Produk')
            

        })
    } else {
        sql = `select * from products order by id desc`
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Kategori</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Satuan</th>
                            <th>Stok Awal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_initial_qty}</td>
                        </tr>`
            })

            ipcRenderer.send('load:to-pdf', thead, tbody, file_path, 'product-data', 'Data Produk')

        })
    }
}

printPrdData = (joinIds = false) => {
    let sql
    if(joinIds) {
        sql = `select * from products where id IN(${joinIds}) order by id desc`
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Kategori</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Satuan</th>
                            <th>Stok Awal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_initial_qty}</td>
                        </tr>`
            })

            ipcRenderer.send('load:print-page', thead, tbody, 'product-data', 'Data Produk')

        })
    } else {
        sql = `select * from products order by id desc`
        db.all(sql, (err, res) => {
            if(err) throw err
            let tbody = ''
            let thead = `<tr>
                            <th>Id</th>
                            <th>Nama Produk</th>
                            <th>Kode Produk</th>
                            <th>Barcode</th>
                            <th>Kategori</th>
                            <th>Harga Jual</th>
                            <th>Harga Pokok</th>
                            <th>Satuan</th>
                            <th>Stok Awal</th>
                        </tr>`
            res.forEach( (row)=>{
                tbody+=`<tr>
                            <td>${row.id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${row.barcode}</td>
                            <td>${row.category}</td>
                            <td>${row.selling_price}</td>
                            <td>${row.cost_of_product}</td>
                            <td>${row.unit}</td>
                            <td>${row.product_initial_qty}</td>
                        </tr>`
            })

            ipcRenderer.send('load:print-page', thead, tbody, 'product-data', 'Data Produk')
        
        })
    }
}