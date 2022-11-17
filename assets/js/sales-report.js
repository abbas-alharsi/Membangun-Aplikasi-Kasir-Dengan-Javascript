yearSelect = () => {
	let yearOptions = ''
    let selected
	db.all(`select name from sqlite_master where type='table' and name not like 'sqlite_%'`, (err, rows) => {
		if(rows.length > 1) {
			db.all(`select substr(date(input_date), 1, 4) as sales_year from sales limit 1`, (err, row) => {
				if(err) throw err
				let year
				if(row.length < 1) {
					let d = new date()
					year = parseInt(d.getFullYear())
				} else {
					year = parseInt(row[0].sales_year)
				}
				let i
				for(i=0;i<21;i++) {
                    if(year == year+i) {
                        selected = 'selected'
                    } else {
                        selected = ''
                    }
					yearOptions += `<option value="${year+i}" ${selected}>${year+i}</option>`
				}
                switch(doc_id) {
                    case 'sales-report':
                        $('#start-year').html(yearOptions)
                        break
                    case 'chart':
                        $('#daily-sales-year, #monthly-sales-year, #top-sales-year').html(yearOptions)
                        break
                }
                
				
			})
		} else {
			let d = new Date()
			let year = parseInt(d.getFullYear())
			let i
			for(i=0;i<21;i++) {
                if(year == year+i) {
                    selected = 'selected'
                } else {
                    selected = ''
                }
				yearOptions += `<option value="${year+i}" ${selected}>${year+i}</option>`
			}
            switch(doc_id) {
                case 'sales-report':
                    $('#start-year').html(yearOptions)
                    break
                case 'chart':
                    $('#daily-sales-year, #monthly-sales-year, #top-sales-year').html(yearOptions)
                    break
            }
		}
	})
}

loadReport = (reportSpan, startMonth, startYear) => {
    let query
    let endMonth
    let endYear
    if(startMonth == 01) {
        endMonth =12
        endYear = startYear
    } else if(parseInt(startMonth) > 1) {
        endMonth = (parseInt(startMonth)-1).toString().padStart(2,0)
        endYear = parseInt(startYear)+1
    }

    switch(reportSpan) {
        case 'annual':
            query = `select sales.*, sum(discount_final.total_discount_final) as discount_final from 
            (select annual_sales.date as date, sum(annual_sales.total) as total, sum(annual_sales.cogs) as cogs
            from 
            (select substr(sales_table.sales_date,1,7) as date, sales_table.total as total, sales_table.cogs as cogs
            from 
            (select date(input_date) as sales_date, sum(total) as total, sum((qty*cost_of_product)) as cogs
            from 
            sales where substr(date(input_date), 1, 7) between '${startYear}-${startMonth}' and '${endYear}-${endMonth}' group by sales_date) 
            as sales_table) 
            as annual_sales group by annual_sales.date) 
            as sales
            left join
            discount_final on sales.date = substr(date(discount_final.input_date),1,7)`
            break;
        case 'monthly':
            query = `select sales_table.*, sum(discount_final.total_discount_final) as discount_final from (select date(input_date) as date, sum(total) as total, sum((qty*cost_of_product)) as cogs from sales where substr(date(input_date), 1, 7) = '${startYear}-${startMonth}' group by date) as sales_table left join discount_final on sales_table.date = date(discount_final.input_date) group by date`
            break;
    }
    db.all(query, (err, rows) => {
        if(err) throw err
        let tr = ''
        let totalNetSales = 0
        let totalCogs = 0
        let totalProfit = 0
        if(rows.length < 1) {
            tr = ''
            $('#data').html(tr)
            $('#net-total-sales').html("")
            $('#total-cogs').html("")
            $('#total-profit').html("")
        } else {
            rows.map( row => {
                let netSales = row.total-row.discount_final
                let profit = netSales - row.cogs
                totalNetSales+=netSales
                totalCogs+=row.cogs
                totalProfit+=profit
                tr += `<tr>
                            <td>${row.date}</td>
                            <td><span class="float-end">${numberFormat(row.total)}</span></td> 
                            <td><span class="float-end">${numberFormat(row.discount_final)}</span></td> 
                            <td><span class="float-end">${numberFormat(netSales)}</span></td> 
                            <td><span class="float-end">${numberFormat(row.cogs)}</span></td> 
                            <td><span class="float-end">${numberFormat(profit)}</span></td> 
                        </tr>`
            })
            $('#data').html(tr)
            $('#net-total-sales').html(numberFormat(totalNetSales))
            $('#total-cogs').html(numberFormat(totalCogs))
            $('#total-profit').html(numberFormat(totalProfit))
        }
    })
}

