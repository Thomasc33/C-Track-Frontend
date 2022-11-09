// Imports
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom'
import { useMSAL } from '../Helpers/MSAL';
import { formatAMPM } from './Asset';
import { CSVLink } from "react-csv";
import { Button } from '@material-ui/core';
import { LineChart } from 'react-chartkick'
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import ReportService from '../Services/Report'
import writeXlsxFile from 'write-excel-file'
import 'chartkick/chart.js'

const settings = require('../settings.json')

function ReportsPage(props) {
    // Hooks 
    const { token, tokenLoading } = useMSAL()
    const reportRef = useRef(null)
    const nav = useNavigate()

    // States
    const [date, setDate] = useState(Date.now())
    const [data, setData] = useState([])
    const [graphDate, setGraphDate] = useState({ from: getDateSubtractMonth(date), to: getDate(date) })
    const [loading, setLoading] = useState(true)
    const [lineChartData, setLineChartData] = useState({})
    const [onUser, setOnUser] = useState(null)
    const [reportData, setReportData] = useState([])
    const [generatingReport, setGeneratingReport] = useState(false)
    const [tsheetsData, setTsheetsData] = useState([])
    const [userNames, setUserNames] = useState({}) // id: name


    // Effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (token) sendReq() }, [onUser, graphDate, date, token]) // Updates data when user, graph dates, or date changes
    useEffect(() => { // Programmatic workaround to download CSV data when clicked (i think)
        if (reportRef && reportRef && reportRef.current && reportRef.current.link) {
            setTimeout(() => {
                reportRef.current.link.click()
                setReportData([])
            });
        }
    }, [reportData]);

    // Returns to home page if user can't access this route
    if (!props.permissions.view_reports && !props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //
    // Sends request to get data
    async function sendReq(doSetLoading = true) {
        if (doSetLoading) setLoading(true)
        let url = onUser ? `${settings.APIBase}/reports/user?uid=${onUser}&date=${getDate(date)}` : `${settings.APIBase}/reports/users/daily?date=${getDate(date)}`
        let graphUrl = onUser ? `${settings.APIBase}/reports/graph/user?uid=${onUser}&from=${graphDate.from}&to=${graphDate.to}` : null
        const response = await fetch(url, {
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        }).catch(er => { return { isErrored: true, error: er.response } })
        if (response.isErrored) return console.log(response.error)
        const data = await response.json();
        setData(data)
        setLoading(false)
        let lineReq, tsheets = []
        if (onUser) {
            lineReq = await axios.get(graphUrl, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
                .then(lr => lr.data)
                .catch(er => { return { isErrored: true, error: er.response } })
            if (lineReq.isErrored) return console.log(response.error)
            setLineChartData(lineReq)

            tsheets = await ReportService.getTsheetsData(onUser, getDate(date), token)
            if (tsheets.length) setTsheetsData(tsheets)
        }
        let names = { ...userNames }
        if (data && data.length) for (let i of data) names[i.id] = i.name
        setUserNames(names)
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
        setTsheetsData([])
        setOnUser(null)
        setLoading(true)
    }

    const getCSVData = () => {
        let csvData = []
        if (onUser) {
            if (!data['Daily Dollars']) return [['No Counts for this day']]
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

    const getAssetSummary = async (e, timeframe, to) => {
        if (timeframe === to) to = undefined
        let d = await ReportService.generateAssetSummary(token, timeframe, to)
        if (d.isErrored) {
            alert(d.error)
        } else {
            await writeXlsxFile(d.data, {
                columns: d.columns,
                fileName: `Asset Summary ${timeframe}${to ? `-${to}` : ''}.xlsx`,
                stickyRowsCount: 1
            })
        }
    }

    const getHourlySummary = async (e, timeframe, to) => {
        if (timeframe === to) to = undefined
        let d = await ReportService.generateHourlySummary(token, timeframe, to)
        if (d.isErrored) {
            alert(d.error)
        } else {
            await writeXlsxFile(d.data, {
                columns: d.columns,
                fileName: `Hourly Summary ${timeframe}${to ? `-${to}` : ''}.xlsx`,
                stickyRowsCount: 1
            })
        }
    }

    const getJobSummary = async (type) => {
        let d = await ReportService.getJobCodeSummary(token, type)
        if (d.isErrored) {
            alert(d.error)
        } else {
            if (d.data.length === 0) return alert('No data to pull')
            await writeXlsxFile(d.data, {
                columns: d.columns,
                fileName: `Job Summary.xlsx`,
                stickyColumnsCount: 1,
                stickyRowsCount: 4
            })
        }
    }

    const getExcelReport = async (e, to = new Date().toISOString().split('T')[0], from = null) => {
        setGeneratingReport(true)
        let res = await axios.get(`${settings.APIBase}/reports/excel?to=${to}${from ? `&from=${from}` : ''}`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .then(d => d.data)
            .catch(e => { console.warn(e.response); return { isErrored: true, error: e.response.data } })
        if (!res.isErrored)
            await writeXlsxFile(res.data, {
                columns: res.columns,
                fileName: `${to}-${from ? `>${from} - ` : ''}Report.xlsx`
            })
        setGeneratingReport(false)

    }

    const getGraphCSVData = () => {
        if (!lineChartData || lineChartData === {}) return [['error'], ['error']]
        const csvData = [['date', 'dailydollars']]
        for (let i in lineChartData)
            csvData.push([i.substring(0, 15), lineChartData[i]])
        return csvData
    }

    const getTotal = () => {
        let tot = 0
        for (let i of data) if (i.dailydollars) tot += i.dailydollars
        return tot
    }

    // --- Renderers --- //
    function renderUserRow(row) {
        let grad = row.dailydollars / 650 < 1 ? `linear-gradient(90deg, ${localStorage.getItem('accentColor') || '#e67c52'} 0%, ${blendColors(localStorage.getItem('accentColor') || '#00c6fc67', '#1b1b1b', .95)} ${row.dailydollars / 650 * 100 || 0}%, #1b1b1b ${Math.floor(((row.dailydollars / 650 * 100) + 100) / 2)}%, #1b1b1b 100%)` : localStorage.getItem('accentColor') || '#00c6fc67'
        return <div key={row.name} className='UserReport' style={{ background: grad }} onClick={e => handleUserClick(e, row.id)}>
            <h1>{row.name}</h1>
            <h1>${row.dailydollars}</h1>
        </div>
    }

    function renderTsheetsRow(row) {
        let price = 0, isHourly, hrlyGoal
        if (row.job && row.job.price) { price = row.job.price; isHourly = row.job.is_hourly }
        else if (row.altJob && row.altJob.price) { price = row.altJob.price; isHourly = row.altJob.is_hourly }

        if (row.job && row.job.hourly_goal) hrlyGoal = row.job.hourly_goal
        else if (row.altJob && row.altJob.hourly_goal) hrlyGoal = row.altJob.hourly_goal

        return <div key={row.id} className='UserReport' style={{ cursor: 'default', flexWrap: 'wrap' }}>
            <h1>{row.job ? row.job.job_name : row.customfields['1164048']}</h1>
            <h1>${((isHourly ? row.hours : row.count) * price).toFixed(2)}</h1>
            <div className='break' />
            <h1>{formatAMPM(row.start)} ➝ {formatAMPM(row.end)}</h1>
            <h1>{row.count || 0} in {row.hours} hours</h1>
            {hrlyGoal && row.hours ?
                <h1>{((row.count || 0) / row.hours).toFixed(2).replace(/[.,]0+$/g, '')} / {hrlyGoal} Goal</h1>
                : undefined}
        </div>
    }

    function renderSingleUserRow(k, v) {
        let accent = localStorage.getItem('accentColor') || '#e67c52'
        return (
            <div key={k} className='UserReport' style={{ cursor: 'default', background: k === 'Daily Dollars' ? parseInt(v) / 650 < 1 ? `linear-gradient(90deg, ${accent} 0%, ${blendColors(accent, '#1b1b1b', .95)} ${parseInt(v) / 650 * 100 || 0}%, #1b1b1b ${Math.floor(((parseInt(v) / 650 * 100) + 100) / 2)}%, #1b1b1b 100%)` : accent : 'inherit' }}>
                <h1>{k.replace('ppd_', '').replace('hrly_', '')}</h1>
                <h1>{k === 'Daily Dollars' ? `$${v}` : `${v.is_hourly ? `${v.count} ${v.count > 1 ? `hours` : `hour`}` : `${v.count}`}`}</h1>
                {k !== 'Daily Dollars' ? <h1>${v.dd}</h1> : <></>}
            </div >)
    }

    // Render circular progress bar if still loading
    if (loading || tokenLoading) return (<>
        <div className='AssetArea'>
            <div className='UserReports'>
                <CircularProgress size='10rem' />
            </div>
            <div className='UserReports'>
                <CircularProgress size='10rem' />
            </div>
        </div>
    </>
    )
    // Base JSX for the page
    return (<>
        <div className='TopNav'>
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => handleBackClick()}>Back</Button>
            <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(removeDay(date)) }}>navigate_before</i>
                <input type='date' className='ReportDate' id='date_selector' value={getDate(date)} onChange={() => handleDateChange()} />
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(addDay(date)) }}>navigate_next</i>
            </div>
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => { nav('/asset', { state: { isReport: true, uid: onUser, date, name: userNames[onUser] } }) }}>View Asset Tracker</Button>
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => { nav('/hourly', { state: { isReport: true, uid: onUser, date, name: userNames[onUser] } }) }}>View Hourly Tracker</Button>
            <CSVLink filename={`${date}-EXPORT.csv`} target='_blank' data={getCSVData()}><Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} >Download CSV</Button></CSVLink>
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
                        <LineChart data={lineChartData} prefix="$" colors={[localStorage.getItem('accentColor') || '#e67c52']} />
                        <CSVLink filename={`${date}-EXPORT.csv`} target='_blank' data={getGraphCSVData()}><Button variant='contained' color='primary' size='large' style={{ marginTop: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} >Download CSV</Button></CSVLink>
                        {tsheetsData.length ?
                            <>
                                <hr style={{ width: '95%' }} />
                                <h1>T-Sheets</h1>
                                {tsheetsData.map(i => renderTsheetsRow(i))}
                            </> : undefined}
                    </div>
                </> : <>
                    <div className='UserReports'>
                        {data ?
                            <>
                                {data.map(m => renderUserRow(m))}
                                {data.length > 0 ? <hr style={{ width: '95%' }} /> : <></>}
                                <div key='total' className='UserReport' style={{ cursor: 'default' }}>
                                    <h1>Total</h1>
                                    <h1>${getTotal()}</h1>
                                </div>
                            </>
                            : <></>}
                    </div>
                    <div className='UserReports'>
                        <h1 style={{ padding: '1rem', paddingTop: '2rem' }}>Reports Section</h1>
                        {reportData.length > 0 ? <CSVLink filename={'depracated.csv'} target='_blank' data={reportData} ref={reportRef}></CSVLink> : undefined}
                        <h2>Today - {getDate(date).substring(5).replace('-', '/')}</h2>
                        <br />
                        <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getExcelReport(e, getDate(date))}>Download Report</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getAssetSummary(e, getDate(date))}>Asset Summary</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getHourlySummary(e, getDate(date))}>Hourly Summary</Button>
                        <hr style={{ width: '95%' }} />
                        <h2>Yesterday - {getDateSubtractDay(date).substring(5).replace('-', '/')}</h2>
                        <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getExcelReport(e, getDateSubtractDay(date))}>Download Report</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getAssetSummary(e, getDateSubtractDay(date))}>Asset Summary</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getHourlySummary(e, getDateSubtractDay(date))}>Hourly Summary</Button>
                        <hr style={{ width: '95%' }} />
                        <h2>Past Week - {getDateSubtractWeek(date).substring(5).replace('-', '/')} {'➝'} {getDate(date).substring(5).replace('-', '/')}</h2>
                        <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getExcelReport(e, getDate(date), getDateSubtractWeek(date))}>Download Report</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getAssetSummary(e, getDateSubtractWeek(date), getDate(date))}>Asset Summary</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getHourlySummary(e, getDateSubtractWeek(date), getDate(date))}>Hourly Summary</Button>
                        <hr style={{ width: '95%' }} />
                        <h2>Custom Date Range</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                            <input type='date' className='ReportDate' id='from_selector' value={graphDate.from} onChange={(e) => handleGraphDateChange(e)} />
                            <input type='date' className='ReportDate' id='to_selector' value={graphDate.to} onChange={(e) => handleGraphDateChange(e)} />
                        </div>
                        <Button disabled={generatingReport} variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getExcelReport(e, getDate(graphDate.to), getDate(graphDate.from))}>Download Report</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getAssetSummary(e, getDate(graphDate.from), getDate(graphDate.to))}>Asset Summary</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getHourlySummary(e, getDate(graphDate.from), getDate(graphDate.to))}>Hourly Summary</Button>
                        <hr style={{ width: '95%' }} />
                        <h2>Job Code Usage</h2>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getJobSummary('at')}>All Time</Button>
                        <Button variant='contained' color='primary' size='large' style={{ margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }}
                            onClick={e => getJobSummary('ytd')}>YTD</Button>
                    </div>
                </>
            }
        </div>
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
    while (!isBusinessDay(date)) { date.setDate(date.getDate() - 1) }
    return date.toISOString().split('T')[0]
}

function isBusinessDay(date) {
    if ([0, 6].includes(date.getDay())) return false
    return true
}

function getDateSubtractWeek(date) {
    date = new Date(date)
    date.setDate(date.getDate() - 7)
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