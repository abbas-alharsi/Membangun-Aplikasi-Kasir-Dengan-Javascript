totalSalesPage = (totalRowDisplayed, searchVal) => {
    let query
    if(searchVal != "") {
        query = `select count(*) as total_row from sales where invoice_number like '%${searchVal}%' escape '!'`
    } else {
        query = `select count(*) as total_row from sales`
    }
    db.each(query, (err, row) => {
        if(err) throw err
        let totalPage
        if(row.total_row%totalRowDisplayed == 0) {
            totalPage = parseInt(row.total_row)/parseInt(totalRowDisplayed)
        } else {
            totalPage = parseInt(row.total_row/totalRowDisplayed)+1
        }
        $('#total_pages').val(totalPage)
    })
}

loadSales = (pageNumber, totalRowDisplayed, searchVal) => {
    let rowNumber
    if(pageNumber < 2) {
        rowNumber = 0
    } else {
        rowNumber = (pageNumber-1)*totalRowDisplayed
    }
    totalSalesPage(totalRowDisplayed, searchVal)
    let query
    if(searchVal != "") {
        query = `select * from sales where invoice_number like '%${searchVal}%' escape '!' order by id desc limit ${rowNumber}, ${totalRowDisplayed}`
    } else {
        query = `select * from sales order by id desc limit ${rowNumber}, ${totalRowDisplayed}`
    }
    db.all(query, (err, rows) => {
        if(err) throw err
        let tr = ''
        if(rows.length < 1) {
            tr+=''
        } else {
            rows.forEach( row => {
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
                tr += `<tr data-id="${row.id}">
                            <td>${row.id}</td>
                            <td>${row.input_date}</td>
                            <td>${row.invoice_number}</td>
                            <td>${row.product_name}</td>
                            <td>${row.product_code}</td>
                            <td>${numberFormat(row.price)}</td>
                            <td>${numberFormat(row.qty)}</td>
                            <td>${row.unit}</td>
                            <td>${discountInfo}</td>
                            <td>${numberFormat(row.total)}</td>
                        </tr>`
            })
        }
        $('tbody#data').html(tr)
    })
}