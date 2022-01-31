import React, { useState, useEffect, useRef } from 'react';
import { Redirect } from 'react-router'
import PageTemplate from './Template'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import '../css/Reports.css'
import CircularProgress from '@mui/material/CircularProgress';
import { Button } from '@material-ui/core';
import { LineChart } from 'react-chartkick'
import 'chartkick/chart.js'
import axios from 'axios';
import { CSVLink } from "react-csv";
import ReportService from '../Services/Report'
const settings = require('../settings.json')

function ReportsPage(props) {
    const [date, setDate] = useState(Date.now())
    const [data, setData] = useState([])
    const [graphDate, setGraphDate] = useState({ from: getDateSubtractMonth(date), to: getDate(date) })
    const [loading, setLoading] = useState(true)
    const [lineChartData, setLineChartData] = useState({})
    const [onUser, setOnUser] = useState(null)
    const { instance, accounts } = useMsal()
    const [reportData, setReportData] = useState([])
    const [fileName, setFileName] = useState(null)
    const reportRef = useRef(null)
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { sendReq() }, [onUser, graphDate, date])
    useEffect(() => {
        if (reportRef && reportRef && reportRef.current && reportRef.current.link) {
            setTimeout(() => {
                reportRef.current.link.click()
                setReportData([])
                setFileName(null)
            });
        }
    }, [reportData]);


    if (!props.permissions.view_reports && !props.isAdmin) return <Redirect to='/' />

    async function sendReq(doSetLoading = true) {
        if (doSetLoading) setLoading(true)
        let t = await getTokenSilently()
        let url = onUser ? `${settings.APIBase}/reports/user/${onUser}/${getDate(date)}` : `${settings.APIBase}/reports/users/daily/${getDate(date)}`
        let graphUrl = onUser ? `${settings.APIBase}/reports/graph/user/${onUser}/${graphDate.from}/${graphDate.to}` : null
        const response = await fetch(url, {
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${t}`,
                'Access-Control-Allow-Origin': '*'
            }
        }).catch(er => { return { isErrored: true, error: er.response } })
        if (response.isErrored) return console.log(response.error)
        const data = await response.json();
        let lineReq
        if (onUser) {
            lineReq = await axios.get(graphUrl, { headers: { 'Authorization': `Bearer ${t}` } })
                .catch(er => { return { isErrored: true, error: er.response } })
            if (lineReq.isErrored) return console.log(response.error)
            lineReq = lineReq.data
        }
        setData(data)
        setLineChartData(lineReq)
        setLoading(false)
    }

    const handleDateChange = (e) => {
        setDate(document.getElementById('date_selector').value)
    }

    const handleGraphDateChange = e => {
        setGraphDate({
            from: document.getElementById('from_selector').value,
            to: document.getElementById('to_selector').value
        })
    }

    const handleUserClick = (e, id) => {
        setOnUser(id)
        setLoading(true)
    }

    const handleBackClick = () => {
        setData([])
        setOnUser(null)
        setLoading(true)
    }

    const getCSVData = () => {
        let csvData = []
        if (onUser) {
            if (!data['Daily Dollars']) return ['error']
            csvData.push(['type', 'value'])
            csvData.push(['userid', onUser])
            for (let i in data) {
                if (typeof (data[i]) === 'object') {
                    csvData.push([`${i}-${data[i].is_hourly ? 'hours' : 'count'}`, data[i].count])
                    csvData.push([`${i}-$`, data[i].dd])
                } else {
                    csvData.push([i, data[i]])
                }
            }
        } else {
            csvData.push(['name', 'dailydollars'])
            for (let i of data) {
                csvData.push([i.name, i.dailydollars || 0])
            }
        }
        return csvData
    }

    const getReport = async (e, timeframe, to) => {
        if (timeframe === to) to = undefined
        let t = await getTokenSilently()
        setFileName(`${timeframe}-Report.csv`)
        let d = await ReportService.generateReport(t, timeframe, to)
        if (d.isErrored) {
            setFileName(null)
            alert(d.error)
        } else {
            if (d.data.length === 0) return alert('No data to pull, try custom range if you are looking for friday.')
            setReportData(d.data)
        }
    }

    const getAssetSummary = async (e, timeframe, to) => {
        if (timeframe === to) to = undefined
        let t = await getTokenSilently()
        setFileName(`${timeframe}-AS.csv`)
        let d = await ReportService.generateAssetSummary(t, timeframe, to)
        if (d.isErrored) {
            setFileName(null)
            alert(d.error)
        } else {
            if (d.data.length === 0) return alert('No data to pull, try custom range if you are looking for friday.')
            setReportData(d.data)
        }
    }


    const getGraphCSVData = () => {
        if (!lineChartData || lineChartData === {}) return [['error'], ['error']]
        const csvData = [['date', 'dailydollars']]
        for (let i in lineChartData)
            csvData.push([i.substring(0, 15), lineChartData[i]])
        return csvData
    }

    function renderUserRow(row) {
        let grad = row.dailydollars / 650 < 1 ? `linear-gradient(90deg, ${localStorage.getItem('accentColor') || '#524e00'} 0%, ${blendColors(localStorage.getItem('accentColor') || '#524e00', '#1b1b1b', .95)} ${row.dailydollars / 650 * 100 || 0}%, #1b1b1b ${Math.floor(((row.dailydollars / 650 * 100) + 100) / 2)}%, #1b1b1b 100%)` : localStorage.getItem('accentColor') || '#524e00'
        return <div key={row.name} className='UserReport' style={{ background: grad }} onClick={e => handleUserClick(e, row.id)}>
            <h1>{row.name}</h1>
            <h1>${row.dailydollars}</h1>
        </div>
    }

    function renderSingleUserRow(k, v) {
        let accent = localStorage.getItem('accentColor') || '#524e00'
        return (
            <div key={k} className='UserReport' style={{ cursor: 'default', background: k === 'Daily Dollars' ? parseInt(v) / 650 < 1 ? `linear-gradient(90deg, ${accent} 0%, ${blendColors(accent, '#1b1b1b', .95)} ${parseInt(v) / 650 * 100 || 0}%, #1b1b1b ${Math.floor(((parseInt(v) / 650 * 100) + 100) / 2)}%, #1b1b1b 100%)` : accent : 'inherit' }}>
                <h1>{k.replace('ppd_', '').replace('hrly_', '')}</h1>
                <h1>{k === 'Daily Dollars' ? `$${v}` : `${v.is_hourly ? `${v.count} ${v.count > 1 ? `hours` : `hour`}` : `${v.count}`}`}</h1>
                {k !== 'Daily Dollars' ? <h1>${v.dd}</h1> : <></>}
            </div >)
    }

    if (loading) return (<>
        <div className='AssetArea'>
            <div className='UserReports'>
                <CircularProgress size='10rem' />
            </div>
            <div className='UserReports'>
                <CircularProgress size='10rem' />
            </div>
        </div>
        <PageTemplate highLight='3' disableSearch {...props} />
    </>
    )
    return (<>
        <div className='TopNav'>
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }} onClick={() => handleBackClick()}>Back</Button>
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(removeDay(date)) }}>navigate_before</i>
                <input type='date' className='ReportDate' id='date_selector' value={getDate(date)} onChange={() => handleDateChange()} />
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(addDay(date)) }}>navigate_next</i>
            </div>
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }} onClick={() => { props.history.push('/asset', { isReport: true, uid: onUser, date }) }}>View Asset Tracker</Button>
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }} onClick={() => { props.history.push('/hourly', { isReport: true, uid: onUser, date }) }}>View Hourly Tracker</Button>
            <CSVLink filename={`${date}-EXPORT.csv`} target='_blank' data={getCSVData()}><Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#524e00' }} >Download CSV</Button></CSVLink>
        </div >
        <div className='AssetArea'>
            {onUser ?
                <>
                    <div className='UserReports'>
                        {Object.keys(data).map(k => renderSingleUserRow(k, data[k]))}
                    </div>
                    <div className='UserReports' style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                            <input type='date' className='ReportDate' id='from_selector' value={graphDate.from} onChange={(e) => handleGraphDateChange(e)} />
                            <input type='date' className='ReportDate' id='to_selector' value={graphDate.to} onChange={(e) => handleGraphDateChange(e)} />
                        </div>
                        <LineChart data={lineChartData} prefix="$" colors={[localStorage.getItem('accentColor') || '#e3de00']} />
                        <CSVLink filename={`${date}-EXPORT.csv`} target='_blank' data={getGraphCSVData()}><Button variant='contained' color='primary' size='large' style={{ marginTop: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }} >Download CSV</Button></CSVLink>
                    </div>
                </> : <>
                    <div className='UserReports'>
                        {data ?
                            data.map(m => renderUserRow(m))
                            : <></>}
                    </div>
                    <div className='UserReports'>
                        <h1 style={{ padding: '1rem', paddingTop: '2rem' }}>Reports Section</h1>
                        {reportData.length > 0 ? <CSVLink filename={fileName} target='_blank' data={reportData} ref={reportRef}></CSVLink> : undefined}
                        <h2>Today - {getDate(date).substring(5).replace('-', '/')}</h2>
                        <br />
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }}
                            onClick={e => {
                                setFileName(`${getDate(date)}-Report.csv`); getReport(e, getDate(date))
                            }}>Download Report</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }}
                            onClick={e => {
                                setFileName(`${getDate(date)}-AS.csv`); getAssetSummary(e, getDate(date))
                            }}>Download Asset Summary</Button>
                        <hr />
                        <h2>Yesterday - {getDateSubtractDay(date).substring(5).replace('-', '/')}</h2>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }}
                            onClick={e => {
                                setFileName(`${getDateSubtractDay(date)}-Report.csv`); getReport(e, getDateSubtractDay(date))
                            }}>Download Report</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }}
                            onClick={e => {
                                setFileName(`${getDateSubtractDay(date)}-AS.csv`); getAssetSummary(e, getDateSubtractDay(date))
                            }}>Download Asset Summary</Button>
                        <hr />
                        <h2>Custom Date Range</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                            <input type='date' className='ReportDate' id='from_selector' value={graphDate.from} onChange={(e) => handleGraphDateChange(e)} />
                            <input type='date' className='ReportDate' id='to_selector' value={graphDate.to} onChange={(e) => handleGraphDateChange(e)} />
                        </div>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }}
                            onClick={e => {
                                setFileName(`${getDate(graphDate.from)}-${getDate(graphDate.to)}-Report.csv`); getReport(e, getDate(graphDate.from), getDate(graphDate.to))
                            }}>Download Report</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }}
                            onClick={e => {
                                setFileName(`${getDate(graphDate.from)}-${getDate(graphDate.to)}-AS.csv`); getAssetSummary(e, getDate(graphDate.from), getDate(graphDate.to))
                            }}>Download Asset Summary</Button>
                        {props.tsheetsBearer ? undefined : <>
                            <hr />
                            <h2>Sign in to T-Sheets</h2>
                            <Button variant='contained' color='primary' size='large' href={`https://rest.tsheets.com/api/v1/authorize?response_type=code&client_id=${settings.tsheets.clientId}&redirect_uri=${settings.tsheets.redirectURI}&state=login`}
                                style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524e00' }}>
                                <img src='https://res.cloudinary.com/compter-pros-on-call/image/upload/v1643650072/qb_chypxi.svg' alt='tsheets icon' style={{ maxHeight: '4rem', margin: '-1rem' }} />
                            </Button>
                        </>
                        }
                    </div>
                </>
            }
        </div>

        <PageTemplate highLight='3' disableSearch {...props} />
    </>)
}

export default ReportsPage

function getDate(date) {
    date = new Date(date)
    return date.toISOString().split('T')[0]
}

function getDateSubtractMonth(date) {
    date = new Date(date)
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
}

function getDateSubtractDay(date) {
    date = new Date(date)
    date.setDate(date.getDate() - 1)
    return date.toISOString().split('T')[0]
}

function addDay(date) {
    date = new Date(date)
    date.setTime(date.getTime() + 86400000)
    return date.toISOString().split('T')[0]
}

function removeDay(date) {
    date = new Date(date)
    date.setTime(date.getTime() - 86400000)
    return date.toISOString().split('T')[0]
}

function blendColors(colorA, colorB, amount) {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
}