// Imports
import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CircularProgress } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import { useMSAL } from '../Helpers/MSAL';
import { formatAMPM } from './Asset';
import axios from 'axios'

function RFFPage(props) {
    // MSAL stuff
    const { token } = useMSAL()

    // States
    const [data, setData] = useState([])
    const [onRFFList, setOnRFFList] = useState(false)
    const [onLostStolenList, setOnLostStolenList] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState(null)
    const [newRecord, setNewRecord] = useState({ asset: null, ticket: null, branch: null, user: null })
    const [branches, setBranches] = useState([])
    const [doUpdateData, setDoUpdateData] = useState(true)

    // Effects
    useEffect(() => {
        async function getData() {
            let res = await axios.get(`${require('../settings.json').APIBase}/misc/rff`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            if (res.data) {
                let branches = Object.keys(res.data.rffs)
                // Sort based on last_call with undefined at the start
                branches = branches.sort((a, b) => {
                    if (!res.data.rffs[a].some(r => r.last_call)) return -1
                    if (!res.data.rffs[b].some(r => r.last_call)) return 1
                    return new Date(Math.max(...res.data.rffs[a].map(m => new Date(m.last_call)))) - new Date(Math.max(...res.data.rffs[b].map(m => new Date(m.last_call))))
                })
                setData({ ...res.data, branches });
                setDoUpdateData(false)
            }
        }
        if (token && doUpdateData) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, doUpdateData])

    useEffect(() => {
        async function getBranches() {
            let res = await axios.get(`${require('../settings.json').APIBase}/branch/simple`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            if (res.data) setBranches(res.data.branches.sort())
        }
        if (token) getBranches()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])


    // Permission Check
    if (!props.permissions.use_rff_tracking && !props.isAdmin) return <Navigate to='/' />

    // Event Handlers
    const handleNewValueChange = (e) => { setNewRecord({ ...newRecord, [e.target.id]: e.target.value }) }

    const handleNewSubmit = async (e) => {
        e.preventDefault()
        if (!newRecord.asset || !newRecord.ticket || !newRecord.branch || !newRecord.user) return alert('Please fill out all fields then try again')
        let res = await axios.post(`${require('../settings.json').APIBase}/misc/rff`, newRecord, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        }).catch(er => { return { isErrored: true, error: er } })
        if (res.isErrored) { console.log(res); alert(res.error.response.data.error) }
        if (res.status === 200) {
            document.getElementById('asset').value = ''
            document.getElementById('ticket').value = ''
            document.getElementById('user').value = ''
            setNewRecord({ asset: null, ticket: null, branch: null, user: null })
            document.getElementById('homeh1').innerHTML = 'Record Added!'
            setTimeout(() => { document.getElementById('homeh1').innerHTML = 'New RFF Record' }, 2000)
            setDoUpdateData(true)
        }
    }

    const handleVoicemail = async (branch) => {
        console.log(branch)
        let ids = [...data.rffs[branch].map(r => r.id)]
        let res = await axios.post(`${require('../settings.json').APIBase}/misc/rff/voicemail`, { branch, ids }, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        }).catch(er => { return { isErrored: true, error: er } })
        if (res.isErrored) { console.log(res); alert(res.error.response.data.error) }
        if (res.status === 200) {
            setDoUpdateData(true)
        }
    }

    const handleSnooze = async (id) => {
        let res = await axios.post(`${require('../settings.json').APIBase}/misc/rff/snooze`, { id }, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        }).catch(er => { return { isErrored: true, error: er } })
        if (res.isErrored) { console.log(res); alert(res.error.response.data.error) }
        if (res.status === 200) {
            setDoUpdateData(true)
        }
    }

    const handleLostStolen = async (id) => {
        let res = await axios.post(`${require('../settings.json').APIBase}/misc/rff/loststolen`, { id }, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        }).catch(er => { return { isErrored: true, error: er } })
        if (res.isErrored) { console.log(res); alert(res.error.response.data.error) }
        if (res.status === 200) {
            setDoUpdateData(true)
        }
    }

    const handleRemoveLostStolen = async (id) => {
        let res = await axios.post(`${require('../settings.json').APIBase}/misc/rff/removeloststolen`, { id }, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        }).catch(er => { return { isErrored: true, error: er } })
        if (res.isErrored) { console.log(res); alert(res.error.response.data.error) }
        if (res.status === 200) {
            setDoUpdateData(true)
        }
    }

    // Renderers
    function RenderHome() {
        return <><h1 id='homeh1'>New RFF Record</h1>
            <div className='break' />
            <div className='RepairOption'><h2 style={{ padding: '1rem', margin: '.5rem' }}>Asset: </h2><input type='text' id='asset' placeholder='Asset Tag' onBlur={handleNewValueChange} /></div>
            <div className='RepairOption'><h2 style={{ padding: '1rem', margin: '.5rem' }}>Ticket: </h2><input type='text' id='ticket' placeholder='Ticket Number' onBlur={handleNewValueChange} /></div>
            <div className='break' />
            <div className='RepairOption'><h2 style={{ padding: '1rem', margin: '.5rem' }}>Branch: </h2>
                {!branches.length ? <CircularProgress /> :
                    <SelectSearch
                        options={branches.map(m => { return { name: m.id, value: m.id } })}
                        value={newRecord.branch}
                        search
                        placeholder="Branch Code"
                        filterOptions={fuzzySearch}
                        className='job_list'
                        autoComplete='on'
                        id='part_select'
                        onChange={e => setNewRecord({ ...newRecord, branch: e })} />}
            </div>
            <div className='RepairOption'><h2 style={{ padding: '1rem', margin: '.5rem' }}>User: </h2><input type='text' id='user' placeholder='User Name' onBlur={handleNewValueChange} /></div>
            <div className='break' />
            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={handleNewSubmit}>Submit</Button>
            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={() => setOnRFFList(true)}>Open RFF Call List</Button>
            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={() => setOnLostStolenList(true)}>Open Lost Stolen List</Button>
            <div className='break' />
            <hr />
            <h1>RFF Stats</h1>
            <div className='break' />
            {data && data.stats ? Object.keys(data.stats).map(RenderHomeStat) : undefined}
            <div className='break' />
        </>
    }

    function RenderBranches() {
        return <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%' }}>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { setOnRFFList(false) }}>Back</Button>
                <h1>RFF Calls</h1>
                <div></div>
            </div>
            <hr />
            <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', width: '90%', padding: '1rem', borderRadius: '.3rem' }}>
                <h2 style={{ width: '25%', textAlign: 'left' }}>Branch</h2>
                <h2 style={{ width: '25%' }}>Devices</h2>
                <h2 style={{ width: '25%' }}>Users</h2>
                <h2 style={{ width: '25%', textAlign: 'right' }}>Last Call Date</h2>
            </div >
            {data.branches.map(m => RenderRFFRow(m))}
        </>
    }

    function RenderBranch() {
        return <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%' }}>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { setSelectedBranch(null) }}>Back</Button>
                <h1>Branch: {selectedBranch}</h1>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { handleVoicemail(selectedBranch) }}>Voicemail</Button>
            </div>
            <hr />
            <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', width: '90%', padding: '1rem', borderRadius: '.3rem' }}>
                <h2 style={{ width: '15%' }}>Asset</h2>
                <h2 style={{ width: '10%' }}>Ticket</h2>
                <h2 style={{ width: '20%' }}>User</h2>
                <h2 style={{ width: '13%' }}>Ticket Date</h2>
                <h2 style={{ width: '10%' }}>Calls Made</h2>
                <h2 style={{ width: '13%' }}>Last Call</h2>
                <h2 style={{ width: '17%' }}>Actions</h2>
            </div>
            {data.rffs[selectedBranch] ? data.rffs[selectedBranch].map(RenderBranchRow) : undefined}
        </>
    }

    function RenderLostStolenPage() {
        return <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%' }}>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { setOnLostStolenList(false) }}>Back</Button>
                <h1>Lost/Stolen</h1>
                <div></div>
            </div>
            <hr />
            <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', width: '90%', padding: '1rem', borderRadius: '.3rem' }}>
                <h2>Asset</h2>
                <h2>Ticket</h2>
                <h2>Branch</h2>
                <h2>User</h2>
                <h2>Ticket Date</h2>
                <h2>Calls Made</h2>
                <h2>Last Call</h2>
                <h2>Actions</h2>
            </div>
            {data.lost_stolen ? data.lost_stolen.map(RenderLostStolenRow) : undefined}
        </>
    }

    function RenderHomeStat(row) {
        let val = data.stats[row]
        return <div className='ResultSection' style={{ width: '75%', cursor: 'default', margin: '.5rem' }} key={row}>
            <h2 style={{ width: '50%', textAlign: 'left' }}>{titleCase(row)}</h2>
            <h2 style={{ width: '50%', textAlign: 'right' }}>{val}</h2>
        </div>
    }

    function RenderRFFRow(branch) {
        let users = new Set()
        for (let i of data.rffs[branch]) users.add(i.user)
        let lastCall = undefined
        if (data.rffs[branch].some(s => s.last_call)) lastCall = new Date(Math.max(...data.rffs[branch].map(m => new Date(m.last_call))))
        return <div className='ResultSection' onClick={() => { setSelectedBranch(branch) }} key={branch} >
            <h2 style={{ width: '25%', textAlign: 'left' }}>{branch}</h2>
            <h2 style={{ width: '25%' }}>{data.rffs[branch].length}</h2>
            <h2 style={{ width: '25%' }}>{users.size}</h2>
            <h2 style={{ width: '25%', textAlign: 'right' }}>{lastCall ? `${lastCall.toISOString().split('T')[0]} ${formatAMPM(lastCall.toISOString())}` : 'None'}</h2>
        </div>
    }

    function RenderBranchRow(row) {
        let added = new Date(row.added).toISOString().split('T')[0], last_call
        if (row.last_call) last_call = new Date(row.last_call).toISOString().split('T')[0]
        return <div className='ResultSection' onClick={() => { }} key={row.id} style={{ cursor: 'default', alignItems: 'center' }}>
            <h3>{row.asset_id}</h3>
            <h3>{row.ticket}</h3>
            <h3>{row.user}</h3>
            <h3>{added}</h3>
            <h3>{row.call_count}</h3>
            <h3>{last_call ? `${last_call} by ${data.users[row.last_caller]}` : 'None'}</h3>
            <div>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { handleSnooze(row.id) }}>Snooze</Button>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { handleLostStolen(row.id) }}>Lost/Stolen</Button>
            </div>
        </div>
    }

    function RenderLostStolenRow(row) {
        let added = new Date(row.added).toISOString().split('T')[0], last_call
        if (row.last_call) last_call = new Date(row.last_call).toISOString().split('T')[0]
        return <div className='ResultSection' onClick={() => { }} key={row.id} style={{ cursor: 'default', alignItems: 'center' }}>
            <h3>{row.asset_id}</h3>
            <h3>{row.ticket}</h3>
            <h3>{row.branch}</h3>
            <h3>{row.user}</h3>
            <h3>{added}</h3>
            <h3>{row.call_count}</h3>
            <h3>{last_call ? `${last_call} by ${data.users[row.last_caller]}` : 'None'}</h3>
            <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { handleRemoveLostStolen(row.id) }}>Revert</Button>
        </div>
    }

    // Base JSX

    return (
        <>
            <div className='PartManagementArea' style={{ paddingTop: '0', paddingBottom: '0', height: '92vh' }}>
                {onRFFList ? selectedBranch ? RenderBranch() : RenderBranches() : onLostStolenList ? RenderLostStolenPage() : RenderHome()}
            </div>
        </>
    )
}

export default RFFPage

function titleCase(str) {
    let splitStr = str.toLowerCase().replace('_', ' ').split(' ');
    for (let i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
}