setDate = () => {
	yearSelect()
    let d = new Date()
    let month = (d.getMonth()+1).toString().padStart(2,0)
    let year = d.getFullYear()
    switch(doc_id) {
        case 'sales-report':
            $(`#start-month option[value="${month}"]`).prop('selected', true)
            let reportSpan = $('#report-span').val()
            let startMonth = month
            let startYear = year
        
            loadReport(reportSpan, startMonth, startYear)
            break
        case 'chart':
            $(`#daily-sales-month option[value="${month}"]`).prop('selected', true)
            $(`#monthly-sales-month option[value="${month}"]`).prop('selected', true)
            $(`#top-sales-month option[value="${month}"]`).prop('selected', true)

            dailySalesChart(month, year)
            monthlySalesChart(month, year)
            topSalesChart(month, year)
            break
    }


}

changeDate = () => {
    let reportSpan = $('#report-span').val()
    let startMonth = $('#start-month').val()
    let startYear = $('#start-year').val()
    loadReport(reportSpan, startMonth, startYear)
}

exportPdfSalesReport = (filePath, ext, joinIds = false) => {
    let docId = $('body').attr('id')
    let reportSpan = $('#report-span').val()
    let startMonth = $('#start-month').val()
    let startYear = $('#start-year').val()
    let query
    switch(reportSpan) {
        case 'annual':
            query = `select sales.*, sum(discount_final.total_discount_final) as discount_final from 
            (select annual_sales.date as date, sum(annual_sales.total) as total, sum(annual_sales.cogs) as cogs
            from 
            (select substr(sales_table.sales_date,1,7) as date, sales_table.total as total, sales_table.cogs as cogs
            from 
            (select date(input_date) as sales_date, sum(total) as total, sum((qty*cost_of_product)) as cogs
            from 
            sales where substr(date(input_date), 1, 7) between '${startYear}-${startMonth}' and '${endYear}-${endMonth}' group by sales_date) 
            as sales_table) 
            as annual_sales group by annual_sales.date) 
            as sales
            left join
            discount_final on sales.date = substr(date(discount_final.input_date),1,7)`
            break;
        case 'monthly':
            query = `select sales_table.*, sum(discount_final.total_discount_final) as discount_final from (select date(input_date) as date, sum(total) as total, sum((qty*cost_of_product)) as cogs from sales where substr(date(input_date), 1, 7) = '${startYear}-${startMonth}' group by date) as sales_table left join discount_final on sales_table.date = date(discount_final.input_date) group by date`
            break;
    }
    db.all(query, (err, rows) => {
        if(err) throw err
        let tr = ''
        let totalNetSales = 0
        let totalCogs = 0
        let totalProfit = 0
        let totalInfo = {}
        if(rows.length < 1) {
            tr = ''
            $('#data').html(tr)
            $('#net-total-sales').html("")
            $('#total-cogs').html("")
            $('#total-profit').html("")
        } else {
            rows.map( row => {
                let netSales = row.total-row.discount_final
                let profit = netSales - row.cogs
                totalNetSales+=netSales
                totalCogs+=row.cogs
                totalProfit+=profit
                tr += `<tr>
                            <td>${row.date}</td>
                            <td><span class="float-end">${numberFormat(row.total)}</span></td> 
                            <td><span class="float-end">${numberFormat(row.discount_final)}</span></td> 
                            <td><span class="float-end">${numberFormat(netSales)}</span></td> 
                            <td><span class="float-end">${numberFormat(row.cogs)}</span></td> 
                            <td><span class="float-end">${numberFormat(profit)}</span></td> 
                        </tr>`
            })
            let thead = ''
            totalInfo.totalNetSales = numberFormat(totalNetSales)
            totalInfo.totalCogs = numberFormat(totalCogs)
            totalInfo.totalProfit = numberFormat(totalProfit)
            ipcRenderer.send('load:to-pdf', thead, tr, filePath, totalInfo, docId, 'Laporan Penjualan')
        }
    })
}