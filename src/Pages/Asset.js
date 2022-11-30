// Imports
import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { Navigate, useLocation } from 'react-router-dom';
import { useMSAL } from '../Helpers/MSAL';
import { Button } from '@material-ui/core';
import { useFetch } from '../Helpers/API';
import { confirmAlert } from 'react-confirm-alert';
import { Slider } from '@mui/material';
import assetService from '../Services/Asset'
import User from '../Services/User';
import ModelSelect from '../Components/ModelSelect';
import Checkbox from 'react-custom-checkbox';
import Select from 'react-select';
import * as Icon from 'react-icons/fi';

const settings = require('../settings.json')

function AssetPage(props) {
    // Constants/Hooks
    const { token } = useMSAL()
    const location = useLocation()
    const noAssetJobCounts = {}
    const APILink = location.state && location.state.isReport ? `${settings.APIBase}/reports/asset/user?uid=${location.state.uid}&date=` : `${settings.APIBase}/asset/user?date=`

    // States
    const [date, setDate] = useState(location.state ? location.state.date || Date.now() : Date.now())
    const [jobCodes, setJobCodes] = useState(null);
    const [favorites, setFavorites] = useState([])
    const [indexedJobCodes, setIndexJobCodes] = useState({})
    const [newJob, setNewJob] = useState({ newJobCode: 0, newAssetTag: '', newComment: '', newBranch: '' })
    const [missingAssetId, setMissingAssetId] = useState(null)
    const [modelSelect, setModelSelect] = useState(null)
    const [newestOnTop, setNewestOnTop] = useState(localStorage.getItem('newestOnTop') === 'true' || false)
    const [showTimestamp, setShowTimestamp] = useState(localStorage.getItem('showTimestamp') === 'true' || false)
    const [selected, setSelected] = useState([])
    const [multipleSelectCount,] = useState(1)

    // Wrapper for useEffect
    const { loading, data = [], setData } = useFetch(APILink.concat(getDate(date)), null)

    // Effects
    useEffect(() => { // Gets and sorts job codes
        async function sort() {
            let jc = getJobCodes(true)
            let fav = getFavorites()

            let val = await Promise.all([jc, fav])
            let j = val[0], f = val[1].map(m => parseInt(m))

            // Sorry to anyone that ever has to read this :)
            // Basically, returns -1 if a is exclusively favorite, 0 if both a and b are favorites, and 1 if b is exclusively favorite
            j.sort((a, b) => { return f.includes(a.id) ? f.includes(b.id) ? 0 : -1 : f.includes(b.id) ? 1 : 0 })

            setJobCodes(j)
        }
        if (token) sort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    // Return to home page if user can't access this route
    if (!props.permissions.use_asset_tracker && !props.isAdmin) return <Navigate to='/' />


    // Styling for react-select for multi select
    const selectStyles = {
        control: (styles, { selectProps: { width } }) => ({ ...styles, backgroundColor: 'transparent', width }),
        menu: (provided, state) => ({ ...provided, width: state.selectProps.width, }),
        noOptionsMessage: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        menuList: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => { return { ...styles, backgroundColor: '#1b1b1b', color: 'white', ':active': { ...styles[':active'], backgroundColor: localStorage.getItem('accentColor') || '#e67c52', }, ':hover': { ...styles[':hover'], backgroundColor: localStorage.getItem('accentColor') || '#e67c52' } }; },
        multiValue: (styles, { data }) => { return { ...styles, backgroundColor: localStorage.getItem('accentColor') || '#e67c52', }; },
        multiValueLabel: (styles, { data }) => ({ ...styles, color: data.color, }),
        multiValueRemove: (styles, { data }) => ({ ...styles, color: 'white', ':hover': { color: 'red', }, }),
    }

    // --- Start Functions --- //
    async function getFavorites() {
        const response = await fetch(`${settings.APIBase}/job/favorites?type=asset`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        setFavorites(data.favorites)
        return data.favorites
    }

    async function getJobCodes(ignoreState = false) {
        const response = await fetch(`${settings.APIBase}/job/all/type?type=asset`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        if (!ignoreState) setJobCodes(data.job_codes)
        let te = {}
        for (let i of data.job_codes) {
            te[i.id] = i.job_code
        }
        setIndexJobCodes(te)
        return data.job_codes
    }

    const handleDateChange = () => {
        setDate(document.getElementById('date_selector').value)
    }

    const handleTextInputChange = async (id, e, fromEnter = false, fromSelect = false) => {
        // Prevent non asset codes from adding an extra at the end
        if (id === 'new' && !fromEnter && (e.target && e.target.id && e.target.id.includes('assetid'))) {
            if (!newJob.newJobCode) return
            for (let i of jobCodes) if (newJob.newJobCode === i.id) { if (!i.requires_asset) return; break }
        }
        if (isNaN(parseInt(e)) && !fromSelect) { //checks to make sure e is real, not an int from select
            if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        } else {
            let ele = document.getElementById(`${id}-jobcode`)
            if (ele && ele.classList.contains('invalid')) ele.classList.remove('invalid')
        }
        if (id === 'new') {
            let dateString = new Date(date).toISOString().split('T')[0]
            let job_code = newJob.newJobCode;
            let asset = newJob.newAssetTag;
            let comment = newJob.newComment;
            let branch = newJob.newBranch;
            if (!isNaN(parseInt(e))) { setNewJob({ ...newJob, newJobCode: parseInt(e) }); job_code = parseInt(e) }
            else if (fromSelect) { comment = e.map(m => m.value).join(','); setNewJob({ ...newJob, newComment: comment }) }
            else switch (e.target.id) {
                case 'new-notes':
                    comment = e.target.value
                    setNewJob({ ...newJob, newComment: comment })
                    break;
                case 'new-assetid':
                    asset = e.target.value
                    setNewJob({ ...newJob, newAssetTag: asset })
                    break;
                case 'new-branch':
                    branch = e.target.value
                    setNewJob({ ...newJob, newBranch: branch })
                    break;
                default:
                    console.log('Default Case hit for new in new asset')
                    return
            }

            //data validation
            let cont = true;
            if (!job_code) {
                //if (document.getElementById('new-jobcode')) document.getElementById('new-jobcode').getElementsByTagName('input')[0].classList.add('invalid')
                cont = false
            }

            for (let i of jobCodes)
                if (job_code === i.id)
                    if (!i.requires_asset && !asset) asset = '.'
                    else break

            if (!asset) {
                //if (document.getElementById('new-assetid')) document.getElementById('new-assetid').classList.add('invalid')
                cont = false
            }
            if (!cont) return

            // Check for multiple prompt
            let multiple = jobPromptsCount(job_code) ? await promptForMultiple(job_code) : null

            //send to api
            let formData = {
                date: dateString,
                job_code: job_code,
                asset_id: asset,
                notes: comment,
                branch: branch,
                uid: location.state && location.state.uid,
                multiple
            }
            let res = await assetService.add(formData, token)
            if (res.isErrored) {
                console.log(res.error.message)
                if (res.error.message === 'Job code doesnt apply to model type') {
                    document.getElementById(`${id}-assetid`).value = '';
                    alert(`Job code not compatable with asset's model type`)
                }
                else if (res.error.message === 'Asset is Locked') {
                    console.log('locked')
                    alert(`This asset is currently locked and cannot be modified. Contact a site admin for more information`)
                } else if (res.error.ruleViolation) {
                    confirmAlert({
                        customUI: ({ onClose }) => {
                            return (
                                <div className='confirm-alert'>
                                    <h1>Job Code Rule Violation</h1>
                                    <br />
                                    <h2>{res.error.message}</h2>
                                    <br />
                                    {res.error.previousRecord ? <>
                                        <h2>Previous Record:</h2>
                                        <h3>Date: {getDate(res.error.previousRecord.date)}</h3>
                                        <h3>Time: {formatAMPM(res.error.previousRecord.time)}</h3>
                                        <h3>Job Code: {res.error.previousRecord.job}</h3>
                                        <h3>Technician: {res.error.previousRecord.user}</h3>
                                    </>
                                        : undefined}
                                    <span style={{ margins: '1rem' }}>
                                        <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={() => {
                                            onClose()
                                        }}>Close</Button>
                                        <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                            onClose()
                                            handleOverrideResend(formData, false)
                                        }}>Override</Button>
                                    </span>
                                </div>
                            )
                        },
                        closeOnEscape: true,
                        closeOnClickOutside: true
                    })
                }
                else {
                    if (document.getElementById('new-assetid')) document.getElementById('new-assetid').classList.add('invalid')
                    try {
                        if (res.error.message.includes('Asset id not found')) {
                            document.getElementById('missingAssetBox').classList.add('ShowAssetAddingPrompt')
                            document.getElementById('missingAssetId').innerText = `${asset}`
                            setMissingAssetId({ id: 'new', e })
                        }
                    }
                    catch (er) { }
                }
            } else {
                if (res.data.watching && res.data.watching.length) alert(`This asset is being watched by:\n${res.data.watching.join(', ')}`)

                const response = await fetch(APILink.concat(getDate(date)), {
                    mode: 'cors',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Access-Control-Allow-Origin': '*',
                        'X-Version': require('../backendVersion.json').version
                    }
                });
                const d = await response.json();
                let new_assetid = document.getElementById('new-assetid'), new_notes = document.getElementById('new-notes'), new_job = document.getElementById('new-jobcode'), new_branch = document.getElementById('new-branch')
                if (new_assetid) { new_assetid.value = ''; if (new_assetid.classList.contains('invalid')) new_assetid.classList.remove('invalid') }
                if (new_notes) { new_notes.value = ''; if (new_notes.classList.contains('invalid')) new_notes.classList.remove('invalid') }
                if (new_job && new_job.classList.contains('invalid')) new_job.classList.remove('invalid')
                if (new_branch) new_branch.value = ''
                setNewJob({ newJobCode: newJob.newJobCode, newAssetTag: '', newComment: '', newBranch: '' })
                setData(d);

                // If the job code is a replacement, prompt for return
                for (let i of jobCodes)
                    if (i.id === job_code && i.usage_rule_group === 'deploy' && i.job_code.toLowerCase().includes('replace'))
                        handleReturn(formData)
            }
        } else for (let i of data.records) {
            if (id === i.id) {
                //data validation
                let formData = {
                    id: i.id,
                    change: null,
                    uid: location.state && location.state.uid
                }
                if (!isNaN(parseInt(e))) {
                    formData.change = 'job'
                    formData.value = parseInt(e)
                }
                else if (fromSelect) {
                    formData.change = 'notes'
                    formData.value = e.map(m => m.value).join(',')
                }
                else switch (e.target.className) {
                    case 'asset_id':
                        if (e.target.value !== i.asset_id) if (e.target.value) formData.change = 'asset'
                        break;
                    case 'notes':
                        if (e.target.value !== i.notes) formData.change = 'notes'
                        break;
                    case 'branch':
                        if (e.target.value !== i.branch) formData.change = 'branch'
                        break
                    case 'time':
                        if (e.target.value !== i.time) formData.change = 'time'
                        break;
                    default:
                        break;
                }
                if (formData.change === 'asset')
                    for (let j of jobCodes)
                        if (j.id === i.job_code && !j.requires_asset)
                            return console.log('Cancelled an edit because it was an asset change on a non-asset job')

                if (!formData.change) return

                if (!formData.value && !fromSelect) formData.value = e.target.value

                //send to api
                let res = await assetService.edit(formData, token)
                if (res.isErrored) {
                    if (res.error.message === 'Job code doesnt apply to model type') {
                        alert(`Job code not compatable with asset's model type`)
                        document.getElementById(`${id}-assetid`).value = ''
                        if (document.getElementById(`${id}-jobcode`)) document.getElementById(`${id}-jobcode`).classList.add('invalid')
                    }
                    else if (res.error.message === 'Asset is Locked') {
                        console.log('locked')
                        alert(`This asset is currently locked and cannot be modified. Contact a site admin for more information`)
                    }
                    else if (res.error.ruleViolation) {
                        confirmAlert({
                            customUI: ({ onClose }) => {
                                return (
                                    <div className='confirm-alert'>
                                        <h1>Job Code Rule Violation</h1>
                                        <br />
                                        <h2>{res.error.message}</h2>
                                        <br />
                                        {res.error.previousRecord ? <>
                                            <h2>Previous Record:</h2>
                                            <h3>Date: {getDate(res.error.previousRecord.date)}</h3>
                                            <h3>Time: {formatAMPM(res.error.previousRecord.time)}</h3>
                                            <h3>Job Code: {res.error.previousRecord.job}</h3>
                                            <h3>Technician: {res.error.previousRecord.user}</h3>
                                        </>
                                            : undefined}
                                        <span style={{ margins: '1rem' }}>
                                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={() => {
                                                onClose()
                                            }}>Close</Button>
                                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                                onClose()
                                                handleOverrideResend(formData, true)
                                            }}>Override</Button>
                                        </span>
                                    </div>
                                )
                            },
                            closeOnEscape: true,
                            closeOnClickOutside: true
                        })
                    }
                    if (e.target) {
                        e.target.classList.add('invalid')
                        try {
                            if (e.target.className.includes('asset_id') && res.error.data.message.includes('Asset id not found')) {
                                document.getElementById('missingAssetBox').classList.add('ShowAssetAddingPrompt')
                                document.getElementById('missingAssetId').innerText = `${e.target.value}`
                                setMissingAssetId({ id, e })
                            }
                        }
                        catch (er) { }
                    }
                }
            }
        }
    }

    // Handles the prompt for adding multiple lines at once using the "prompt_count" field in the job code
    const promptForMultiple = async jobId => {
        return new Promise(async res => {
            let restrictedComments = getRestrictedComments(jobId, true) || []
            let breakDown = {}
            let selectCount = 1
            confirmAlert({
                customUI: ({ onClose }) => {
                    return (
                        <div className='confirm-alert'>
                            <h1>Are You Doing Multiple?</h1>
                            <br />
                            <label for='multi-count'>Count: </label>
                            <input id='multi-count' defaultValue={1} type='number' step='1' min='1' max='50' onChange={e => selectCount = e.target.valueAsNumber} />
                            <div style={{ display: 'flex' }}>
                                {selectCount ? restrictedComments.map(m =>
                                    <div style={{ width: `${100 / restrictedComments.length}%`, padding: '1rem' }}>
                                        <h3>{m}</h3>
                                        <Slider
                                            className='MultipleSlider'
                                            aria-label='small'
                                            defaultValue={0}
                                            step={1}
                                            min={0}
                                            max={25}
                                            valueLabelDisplay="auto"
                                            marks
                                            onChangeCommitted={e => breakDown[m] = parseInt(e.target.innerText)}
                                        />
                                    </div>
                                ) : undefined}
                            </div>
                            <span style={{ margins: '1rem' }}>
                                <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={() => {
                                    if (selectCount < Object.values(breakDown).reduce((a, b) => a + b, 0)) {
                                        alert('too many in slider')
                                    } else {
                                        res({ count: selectCount, split: breakDown })
                                        onClose()
                                    }
                                }}
                                >Confirm</Button>
                                <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                    onClose()
                                    res(null)
                                }}>No</Button>
                            </span>
                        </div>
                    )
                }
            }, multipleSelectCount)

        })
    }

    // Handle logic behind adding to rff call list
    const handleReturn = async (formData) => {
        let r = await promptForReturn(formData.branch)
        if (!r) return
        let data = r.assets.map(m => ({ ...r, asset: m, assets: undefined }))
        for (let i of data) {
            let r = await assetService.newRFF(i, token)
            if (r.isErrored) alert(`Error adding ${i.asset} to RFF call list\n${r.error.error}`)
        }
    }

    // Handles the prompt for adding information about return devices
    const promptForReturn = async (branch = undefined) => {
        return new Promise(async res => {
            let returnData = { branch, assets: [] }
            confirmAlert({
                customUI: ({ onClose }) => {
                    return (
                        <div className='confirm-alert'>
                            <h1>Return Device?</h1>
                            <br />
                            <label for='return-branch'>Branch: </label>
                            <input id='return-branch' type='text' onChange={e => returnData.branch = e.target.value} defaultValue={branch} />
                            <label for='return-ticket'>Ticket: </label>
                            <input id='return-ticket' type='text' onChange={e => returnData.ticket = e.target.value} />
                            <label for='return-user'>User: </label>
                            <input id='return-user' type='text' onChange={e => returnData.user = e.target.value} />
                            <br />
                            <label for='return-asset-id'>Comma Seperated Asset ID(s): </label>
                            <input id='return-asset-id' type='text' onChange={e => returnData.assets = e.target.value.replace(/\s/g, '').split(',')} />
                            <br />
                            <span style={{ margins: '1rem' }}>
                                <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={() => {
                                    if (returnData.assets.length < 1) return alert('Must add at least one asset')
                                    if (!returnData.branch) return alert('Must add a branch')
                                    if (!returnData.ticket) return alert('Must add a ticket')
                                    if (!returnData.user) return alert('Must add a user')
                                    res(returnData)
                                    onClose()
                                }}
                                >Confirm</Button>
                                <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                    onClose()
                                    res(null)
                                }}>No</Button>
                            </span>
                        </div>
                    )
                }
            }, returnData)
        })
    }

    // Handles adding a new asset to the database if the inputed model wasn't found
    const handleAssetAdding = async () => {
        // Get model
        if (!modelSelect) return

        // Get asset
        let asset = document.getElementById('missingAssetId').innerText
        if (!asset) { console.log('Asset missing from asset adding function'); return }

        let FormData = { model_id: modelSelect, asset_id: asset }
        let res = await assetService.create(FormData, token)
        if (res.isErrored) {
            console.log(res.error)
        } else document.getElementById('missingAssetBox').classList.remove('ShowAssetAddingPrompt')

        if (missingAssetId.id && missingAssetId.e) handleTextInputChange(missingAssetId.id, missingAssetId.e).then(() => { setMissingAssetId(null) })
    }

    // Enter button listener
    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e, true)
    }

    // Handles the confirmation of the deletion of an asset
    const handleDelete = (id, e, row) => {
        let jc = 'unknown'
        for (let i of jobCodes) if (i.id === row.job_code) jc = i.job_name
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className='confirm-alert'>
                        <h1>Confirm the deletion</h1>
                        <br />
                        <h2>Asset: {row.asset_id}</h2>
                        <h3>Job: {jc}</h3>
                        {row.notes ? <p>{row.notes}</p> : undefined}
                        <span style={{ margins: '1rem' }}>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#e67c52', margin: '1rem' }} onClick={() => {
                                sendDelete(id, e)
                                onClose()
                            }}
                            >Confirm</Button>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                onClose()
                            }}>Nevermind</Button>
                        </span>
                    </div>
                )
            },
            closeOnEscape: true,
            closeOnClickOutside: true
        })
    }

    // Used by handleDelete, sends the delete request to the API
    async function sendDelete(id, e) {
        let res = await assetService.delete(id, getDate(date), token, location.state && location.state.uid)
        const response = await fetch(APILink.concat(getDate(date)), {
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        });
        const d = await response.json();
        setData(d);

        if (res.isErrored) {
            alert('Failed to delete. Try again or see Thomas if it continues to fail')
            console.log(res.error)
        }
    }

    const handleOverrideResend = async (formData, isEdit) => {
        formData.ruleOverride = true
        let res = isEdit ? await assetService.edit(formData, token) : await assetService.add(formData, token)
        if (res.isErrored) {
            console.log(res.error)
        } else if (!isEdit) {
            if (!isEdit && res.data.watching && res.data.watching.length) alert(`This asset is being watched by:\n${res.data.watching.join(', ')}`)
            const response = await fetch(APILink.concat(getDate(date)), {
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Access-Control-Allow-Origin': '*',
                    'X-Version': require('../backendVersion.json').version
                }
            });
            const d = await response.json();
            let new_assetid = document.getElementById('new-assetid'), new_notes = document.getElementById('new-notes'), new_job = document.getElementById('new-jobcode'), new_branch = document.getElementById('new-branch')
            if (new_assetid) { new_assetid.value = ''; if (new_assetid.classList.contains('invalid')) new_assetid.classList.remove('invalid') }
            if (new_notes) { new_notes.value = ''; if (new_notes.classList.contains('invalid')) new_notes.classList.remove('invalid') }
            if (new_job && new_job.classList.contains('invalid')) new_job.classList.remove('invalid')
            if (new_branch) new_branch.value = ''
            setNewJob({ newJobCode: newJob.newJobCode, newAssetTag: '', newComment: '', newBranch: '' })
            setData(d);

            // If deploying a replacement, prompt for return info
            for (let i of jobCodes)
                if (i.id === formData.job_code && i.usage_rule_group === 'deploy' && i.job_code.toLowerCase().includes('replace'))
                    handleReturn(formData)
        }
    }

    // Handles adding/removing a job code from favorites
    const handleFavorite = async (job_code) => {
        let data = { type: 'asset', isRemove: 0, job_id: `${job_code}` }
        if (favorites.includes(`${job_code}`)) data.isRemove = 1

        let q = await User.updateFavorites(data, token)
        if (q.isErrored) return alert('Failed to update favorites')

        getFavorites()
    }

    // Gets an array of {name, value} for job codes to use in react-select-search
    const getJobArray = () => {
        let ar = []
        for (let i of jobCodes) {
            if (i.is_hourly) continue
            ar.push({ name: i.job_code, value: i.id })
        }
        return ar
    }

    // Handles the copying logic of asset id's to clipboard
    const copySelected = () => {
        let s = ''
        if (selected.length === data.records.length) s = data.records.map(m => m.asset_id).join('\n')
        else s = [...data.records].filter(v => selected.includes(v.id)).map(m => m.asset_id).join('\n')
        navigator.clipboard.writeText(s).then(() => {
            let ele = document.getElementById('copy_content')
            ele.classList.add('success')
            ele.innerText = 'done'
            setTimeout(() => {
                try {
                    ele.classList.remove('success')
                    ele.innerText = 'content_copy'
                } catch (er) { }
            }, 1500)
        })
    }

    // Gets the restricted comments for a job code
    const getRestrictedComments = (jobId, array = false) => {
        let job
        for (let i of jobCodes) if (i.id === jobId) job = i
        if (!job) { console.log('no job found for', jobId); return null }
        if (!job.restricted_comments) return null
        if (array) return job.restricted_comments.split(',')
        return job.restricted_comments.split(',').map(m => { return { value: m, label: m } })
    }

    // Check if a job code should prompt a count
    const jobPromptsCount = jobId => {
        let job
        for (let i of jobCodes) if (i.id === jobId) job = i
        if (!job) { console.log('no job found for', jobId); return false }
        if (job.prompt_count) return true
        return false
    }
    // --- End functions --- //

    // Gets the restricted comments of the job code in the new line
    let newJobRestrictedComments
    if (newJob.newJobCode) newJobRestrictedComments = getRestrictedComments(newJob.newJobCode)

    // Renderer of each asset row
    function RenderRow(row) {
        // Get asset id
        let asset = row.asset_id

        // Get the job code information
        let job
        for (let i of jobCodes) {
            if (i.id === row.job_code) {
                job = i
                if (!i.requires_asset) {
                    if (noAssetJobCounts[i.id]) { noAssetJobCounts[i.id]++; asset = noAssetJobCounts[i.id] }
                    else { noAssetJobCounts[i.id] = 1; asset = 1 }
                }
            }
        }

        // Get the default restricted comments if applicable
        let defaultRestrictedComment = []
        let restrictedComments = getRestrictedComments(row.job_code)
        if (restrictedComments) {
            let flatrs = restrictedComments.map(m => m.value)
            if (row.notes) for (let i of row.notes.split(',')) if (flatrs.includes(i)) defaultRestrictedComment.push({ value: i, label: i })
        }

        // Check for duplicate asset
        let duplicate = false
        for (let i of data.records) if (i.id === row.id) continue; else if (i.asset_id && asset === i.asset_id && i.job_code === row.job_code) duplicate = true

        // Return the JSX
        return (<tr id={`${row.id}-row`} key={`${row.id}-row`} >
            <td><Checkbox id={`${row.id}-isHourly`}
                checked={selected.includes(row.id)}
                borderWidth='2px'
                borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                size='30px'
                icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={30} />}
                onChange={e => { e ? setSelected([...selected, row.id]) : setSelected([...selected].filter(i => i !== row.id)) }} /></td>
            {showTimestamp ? location.state && location.state.isReport ? <td><input
                type='time'
                className='time'
                defaultValue={row.time.substr(11, 5)}
                onBlur={e => { handleTextInputChange(row.id, e) }}
            /></td>
                : <td><p style={{ fontSize: '20px' }}>{formatAMPM(row.time)}</p></td> : undefined}
            <td>
                <SelectSearch
                    options={getJobArray()}
                    search
                    placeholder="Job Code"
                    value={row.job_code}
                    filterOptions={fuzzySearch}
                    className='job_list'
                    autoComplete='on'
                    onChange={e => handleTextInputChange(row.id, e)}
                    menuPlacement='auto'
                    id={`${row.id}-jobcode`}
                    renderOption={(optionProps) => <button {...optionProps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="material-icons favorite-icon" onMouseDown={e => { e.stopPropagation(); e.preventDefault() }} onClick={e => handleFavorite(optionProps.value)}>{favorites.includes(`${optionProps.value}`) ? 'star' : 'star_border'}</i>
                        {indexedJobCodes[optionProps.value]}
                    </button>} />
            </td>
            <td><div style={{ padding: 0, margin: 0, display: 'flex', alignContent: 'center' }}><input type='text'
                style={{ border: duplicate ? '3px solid #b8680d' : undefined }}
                defaultValue={asset}
                className='asset_id'
                id={`${row.id}-assetid`}
                onBlur={e => handleTextInputChange(row.id, e)}
                onKeyDown={e => handleKeyDown(row.id, e)}></input>
                {row.image ? <img src={row.image} alt={row.asset_id} style={{ maxWidth: '2.5rem', maxHeight: '2.5rem', paddingTop: '.5rem', marginLeft: '1rem' }} /> : <></>}
            </div></td>
            <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {job.restricted_comments ?
                    <div style={{ width: '90%' }}>
                        <Select
                            options={restrictedComments}
                            isMulti
                            closeMenuOnSelect={false}
                            styles={selectStyles}
                            defaultValue={defaultRestrictedComment}
                            isSearchable
                            onChange={e => handleTextInputChange(row.id, e, false, true)}
                            menuPlacement='auto'
                        />
                    </div>
                    :
                    <input type='text'
                        defaultValue={row.notes ? row.notes : ''}
                        className='notes'
                        placeholder='Notes / Comments'
                        id={`${row.id}-notes`}
                        style={{ width: '79%', marginRight: '1rem' }}
                        onBlur={e => handleTextInputChange(row.id, e)}
                        onKeyDown={e => handleKeyDown(row.id, e)} />}
                <i className="material-icons delete-icon" onClickCapture={e => handleDelete(row.id, e, row)}>
                    delete_outline</i>
            </td>
            <td><div style={{ padding: 0, margin: 0, display: 'flex', alignContent: 'center' }}><input type='text'
                style={{ border: duplicate ? '3px solid #b8680d' : undefined }}
                defaultValue={row.branch}
                placeholder='Branch'
                className='branch'
                id={`${row.id}-branch`}
                onBlur={e => handleTextInputChange(row.id, e)}
                onKeyDown={e => handleKeyDown(row.id, e)}></input>
            </div></td>
        </tr >)
    }

    // Returns blank page if data is loading
    if (loading || !data || !jobCodes || !token) return <></>
    else return (
        <>
            <div style={{ position: 'absolute', top: '8vh', left: '13vw', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(removeDay(date)) }}>navigate_before</i>
                <input type='date' className='date' id='date_selector' value={getDate(date)} onChange={handleDateChange} />
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(addDay(date)) }}>navigate_next</i>
            </div>
            <div style={{ position: 'absolute', top: '8vh', right: '2vw', display: 'inline-flex', alignItems: 'center' }}>
                {selected.length > 0 ? <>
                    <i id='copy_content' className='material-icons DateArrows' style={{ padding: '1rem' }} onClickCapture={() => { copySelected() }}>content_copy</i>
                </> : undefined}
                <i className='material-icons DateArrows' style={{ padding: '1rem' }} onClickCapture={() => { localStorage.setItem('showTimestamp', !showTimestamp); setShowTimestamp(!showTimestamp) }}>schedule</i>
                <i className='material-icons DateArrows' style={{ padding: '1rem' }} onClickCapture={() => { localStorage.setItem('newestOnTop', !newestOnTop); setNewestOnTop(!newestOnTop) }}>sort</i>
            </div>

            {location.state && location.state.isReport ?
                <div style={{ position: 'absolute', top: '2vh', width: '100vw', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p>Viewing {location.state.name}'s workbook</p>
                </div>
                : undefined
            }
            <div className='AssetArea' style={{ top: '14vh', height: '86vh' }}>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th style={{ margin: '0', padding: '1rem', width: '2rem' }}><Checkbox checked={selected.length === data.records.length}
                                borderWidth='2px'
                                borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                                style={{ backgroundColor: '#1b1b1b67' }}
                                size='30px'
                                icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={30} />}
                                onChange={e => { e ? setSelected(data.records.map(m => m.id)) : setSelected([]) }} /></th>
                            {showTimestamp ? <th>Time</th> : undefined}
                            <th>Job Code</th>
                            <th>Asset Tag / IMEI</th>
                            <th>Comments</th>
                            <th style={{ width: '10%' }}>Branch</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newestOnTop ? undefined : data.records ? data.records.map(m => RenderRow(m)) : undefined}
                        <tr style={{ borderTop: '1px' }}>
                            <td style={{ borderBottom: newestOnTop ? '1px solid #ddd' : '' }}></td>
                            {showTimestamp ? <td style={{ borderBottom: newestOnTop ? '1px solid #ddd' : '' }} /> : undefined}
                            <td style={{ borderBottom: newestOnTop ? '1px solid #ddd' : '' }}>
                                <SelectSearch
                                    options={getJobArray()}
                                    search
                                    placeholder="Job Code"
                                    value={newJob.newJobCode ? newJob.newJobCode : null}
                                    filterOptions={fuzzySearch}
                                    className='job_list'
                                    autoComplete='on'
                                    onChange={e => handleTextInputChange('new', e)}
                                    menuPlacement='auto'
                                    id={`new-jobcode`}
                                    renderOption={(optionProps) => <button {...optionProps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="material-icons favorite-icon" onMouseDown={e => { e.stopPropagation(); e.preventDefault() }} onClick={e => handleFavorite(optionProps.value)}>{favorites.includes(`${optionProps.value}`) ? 'star' : 'star_border'}</i>
                                        {indexedJobCodes[optionProps.value]}
                                    </button>} />
                            </td>
                            <td style={{ borderBottom: newestOnTop ? '1px solid #ddd' : '' }}>
                                <input type='text' placeholder='Asset Tag / IMEI' className='asset_id' id={`new-assetid`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input>
                            </td>
                            <td style={{ borderBottom: newestOnTop ? '1px solid #ddd' : '' }}>
                                {newJobRestrictedComments ?
                                    <Select
                                        options={newJobRestrictedComments}
                                        isMulti
                                        closeMenuOnSelect={false}
                                        styles={selectStyles}
                                        defaultValue={[]}
                                        isSearchable
                                        onChange={e => handleTextInputChange('new', e, false, true)}
                                        menuPlacement='auto'
                                    />
                                    :

                                    <input type='text' placeholder='Comments' className='notes' id={`new-notes`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input>
                                }
                            </td>
                            <td style={{ borderBottom: newestOnTop ? '1px solid #ddd' : '' }}>
                                <input type='text' placeholder='Branch' className='branch' id={`new-branch`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input>
                            </td>
                        </tr>
                        {newestOnTop ? data.records ? data.records.slice(0).reverse().map(m => RenderRow(m)) : undefined : undefined}
                    </tbody>
                </table>
            </div>
            <div id='missingAssetBox' className='AddAssetPrompt'>
                <h1 style={{ textDecoration: 'underline', marginLeft: '3rem', marginRight: '3rem' }}>Asset Does Not Exist:</h1>
                <h3 id='missingAssetId' style={{ color: 'white', padding: '1rem', backgroundColor: '#1b1b1b', borderRadius: '.5rem', border: 'white solid 3px', fontFamily: 'Consolas, monaco, monospace' }}>Asset</h3>
                {props.permissions.edit_assets || props.isAdmin ? <ModelSelect setModelSelect={setModelSelect} modelSelect={modelSelect} /> : <></>}
                <div style={{ padding: 0, margin: 0, display: 'flex', justifyContent: 'space-evenly' }}>
                    {props.permissions.edit_assets || props.isAdmin ? <Button variant='contained' color='primary' size='large' style={{ padding: 0, margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => { handleAssetAdding() }}>Add</Button> : <></>}
                    <Button variant='contained' color='primary' size='large' style={{ padding: 0, margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#e67c52' }} onClick={() => {
                        document.getElementById('missingAssetBox').classList.remove('ShowAssetAddingPrompt')
                    }}>Back</Button>
                </div>
            </div>
        </>
    )
}

export default AssetPage

/**
 * Gets YYYY-MM-DD format of a date object
 * @param {Date} date 
 * @returns {String}
 */
function getDate(date) {
    date = new Date(date)
    return date.toISOString().split('T')[0]
}

/**
 * Gets YYYY-MM-DD format of the next day of a date object
 * @param {Date} date 
 * @returns {String}
 */
function addDay(date) {
    date = new Date(date)
    date.setTime(date.getTime() + 86400000)
    return date.toISOString().split('T')[0]
}

/**
 * Gets YYYY-MM-DD format of the previous day of a date object
 * @param {Date} date 
 * @returns {String}
 */
function removeDay(date) {
    date = new Date(date)
    date.setTime(date.getTime() - 86400000)
    return date.toISOString().split('T')[0]
}

/**
 * Gets HH:MM A/PM format of a ISO String
 * @param {String} date 
 * @returns {String}
 */
function formatAMPM(date) {
    let hours = date.substring(11, 13)
    let minutes = date.substring(14, 16)
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return hours + ':' + minutes + ' ' + ampm;
}

export { getDate, addDay, removeDay, formatAMPM }