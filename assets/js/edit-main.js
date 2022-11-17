let doc_id
let id
ipcRenderer.on('res:form', (e, editDocId, editForm, rowId) => {
    $('#edit-form').html(editForm)
    doc_id = editDocId
    id = rowId
})

submitEditData = () => {
    switch(doc_id) {
        case 'product-data':
            submitEditPrdData(id)
            break;
    }
}

$('body').keydown(function(e) {
    if(e.keyCode === 13) {
        submitEditData()
    }
})