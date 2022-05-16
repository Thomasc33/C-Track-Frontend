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
import axios from 'axios';

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
    const [supplementaryData, setSupplementaryData] = useState({})
    const [commonParts, setCommonParts] = useState(null)
    const [loadingCommonParts, setLoadingCommonParts] = useState(false)
    const [newRepair, setNewRepair] = useState({ asset: null, part: null })

    // Effects
    useEffect(() => {
        getData()
    }, [date])

    async function getData() {
        setData([])
        setLoading(true)
        const token = await getTokenSilently()
        let d = new Date(date).toISOString().split('T')[0]
        let res = await axios.get(`${require('../settings.json').APIBase}/parts/log/${d}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        })
        if (res.isErrored) return console.log(res)
        setData(res.data.data || [])
        if (res.data.part_id_info) setSupplementaryData(res.data.part_id_info)
        setLoading(false)
    }

    // Permission Check
    if (!props.permissions.use_importer && !props.isAdmin) return <Redirect to='/' />

    // Event Handlers
    const handleDateChange = () => setDate(document.getElementById('date_selector').value)

    const handleDelete = async (id, e, row) => {
        const t = await getTokenSilently()
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className='confirm-alert'>
                        <h1>Confirm the deletion</h1>
                        <br />
                        <h2>Asset: {row.location}</h2>
                        <h3>Repair Type: {supplementaryData[row.part_id].type}</h3>
                        <h3>Part Number: {supplementaryData[row.part_id].part_number}</h3>
                        <span style={{ margins: '1rem' }}>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67', margin: '1rem' }} onClick={() => {
                                PartsService.deleteLog(id, t)
                                    .then(getData())
                                onClose()
                            }}
                            >Confirm</Button>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                onClose()
                            }}>Nevermind</Button>
                        </span>
                    </div>
                )
            }
        })
    }

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
        // Validate submit request
        if (!newRepair.asset || !newRepair.part) return console.log('Attempted submit, but missing asset or part')
        let parts = commonParts.filter(p => p.part_type === newRepair.part)
        if (!parts.length) return console.log(`No part types found for ${newRepair.part}:${newRepair.asset} (part/asset)`)
        let form = { ...newRepair }
        if (typeof date !== 'number') form.date = date

        // Get list of all parts under given asset and repair type
        let t = await getTokenSilently()
        let res1 = await PartsService.attemptSubmitLog(newRepair, t)
        if (res1.isErrored) return alert(res1.error.message)

        // If an array is returned, prompt user for which one to use
        if (!res1.data.submitted) {
            // Send to backend again
            let selection = await promptPart(res1.data.options, res1.data.part_id_to_part_num)
            if (selection === -1) return console.log('Closed the confirmation page')

            form = { part: selection, asset: newRepair.asset }
            if (typeof date !== 'number') form.date = date
            let res2 = await PartsService.submitLog(form, t)
            if (res2.isErrored) return console.log('res2 errored, ending method early')
        }

        // Clear fields
        if (document.getElementById('newasset')) document.getElementById('newasset').value = ''

        // Reset States
        setNewRepair({ asset: null, part: null })
        setCommonParts(null)

        // Update data
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

    const promptPart = (options, part_id_to_part_num) => {
        let renderPart = (row, onClose, res) => {
            let date = new Date(row.added_on)
            date = ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear()
            let part_num = part_id_to_part_num[row.part_id]
            return <div className='ResultSection' style={{ backgroundColor: '#91919167', width: '95%' }} key={row.id} onClick={() => {
                res(row)
                onClose()
            }}>
                <h3 style={{ width: '33.3%', textAlign: 'left' }}>{row.id}</h3>
                <h3 style={{ width: '33.4%' }}>{part_num}</h3>
                <h3 style={{ width: '33.3%', textAlign: 'right' }}>{date}</h3>
            </div>
        }
        return new Promise(res => {
            confirmAlert({
                customUI: ({ onClose }) => {
                    return (
                        <div className='confirm-alert'>
                            <h1>Select a part below as the one to use</h1>
                            <p>If there's no identification on it, pick the oldest one</p>
                            <div className='ResultSectionHeader' style={{ width: '95%' }}><h3 style={{ width: '33.3%', textAlign: 'left' }}>Part ID</h3>
                                <h3 style={{ width: '33.4%' }}>Part Number</h3>
                                <h3 style={{ width: '33.3%', textAlign: 'right', maxHeight: '10vh' }}>Added On</h3></div>
                            <div style={{ overflow: 'scroll' }}>{options.map(m => renderPart(m, onClose, res))}</div>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349' }} onClick={() => {
                                res(-1)
                                onClose()
                            }}>Cancel</Button>
                        </div>
                    )
                }
            })
        })
    }

    // Renderers
    const RenderRow = (row) => {
        let date = new Date(row.added_on)
        date = ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear()

        let partInfo = supplementaryData[row.part_id]
        let type = partInfo ? partInfo.type : 'Unknown'
        let part_number = partInfo ? partInfo.part_number : 'Unknown'

        return <div className='ResultSection' style={{ justifyContent: 'space-evenly', cursor: 'initial' }} key={row.id} onClick={() => { }} >
            <h2 style={{ width: '20%' }}>{row.location}</h2>
            <h2 style={{ width: '20%' }}>{type}</h2>
            <h2 style={{ width: '20%' }}>{part_number}</h2>
            <h2 style={{ width: '20%' }}>{date}</h2>
            <h2 style={{ width: '20%' }}>{formatAMPM(row.used_on)}</h2>
            <i className="material-icons delete-icon" onClickCapture={e => handleDelete(row.id, e, row)}>delete_outline</i>
        </div>
    }

    // Base JSX
    return (
        <>
            <div style={{ position: 'absolute', top: '8vh', left: '14vw', display: 'inline-flex', alignItems: 'center' }}>
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
                    <h2 style={{ width: '20%' }}>Asset</h2>
                    <h2 style={{ width: '20%' }}>Repair Type</h2>
                    <h2 style={{ width: '20%' }}>Part Number</h2>
                    <h2 style={{ width: '20%' }}>Added On</h2>
                    <h2 style={{ width: '20%' }}>Used At</h2>
                    <i className="material-icons delete-icon" style={{ visibility: 'hidden', cursor: 'default' }}>delete_outline</i>
                </div>
                <hr />
                <div className='break' />
                {loading ? <CircularProgress /> : undefined}
                {data.map(m => RenderRow(m))}
            </div>
            <PageTemplate highLight='repair_log' {...props} />
        </>
    )
}

export default RepairLogPage
