import React, { useState, useEffect } from 'react';
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
const settings = require('../settings.json')

function ReportsPage(props) {
    const [date, setDate] = useState(Date.now())
    const [data, setData] = useState([])
    const [graphDate, setGraphDate] = useState({
        from: getDateSubtractMonth(date),
        to: getDate(date)
    })
    const [loading, setLoading] = useState(true)
    const [lineChartData, setLineChartData] = useState({})
    const [onUser, setOnUser] = useState(null)
    const { instance, accounts } = useMsal()
    async function getTokenSilently() {
        const SilentRequest = { scopes: ['User.Read'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true }
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
    useEffect(() => {
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
        sendReq()
    }, [onUser, date])
    if (!props.permissions.view_reports && !props.isAdmin) return <Redirect to='/' />

    const handleDateChange = (e) => {
        setDate(document.getElementById('date_selector').value)
    }

    const handleGraphDateChange = () => {
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

    function renderUserRow(row) {
        let grad = row.dailydollars / 650 < 1 ? `linear-gradient(90deg, #8730d9 0%, ${blendColors('#8730d9', '#1b1b1b', .5)} ${row.dailydollars / 650 * 100 || 0}%, #1b1b1b 100%)` : '#8730d9'
        return (<div className='UserReport' style={{ background: grad }} onClick={e => handleUserClick(e, row.id)}>
            <h1 style={{ float: 'left' }}>{row.name}</h1>
            <h1 style={{ float: 'right' }}>${row.dailydollars}</h1>
        </div>)
    }

    function renderSingleUserRow(k, v) {
        return (
            <div className='UserReport' style={{ cursor: 'default' }}>
                <h1 style={{ float: 'left' }}>{k}</h1>
                <h1 style={{ float: 'right' }}>{k === 'Daily Dollars' ? `$${v}` : `${v.is_hourly ? `${v.count} ${v.count > 1 ? `hours` : `hour`}` : `${v.count}`}`}</h1>
            </div >)
    }
    console.log(lineChartData)
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
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: '#8730d9' }} onClick={() => handleBackClick()}>Back</Button>
            <input type='date' className='ReportDate' id='date_selector' value={getDate(date)} onChange={() => handleDateChange()} />
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: '#8730d9' }} onClick={() => { props.history.push('/asset', { isReport: true, uid: onUser }) }}>View Asset Tracker</Button>
            <Button variant='contained' color='primary' size='large' style={{ visibility: onUser ? 'visible' : 'hidden', backgroundColor: '#8730d9' }} onClick={() => { props.history.push('/hourly', { isReport: true, uid: onUser }) }}>View Hourly Tracker</Button>
        </div >
        <div className='AssetArea'>
            {onUser ?
                <>
                    <div className='UserReports'>
                        {Object.keys(data).map(k => renderSingleUserRow(k, data[k]))}
                    </div>
                    <div className='UserReports'>
                        <input type='date' className='ReportDate' id='from_selector' value={graphDate.from} onChange={() => handleGraphDateChange()} />
                        <input type='date' className='ReportDate' id='to_selector' value={graphDate.to} onChange={() => handleGraphDateChange()} />
                        <LineChart data={lineChartData} />
                    </div>
                </> : <>
                    <div className='UserReports'>
                        {data ?
                            data.map(m => renderUserRow(m))
                            : <></>}
                    </div>
                    <div className='UserReports'>
                        <h1>Placeholder for future functionality</h1>
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

function blendColors(colorA, colorB, amount) {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
}