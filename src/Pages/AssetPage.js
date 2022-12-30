// Imports
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMSAL } from '../Helpers/MSAL';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@material-ui/core';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';
import settings from '../settings.json'

function AssetsPage(props) {
    // States, Hooks, and MSAL
    let APILink = `${settings.APIBase}/asset`
    const { token, tokenLoading } = useMSAL()
    const [catalog, setCatalog] = useState([])
    const [job_codes, setJobCodes] = useState(null)
    const [onCatalog, setOnCatalog] = useState(false)
    const [assetOverview, setAssetOverview] = useState([])
    const [generatingReport, setGeneratingReport] = useState(false)
    const [customReportOptions, setCustomReportOptions] = useState({})
    const [customReportSelected, setCustomReportSelected] = useState({ attributes: new Set(), status: new Set(), type: new Set(), last_updated: new Set(), location: new Set(), locked: new Set(), user: new Set(), job_code: new Set() })
    const [doUpdate, setDoUpdate] = useState(false)
    const nav = useNavigate()

    const reportAuth = !!(props.permissions.view_reports || props.isAdmin)
    const buttonStyle = { backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '.5rem' }

    // Effects
    useEffect(() => { // Gets job codes and catalog of assets
        if (!token) return
        if (!job_codes) getJobCodes()
        if (onCatalog || !reportAuth) getCatalog()
        if (reportAuth) getAssetOverview()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onCatalog, token])

    // Returns to home page if user can't access this page
    if (!props.permissions.view_assets && !props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //
    async function getJobCodes() {
        const response = await fetch(`${settings.APIBase}/job/full`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        let jc = {}
        for (let i of data.job_codes) { jc[i.id] = i.job_name }
        setJobCodes(jc)
    }

    async function getCatalog() {
        let res = await axios.post(`${APILink}/catalog`, {
            offset: 0,
            limit: null,
            orderBy: 'model_number'
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        })
        if (res.isErrored) return console.log(res)
        setCatalog(res.data.records)
    }

    async function getAssetOverview() {
        const response = await fetch(`${settings.APIBase}/asset/overview`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        setAssetOverview(data.overview)
        setCustomReportOptions(data.customReportOptions)
    }

    const generateReport = async (options = customReportSelected) => {
        setGeneratingReport(true)
        console.log(options)
        let res = await axios.post(`${APILink}/report`, {
            attributes: [...options.attributes],
            status: [...options.status].map(m => [...m.match(/\(([^()]+)\)/g)].pop().replace(/[()]/g, '')),
            type: [...options.type],
            last_updated: [...options.last_updated],
            location: [...options.location],
            locked: [...options.locked],
            user: [...options.user].map(m => [...m.match(/\(([^()]+)\)/g)].pop().replace(/[()]/g, '')),
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        })
        setGeneratingReport(false)
        if (res.isErrored) return console.log(res)
        if (res.data.assets.length === 0) return alert('No assets match your criteria. Please try again.')
        let csv = Object.keys(res.data.assets[0]).join(',')
        for (let i of res.data.assets) {
            csv += '\n'
            csv += Object.values(i).map(m => m ? `${m}`.replace(/,/g, '.').replace(/\n/g, ' ').replace(/\r/g, '') : m).join(',')
        }
        let blob = new Blob([csv], { type: 'text/csv' })
        let link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        link.download = 'report.csv'
        link.click()
    }

    // -- Renderers -- //

    const renderAssetGrid = () => {
        return <div className='AssetGridArea'>
            <DataGrid
                className='Grid'
                columns={columns}
                loading={!catalog.length}
                rows={catalog}
                disableSelectionOnClick
                hideFooterSelectedRowCount
                autoPageSize
                onCellClick={(params, e) =>
                    e.ctrlKey ? window.open(`/search?q=${params.id}&ao=1`, '_blank')
                        : nav(`/search?q=${params.id}`, { state: { assetOnly: true } })
                }
                style={{ cursor: 'pointer' }}
            />
        </div>
    }

    const renderCustomReport = () => {
        if (!Object.keys(customReportOptions).length) return <CircularProgress size='48px' />
        return <><div style={{ display: 'table', width: '95%' }}>
            <div style={{ width: '50%', float: 'left' }}>
                <h3>Attributes to Retrieve</h3>
                <div style={{ margin: '.5rem auto .5rem', width: '90%', maxHeight: '10rem', overflow: 'scroll', backgroundColor: '#1b1b1b92', padding: '.5rem', borderRadius: '.5rem' }}>
                    {renderCheckBoxRow('All', 'attributes')}
                    {customReportOptions.attributes.map(i => renderCheckBoxRow(i, 'attributes'))}
                </div>
            </div>
            <div style={{ width: '50%', float: 'right' }}>
                <h3>Status</h3>
                <div style={{ margin: '.5rem auto .5rem', width: '90%', maxHeight: '10rem', overflow: 'scroll', backgroundColor: '#1b1b1b92', padding: '.5rem', borderRadius: '.5rem' }}>
                    {renderCheckBoxRow('All', 'status')}
                    {customReportOptions.status.map(i => renderCheckBoxRow(i, 'status'))}
                </div>
            </div>
        </div>
            <div style={{ display: 'table', width: '95%' }}>
                <div style={{ width: '50%', float: 'left' }}>
                    <h3>Device Type</h3>
                    <div style={{ margin: '.5rem auto .5rem', width: '90%', maxHeight: '10rem', overflow: 'scroll', backgroundColor: '#1b1b1b92', padding: '.5rem', borderRadius: '.5rem' }}>
                        {renderCheckBoxRow('All', 'type')}
                        {customReportOptions.type.map(i => renderCheckBoxRow(i, 'type'))}
                    </div>
                </div>
                <div style={{ width: '50%', float: 'right' }}>
                    <h3>Last Updated</h3>
                    <div style={{ margin: '.5rem auto .5rem', width: '90%', maxHeight: '10rem', overflow: 'scroll', backgroundColor: '#1b1b1b92', padding: '.5rem', borderRadius: '.5rem' }}>
                        {customReportOptions.last_updated.map(i => renderCheckBoxRow(i, 'last_updated'))}
                    </div>
                </div>
            </div>
            <div style={{ display: 'table', width: '95%' }}>
                <div style={{ width: '50%', float: 'left' }}>
                    <h3>Location</h3>
                    <div style={{ margin: '.5rem auto .5rem', width: '90%', maxHeight: '10rem', overflow: 'scroll', backgroundColor: '#1b1b1b92', padding: '.5rem', borderRadius: '.5rem' }}>
                        {renderCheckBoxRow('All', 'location')}
                        {customReportOptions.location.map(i => renderCheckBoxRow(i, 'location'))}
                    </div>
                </div>
                <div style={{ width: '50%', float: 'right' }}>
                    <h3>Locked</h3>
                    <div style={{ margin: '.5rem auto .5rem', width: '90%', maxHeight: '10rem', overflow: 'scroll', backgroundColor: '#1b1b1b92', padding: '.5rem', borderRadius: '.5rem' }}>
                        {renderCheckBoxRow('All', 'locked')}
                        {customReportOptions.locked.map(i => renderCheckBoxRow(i, 'locked'))}
                    </div>
                </div>
            </div>
            <div style={{ display: 'table', width: '95%' }}>
                <div style={{ width: '50%', float: 'left' }}>
                    <h3>Edited By User</h3>
                    <div style={{ margin: '.5rem auto .5rem', width: '90%', maxHeight: '10rem', overflow: 'scroll', backgroundColor: '#1b1b1b92', padding: '.5rem', borderRadius: '.5rem' }}>
                        {renderCheckBoxRow('All', 'user')}
                        {customReportOptions.user.map(i => renderCheckBoxRow(i, 'user'))}
                    </div>
                </div>
            </div>
            <br />
            <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={buttonStyle} onClick={() => generateReport()}>Generate</Button>
        </>
    }

    const renderCheckBoxRow = (row, sector) => {
        return <span style={{ display: 'inline-flex', width: '95%' }} key={`${row}-${sector}`}>
            <Checkbox
                checked={customReportSelected[sector].has(row)}
                borderWidth='2px'
                borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                style={{ cursor: 'pointer', display: 'inline', float: 'left' }}
                size='15px'
                icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={36} />}
                onChange={e => {
                    let temp = customReportSelected
                    if (row === 'All') {
                        if (e) { temp[sector] = new Set([...customReportOptions[sector]]) }
                        else temp[sector] = new Set()
                    } else {
                        if (e) temp[sector].add(row)
                        else temp[sector].delete(row)
                    }
                    setCustomReportSelected(temp)
                    setDoUpdate(!doUpdate)
                }} />
            <p style={{ display: 'inline', float: 'left', margin: '0.3rem 0.5rem 0.3rem' }}>{row}</p>
        </span>
    }

    const renderOverviewLine = (row) => {
        return <div key={row.name} className='UserReport' style={{ background: localStorage.getItem('accentColor') || '#e67c52', cursor: 'default' }} >
            <h1>{row.name}</h1>
            <h1>{row.value}</h1>
        </div>
    }

    // Constant for the columns of the data grid
    const columns = [
        { field: 'id', headerName: 'Asset Tag', width: 250 },
        { field: 'status', headerName: 'Status', width: 300, valueGetter: params => job_codes[params.value] || params.value },
        { field: 'model_number', headerName: 'Model', width: 300 },
        { field: 'company', headerName: 'Company', width: 200 },
        { field: 'notes', headerName: 'Notes', width: 800 }
    ]

    // Renders the page
    if (tokenLoading || (!reportAuth && !catalog.length)) return <></>
    return (
        <>
            {reportAuth ?
                onCatalog ? <>
                    <div className='TopNav'>
                        <Button variant='contained' color='primary' size='large' style={buttonStyle} onClick={() => setOnCatalog(false)}>Back</Button>
                    </div>
                    {renderAssetGrid()}
                </> :
                    <div className='AssetArea'>
                        <div className='UserReports' style={{ padding: '1rem' }}>
                            <h1>Asset Overview</h1>
                            <hr style={{ width: '95%' }} />
                            <Button variant='contained' color='primary' size='large' style={buttonStyle} onClick={() => {
                                setOnCatalog(true)
                            }}>View Catalog</Button>
                            {assetOverview ? assetOverview.map(row => renderOverviewLine(row)) : undefined}
                        </div>
                        <div className='UserReports' style={{ padding: '1rem' }}>
                            <h1>Reports</h1>
                            <hr style={{ width: '95%' }} />
                            <h2>Preset Reports</h2>
                            <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={buttonStyle} onClick={() => {
                                generateReport(presetReports['In House'])
                            }}>In House Assets</Button>
                            <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={buttonStyle} onClick={() => {
                                generateReport(presetReports['All'])
                            }}>All Assets</Button>
                            <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={buttonStyle} onClick={() => {
                                generateReport(presetReports['All With History'])
                            }}>All Assets With Tracking History</Button>
                            <hr style={{ width: '95%' }} />
                            <h2>Custom Report</h2>
                            {renderCustomReport()}
                        </div>
                    </div>
                : renderAssetGrid()
            }
        </>
    )
}

export default AssetsPage

const presetReports = {
    'In House': {
        attributes: new Set(),
        status: new Set(['(2)', '(8)', '(12)', '(13)', '(15)', '(18)', '(19)', '(39)', '(40)', '(41)', '(42)', '(43)', '(50)', '(51)', '(97)', '(108)', '(121)']),
        type: new Set(),
        last_updated: new Set(['All Time']),
        location: new Set(['In-House']),
        locked: new Set(),
        user: new Set(),
        job_code: new Set()
    },
    'All': {
        attributes: new Set(),
        status: new Set(),
        type: new Set(),
        last_updated: new Set(),
        location: new Set(),
        locked: new Set(),
        user: new Set(),
        job_code: new Set()
    },
    'All With History': {
        attributes: new Set(),
        status: new Set(),
        type: new Set(),
        last_updated: new Set(['All Time']),
        location: new Set(),
        locked: new Set(),
        user: new Set(),
        job_code: new Set()
    }
}