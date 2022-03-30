import React, { useState } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { DataGrid } from '@mui/x-data-grid';
import { confirmAlert } from 'react-confirm-alert';
import { Button } from '@material-ui/core';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import CSVReader from 'react-csv-reader';
import '../css/Importer.css';
import axios from 'axios';
const settings = require('../settings.json')

function ImporterPage(props) {
    const { instance, accounts } = useMsal()
    const [importerType, setImporterType] = useState(0)
    //0 = asset, 1 = model, 2 = legal hold
    if (!props.permissions.use_importer && !props.isAdmin) return <Redirect to='/' />
    async function getTokenSilently() {
        const SilentRequest = { scopes: ['User.Read', 'TeamsActivity.Send'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true }
        let res = await instance.acquireTokenSilent(SilentRequest)
            .catch(async er => {
                if (er instanceof InteractionRequiredAuthError) {
                    return await instance.acquireTokenPopup(SilentRequest)
                } else {
                    console.log('Unable to get token')
                }
            })
        return res.accessToken
    }
    const handleButtonClick = async e => {
        let text = document.getElementById('csv-text').value
        if (!text) return
        let csv = []
        for (let i of text.split('\n')) {
            let t = i.split(',')
            if (importerType === 0) csv.push({ id: t[0], model_number: t[1] })
            else if (importerType === 1) csv.push({ id: t[0], name: t[1], device_type: t[2], manufacturer: t[3] })
            else if (importerType === 2) csv.push({ id: t[0] })
        }
        confirm(csv)
    }
    const handleData = (data, fileInfo) => {
        let csv = []
        if (importerType === 0) for (let i of data) csv.push({ id: i[0], model_number: i[1] })
        else if (importerType === 1) for (let i of data) csv.push({ id: i[0], name: i[1], device_type: i[2], manufacturer: i[3] })
        else if (importerType === 2) for (let i of data) csv.push({ id: i[0] })
        confirm(csv)
    }

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
                                    importerType === 2 ? legal_hold_columns : undefined}
                            rows={data}
                            disableSelectionOnClick
                            hideFooterSelectedRowCount
                            autoPageSize
                            onCellEditCommit={(e) => { for (let i in data) if (data[i].id === e.id) data[i][e.field] = e.value }}
                        />
                        <span style={{ margins: '1rem' }}>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e3de0067' }} onClick={() => {
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

    const sendData = async data => {
        let d = [...data]
        let token = await getTokenSilently()
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
            let res = await axios.post(`${settings.APIBase}/importer/${importerType === 0 ? 'asset' : importerType === 1 ? 'model' : importerType === 2 ? 'legal' : undefined}`, section, {
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
    return (
        <>
            <div className='ImporterArea'>
                <h1>CSV Format - {importerType === 0 ? 'Assets' :
                    importerType === 1 ? 'Models' :
                        importerType === 2 ? 'Legal Hold' : undefined}
                    {() => {
                        switch (importerType) {
                            case 1: return 'Models';
                            case 2: return 'Legal Hold';
                            default: return 'Assets';
                        }
                    }}</h1>
                <div style={{ display: 'inline-block', padding: '1rem' }}><h3 style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', padding: '1rem', backgroundColor: '#1b1b1b', borderRadius: '.5rem', fontFamily: 'Consolas, monaco, monospace' }}>
                    {importerType === 0 ? asset_columns.map(m => m.field).join(',') :
                        importerType === 1 ? model_columns.map(m => m.field).join(',') :
                            importerType === 2 ? legal_hold_columns.map(m => m.field).join(',') : undefined}
                </h3></div>
                <br />
                <h3>Do not include header row</h3>
                <hr style={{ marginTop: '2rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 100 }}>Select CSV File with Information</h3>
                <CSVReader cssClass="react-csv-input" onFileLoaded={handleData} />
                <hr />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 100 }}>Or Paste It</h3>
                <textarea id='csv-text' style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', width: '90%', height: '10rem', padding: '1rem', margin: '1rem', backgroundColor: '#1b1b1b', borderColor: 'white', borderWidth: '3px', color: 'white', fontSize: '16px', verticalAlign: 'top' }} />
                <br />
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }} onClick={e => handleButtonClick(e)}>Parse</Button>
                <hr style={{ marginTop: '2rem', marginBottom: '2rem' }} />
                {importerType === 0 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#524e00', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(0)}>
                    Switch to Asset Importer
                </Button>}
                {importerType === 1 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#524e00', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(1)}>
                    Switch to Model Importer
                </Button>}
                {importerType === 2 ? undefined : <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', backgroundColor: localStorage.getItem('accentColor') || '#524e00', marginLeft: '1rem', marginRight: '1rem' }}
                    onClick={e => setImporterType(2)}>
                    Switch to Legal Hold Importer
                </Button>}

                <br />
                <br />
                <br />
            </div>
            <PageTemplate highLight='7' disableSearch {...props} />
        </>
    )
}

export default ImporterPage

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