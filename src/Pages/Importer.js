// Imports
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { confirmAlert } from 'react-confirm-alert';
import { Button } from '@material-ui/core';
import { useMSAL } from '../Helpers/MSAL';
import CSVReader from 'react-csv-reader';
import axios from 'axios';

const settings = require('../settings.json')

function ImporterPage(props) {
    // Hooks and States
    const { token, tokenLoading } = useMSAL()
    const [importerType, setImporterType] = useState(0)

    //0 = asset, 1 = model, 2 = legal hold, 3 = parts

    // Return to home page if the user can't use this route
    if (!props.permissions.use_importer && !props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //

    // Parses the CSV text entry then prompts
    const handleButtonClick = async e => {
        let text = document.getElementById('csv-text').value
        if (!text) return
        let csv = []
        for (let i of text.split('\n')) {
            let t = i.split(',')
            if (importerType === 0) csv.push({ id: t[0], model_number: t[1] })
            else if (importerType === 1) csv.push({ id: t[0], name: t[1], device_type: t[2], manufacturer: t[3] })
            else if (importerType === 2) csv.push({ id: t[0] })
            else if (importerType === 3) csv.push({ id: t[0] })
            else if (importerType === 4) csv.push({ id: t[0], part_type: t[1], minimum_stock: t[2], models: t[3] })
        }
        confirm(csv)
    }

    // Handles CSV upload parsing, then prompts
    const handleData = (data, fileInfo) => {
        let csv = []
        if (importerType === 0) for (let i of data) csv.push({ id: i[0], model_number: i[1] })
        else if (importerType === 1) for (let i of data) csv.push({ id: i[0], name: i[1], device_type: i[2], manufacturer: i[3] })
        else if (importerType === 2) for (let i of data) csv.push({ id: i[0] })
        else if (importerType === 3) for (let i of data) csv.push({ id: i[0] })
        else if (importerType === 4) for (let i of data) csv.push({ id: i[0], part_type: i[1], minimum_stock: i[2], models: i[3] })
        confirm(csv)
    }

    // Handles confirming the CSV data
    const confirm = (data) => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className='confirm-alert'>
                        <h1>Confirm the data below</h1>
                        <p>Double click a cell to edit</p>
                        <br />
                        <DataGrid
                            className='grid'
                            columns={importerType === 0 ? asset_columns :
                                importerType === 1 ? model_columns :
                                    importerType === 2 ? legal_hold_columns :
                                        importerType === 3 ? parts_columns :
                                            importerType === 4 ? part_types_columns : undefined}
                            rows={data}
                            disableSelectionOnClick
                            hideFooterSelectedRowCount
                            autoPageSize
                            onCellEditCommit={(e) => { for (let i in data) if (data[i].id === e.id) data[i][e.field] = e.value }}
                        />
                        <span style={{ margins: '1rem' }}>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => {
                                sendData(data)
                                onClose()
                            }}
                            >Confirm</Button>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349' }} onClick={() => {
                                onClose()
                            }}>Go Back</Button>
                        </span>
                    </div>
                )
            }
        })
    }

    // Called by confirm function to send the data to the server in chunks
    const sendData = async data => {
        let d = [...data]
        let failed = []
        while (d.length > 0) {
            if (d.length <= 500) {
                let r = await req(d)
                d = []
                if (r.failed && r.failed.length > 0) failed = [...failed, ...r.failed]
                break
            } else {
                let sect = d.splice(0, 500)
                let r = await req(sect)
                if (r.failed && r.failed.length > 0) failed = [...failed, ...r.failed]
            }
        }
        async function req(section) {
            let res = await axios.post(`${settings.APIBase}/importer/${importerType === 0 ? 'asset' : importerType === 1 ? 'model' : importerType === 2 ? 'legal' : importerType === 3 ? 'parts' : importerType === 4 ? 'part_types' : undefined}`, section, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Authorization': `Bearer ${token}`,
                    'X-Version': 'ignore'
                }
            }).catch(er => { return { isErrored: true, error: er.response || er, failed: er.response && er.response.data && er.response.data.failed ? er.response.data.failed : [] } })
            if (res.isErrored) console.error(res.error)
            else res.failed = res.data && res.data.field ? res.data.failed : []
            return res
        }
        if (failed.length > 0)
            if (failed.length > 20) alert(`Many assets failed to import. See list in console: ctrl + shift + j`)
            else alert(`Some assets failed to import:${failed.map(m => { return `${m.id}: ${m.reason}` }).join('\n')}`)
        else alert('Successfully Imported')
    }

    // Render
    if (tokenLoading) return <></>
    return (
        <>
            <div className='ImporterArea'>
                <h1>CSV Format - {importerType === 0 ? 'Assets' :
                    importerType === 1 ? 'Models' :
                        importerType === 2 ? 'Legal Hold' :
                            importerType === 3 ? 'Parts' :
                                importerType === 4 ? 'Part Types' : undefined}</h1>
                <div style={{ display: 'inline-block', padding: '1rem' }}><h3 style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', padding: '1rem', backgroundColor: '#1b1b1b', borderRadius: '.5rem', fontFamily: 'Consolas, monaco, monospace' }}>
                    {importerType === 0 ? asset_columns.map(m => m.field).join(',') :
                        importerType === 1 ? model_columns.map(m => m.field).join(',') :
                            importerType === 2 ? legal_hold_columns.map(m => m.field).join(',') :
                                importerType === 3 ? parts_columns.map(m => m.field).join(',') :
                                    importerType === 4 ? part_types_columns.map(m => m.field).join(',') : undefined}
                </h3></div>
                <br />
                <h3>Do not include header row</h3>
                {importerType === 4 ? <h3>Seperate Models with "/" and only use space if it is in the model number</h3> : undefined}
                <hr style={{ marginTop: '2rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 100 }}>Select CSV File with Information</h3>
                <CSVReader cssClass="react-csv-input" onFileLoaded={handleData} />
                <hr />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 100 }}>Or Paste It</h3>
                <textarea id='csv-text' style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', width: '90%', height: '10rem', padding: '1rem', margin: '1rem', backgroundColor: '#1b1b1b', borderColor: 'white', borderWidth: '3px', color: 'white', fontSize: '16px', verticalAlign: 'top' }} />
                <br />
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={e => handleButtonClick(e)}>Parse</Button>
                <hr style={{ marginTop: '2rem', marginBottom: '2rem' }} />
                {importerType === 0 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#003994', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(0)}>
                    Asset Importer
                </Button>}
                {importerType === 1 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#003994', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(1)}>
                    Model Importer
                </Button>}
                {importerType === 3 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#003994', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(3)}>
                    Part Importer
                </Button>}
                {importerType === 2 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#003994', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(2)}>
                    Legal Hold Importer
                </Button>}
                {importerType === 4 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#003994', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(4)}>
                    Part Type Importer
                </Button>}
                <br />
                <br />
                <br />
            </div>
        </>
    )
}

export default ImporterPage

// --- Fields for each importer type --- //
const asset_columns = [
    { field: 'id', headerName: 'Asset Tag', width: 400, editable: true },
    { field: 'model_number', headerName: 'Model', width: 400, editable: true },
]

const model_columns = [
    { field: 'id', headerName: 'Model Number', width: 300, editable: true },
    { field: 'name', headerName: 'Name', width: 300, editable: true },
    { field: 'device_type', headerName: 'Device Type', width: 300, editable: true },
    { field: 'manufacturer', headerName: 'Manufacturer', width: 300, editable: true }
]

const legal_hold_columns = [
    { field: 'id', headerName: "Asset ID", 'width': 400, editable: true }
]

const parts_columns = [
    { field: 'id', headerName: 'Part Number', width: 400, editable: true }
]

const part_types_columns = [
    { field: 'id', headerName: 'Part Number', width: 250, editable: true },
    { field: 'part_type', headerName: 'Part Type', width: 250, editable: true },
    { field: 'minimum_stock', headerName: 'Minimum Stock', width: 200, editable: true },
    { field: 'models', headerName: 'Model(s) - \'/\' Seperated', width: 400, editable: true }
]