blankForm = () => {
    $('#name').val("")
    $('#address').val("")
    $('#website').val("")
    $('#telp-one').val("")
    $('#telp-two').val("")
    $('#email').val("")
    $('#name').focus()
}

addBuyerData = () => {
    let name = $('#name').val()
    let address = $('#address').val()
    let website = $('#website').val()
    let telpOne = $('#telp-one').val()
    let telpTwo = $('#telp-two').val()
    let email = $('#email').val()

    let queryInsert = `insert into buyers(name, address, website, telp_one, telp_two, email) values('${name}','${address}','${website}','${telpOne}','${telpTwo}', '${email}')`
    let queryCheck = `select count(*) as row_number from buyers where name ='${name}'`
    if(name != "") {
        db.all(queryCheck, (err, row) => {
            if(err) throw err
            let rowNum = parseInt(row[0].row_number)
            console.log(rowNum)
            if(rowNum < 1) {
                db.run(queryInsert, err => {
                    if(err) throw err
                    dialog.showMessageBoxSync(
                        {
                            title: 'Success',
                            message: 'Succesfully add buyer data'
                        }
                    )
                    blankForm()
                })
            } else {
                dialog.showMessageBoxSync(
                    {
                        title: 'Alert',
                        type: 'info',
                        message: 'Buyer name has already existed in the database, try to use another name'
                    }
                )
            }
        })
    } else {
        dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Nama buyer/customer harus diisi'
            }
        )
    }
}

$(document).keydown(function(e) {
    if(e.keyCode == 13) {
        addBuyerData()
    }
})