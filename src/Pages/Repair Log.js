import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import { getDate, addDay, removeDay, formatAMPM } from './Asset'
import { Button } from '@material-ui/core';
import { confirmAlert } from 'react-confirm-alert';
import { CircularProgress } from '@mui/material';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import PartsService from '../Services/Parts';

const settings = require('../settings.json')

function RepairLogPage(props) {
    // MSAL stuff
    const { instance, accounts } = useMsal()
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

    // States
    const [date, setDate] = useState(props.location.state ? props.location.state.date || Date.now() : Date.now())
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [commonParts, setCommonParts] = useState(null)
    const [loadingCommonParts, setLoadingCommonParts] = useState(false)
    const [newRepair, setNewRepair] = useState({ asset: null, part: null })

    // Effects
    useEffect(() => {
        getData()
    }, [])

    async function getData() {
        // TODO: implement this
        //change setloading and setdata
    }

    // Permission Check
    if (!props.permissions.use_importer && !props.isAdmin) return <Redirect to='/' />

    // Event Handlers
    const handleDateChange = () => setDate(document.getElementById('date_selector').value)

    const handleAssetChange = async e => {
        // Add loading animation
        setLoadingCommonParts(true)
        // Get asset from target
        let asset = e.target.value
        // Update state with new asset
        let te = { ...newRepair }
        te.asset = asset
        setNewRepair(te)
        // Stop if the asset is ''
        if (!asset) return setLoadingCommonParts(false)
        // Get all parts types for the asset
        let t = await getTokenSilently()
        let res = await PartsService.getCommonParts(asset, t)
        if (res.isErrored) setCommonParts([])
        else setCommonParts(res.data)
        // Remove loading animation
        setLoadingCommonParts(false)
    }

    const handleSelectChange = async e => {
        let t = { ...newRepair }
        t.part = e
        setNewRepair(t)
    }

    const handleSubmitButton = async () => {
        // TODO: Implement submit logic
        // Validate submit request
        if (!newRepair.asset || !newRepair.part) return console.log('Attempted submit, but missing asset or part')
        let parts = commonParts.filter(p => p.part_type === newRepair.part)
        if (!parts.length) return console.log(`No part types found for ${newRepair.part}:${newRepair.asset} (part/asset)`)

        // Get list of all parts under given asset and repair type
        let t = await getTokenSilently()
        let res1 = await PartsService.attemptSubmitLog(newRepair, t)
        //REMOVE
        // res1 = {options: [], submited: bool}
        // If an array is returned, prompt user for which one to use
        if (!res1.submitted) {
            // Send to backend again
            // TODO: Stopped here, needs to use react-confirm alert thing. Then use the put partsservice.submitlog method
        }
        // Get data again
        if (document.getElementById('newasset')) document.getElementById('newasset').value = ''

        setNewRepair({ asset: null, part: null })
        setCommonParts(null)
        getData()
    }

    // Misc Functions
    const getParts = () => {
        if (!commonParts || !commonParts.length) return []
        let commons = new Set(commonParts.map(m => m.part_type))
        let r = []
        commons.forEach(m => r.push({ name: m, value: m }))
        return r
    }

    // Renderers
    const RenderRow = (row) => {
        return <div className='ResultSection' onClick={() => { }} >
            <h2 style={{ width: '33.3%', textAlign: 'left' }}>a</h2>
            <h2 style={{ width: '33.4%' }}>b</h2>
            <h2 style={{ width: '33.3%', textAlign: 'right' }}>c</h2>
        </div>
    }

    // Base JSX
    return (
        <>
            <div style={{ position: 'absolute', top: '2%', left: '14%', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(removeDay(date)) }}>navigate_before</i>
                <input type='date' className='date' id='date_selector' value={getDate(date)} onChange={handleDateChange} />
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(addDay(date)) }}>navigate_next</i>
            </div>
            <div className='PartManagementArea' style={{ top: '6vh' }}>
                <h1 style={{ marginBottom: '1rem' }}>New Repair:</h1>
                <div className='break' />
                <div className='RepairOption'><h2 style={{ margin: '.5rem' }}>Asset: </h2><input type='text' placeholder='Asset Tag' onBlur={handleAssetChange} id='newasset' /></div>
                <div className='RepairOption'>
                    <h2 style={{ margin: '.5rem' }}>Repair Type: </h2>
                    {loadingCommonParts ? <CircularProgress /> : commonParts ? commonParts.length ?
                        <SelectSearch
                            options={getParts()}
                            search
                            placeholder="Select a repair type"
                            filterOptions={fuzzySearch}
                            className='job_list'
                            autoComplete='on'
                            id='part_select'
                            onChange={e => handleSelectChange(e)} />
                        : <input type='text' disabled placeholder='No Repairs Known' /> : <input type='text' disabled placeholder='Enter Asset First' />}
                </div>
                <div className='break' />
                <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67', margin: '1rem' }} onClick={handleSubmitButton}>Submit</Button>
                <div className='break' />
                <hr />
                <div className='break' />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', width: '90%' }}>
                    <h2 style={{ width: '33.3%', textAlign: 'left' }}>Asset</h2>
                    <h2 style={{ width: '33.4%' }}>Repair Type</h2>
                    <h2 style={{ width: '33.3%', textAlign: 'right' }}>Part Number</h2>
                </div>
                <hr />
                <div className='break' />
                {loading ? <CircularProgress /> : undefined}
                {data.map(m => RenderRow(m))}
            </div>
            <PageTemplate highLight='8' {...props} />
        </>
    )
}

export default RepairLogPage
