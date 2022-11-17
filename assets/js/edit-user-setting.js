submitAdmin = () => {
    let firstName = $('#first-name').val()
    let lastName = $('#last-name').val()
    let position = $('#position').val()
    let userName = $('#username').val()
    let password = $('#password').val()

    if(firstName == "" || lastName == "" || position == "" || userName == "" || password == "") {
        dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Semua input harus diisi'
            }
        )
    } else {
        db.all(`select * from users where username = '${userName}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                db.run(`insert into users(first_name, last_name, position, username, password, access_level) values('${firstName}', '${lastName}', '${position}', '${userName}', '${password}', 'admin')`, err => {
                    if(err) throw err
                    ipcRenderer.send('success:update-user')
                })
            } else {
                dialog.showErrorBox('Username exists','Username sudah dipakai oleh user yang lain, silahkan gunakan username yang berbeda')
            }
        })
    }

}

submitEditUsername = (username, id) => {
    let newUsername = $('#new-username').val()
    if(newUsername == "") {
        dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Username baru harus diisi'
            }
        )
    } else if(newUsername == username) {
        ipcRenderer.send('success:update-user')
    } else {
        db.all(`select * from users where username = '${newUsername}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                db.run(`update users set username = '${newUsername}' where id = ${id}`, err => {
                    if(err) throw err
                    ipcRenderer.send('success:update-user')
                })
            } else {
                dialog.showErrorBox('Username exists', 'Username sudah dipakai oleh user yang lain, silahkan gunakan username yang berbeda')
            }
        })
    }
}

submitEditPassword = (id) => {
    let prevPassword = $('#prev-password').val()
    let newPassword = $('#new-password').val()
    if(prevPassword == "" || newPassword == "") {
        dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Password saat ini dan password baru harus diisi'
            }
        )
    } else {
        db.all(`select * from users where id = ${id} and password = '${prevPassword}'`, (err, row) => {
            if(err) throw err
            if(row.length < 1) {
                dialog.showErrorBox('Invalid Password', 'Password is invalid')
            } else {
                db.run(`update users set password = '${newPassword}' where id = ${id}`, err => {
                    if(err) throw err
                    ipcRenderer.send('success:update-user')
                })
            }
        })
    }
}

submitEditProfile = (id) => {
    let firstName = $('#first-name').val()
    let lastName = $('#last-name').val()
    let position = $('#position').val()
    let phoneNumber = $('#phone-number').val()
    let employeeNumber = $('#employee-number').val()
    let employementStatus = $('#status').val()

    if(firstName == "" || lastName == "" || position == "") {
        dialog.showMessageBoxSync(
            {
                title: 'Alert',
                type: 'info',
                message: 'Nama depan, nama akhir, dan posisi harus diisi'
            }
        )
    } else {
        db.run(`update users set first_name = '${firstName}', last_name='${lastName}', position='${position}', phone_number='${phoneNumber}', employee_number='${employeeNumber}', status='${employementStatus}' where id = ${id}`, err => {
            if(err) throw err
            ipcRenderer.send('success:update-user')
        })
    }
}