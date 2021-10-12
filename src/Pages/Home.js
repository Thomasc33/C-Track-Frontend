/* eslint-disable array-callback-return */
import React, { useState, useEffect } from 'react';
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import CircularProgress from '@mui/material/CircularProgress';
import '../css/Home.css'
const settings = require('../settings.json')

function HomePage(props) {
    //Get data, and update every 2 seconds
    let APILink = `${settings.APIBase}/home/user`
    const { loading, data = [] } = useFetch(APILink, 30000)
    const { instance, accounts } = useMsal()
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        async function getTasks() {
            let t = await getTokenSilently()
            let d = await fetch(`${settings.graphUrl}/me/planner/tasks`, { headers: { 'Authorization': `Bearer ${t}` } })
                .then(re => re.json())
                .catch(er => console.warn(er.text()))
            setTasks(d.value)
        }
        getTasks()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function getTokenSilently() {
        const SilentRequest = {
            scopes: ['User.Read', 'Tasks.Read'],
            account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true
        }
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

    /**
     * Function to control rendering of data
     * 
     */
    function renderStatsData(k, v) {
        return <div key={k} className='UserReport' style={{ cursor: 'default', background: k === 'Daily Dollars' ? parseInt(v) / 650 < 1 ? `linear-gradient(90deg, #8730d9 0%, ${blendColors('#8730d9', '#1b1b1b', .3)} ${parseInt(v) / 650 * 100 || 0}%, #1b1b1b 100%)` : '#8730d9' : 'transparent' }}>
            <h1 style={{ float: 'left' }}>{k}</h1>
            <h1 style={{ float: 'right' }}>{k === 'Daily Dollars' ? `$${v}` : `${v.is_hourly ? `${v.count} ${v.count > 1 ? `hours` : `hour`}` : `${v.count}`}`}</h1>
        </div >
    }

    function renderTasks(row) {
        let created = new Date(row.createdDateTime)
        let due = new Date(row.dueDateTime)
        let background = '#8730d9'
        if (due < Date.now()) background = 'red'
        if (row.percentComplete) background = `linear-gradient(90deg, #8730d9 0%, ${blendColors('#8730d9', '#1b1b1b', .3)} ${row.percentComplete}%, #1b1b1b 100%)`
        return <div key={row.id} className='UserReport' style={{ background: background, cursor: 'default' }}>
            <h1 style={{ float: 'left' }}>{row.title}</h1>
            <h1 style={{ fontSize: '1.75rem', float: 'right' }}>Created: {created.getMonth()}-{created.getDate()}, Due: {due.getMonth()}-{due.getDate()}</h1>
        </div >
    }

    //returns blank page if data is loading
    if (loading) return <PageTemplate highLight='0' {...props} />

    else return (
        <div>
            <div className='AssetArea'>
                <div className='UserReports'>
                    <h1 style={{ textDecoration: 'underline', padding: '1rem', paddingTop: '2rem' }}>To Do</h1>
                    {tasks.length > 0 ?
                        tasks.map(m => { if (!m.completedBy) return renderTasks(m) })
                        : <CircularProgress size='48px' />}
                </div>
                <div className='UserReports'>
                    <h1 style={{ textDecoration: 'underline', padding: '1rem', paddingTop: '2rem' }}>Daily Statistics</h1>
                    {Object.keys(data).map(m => renderStatsData(m, data[m]))}
                </div>
            </div>
            <PageTemplate highLight='0' {...props} />
        </div>
    )
}

export default HomePage

function blendColors(colorA, colorB, amount) {
    const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
    const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
    const r = Math.round(rA + (rB - rA) * amount).toString(16).padStart(2, '0');
    const g = Math.round(gA + (gB - gA) * amount).toString(16).padStart(2, '0');
    const b = Math.round(bA + (bB - bA) * amount).toString(16).padStart(2, '0');
    return '#' + r + g + b;
}