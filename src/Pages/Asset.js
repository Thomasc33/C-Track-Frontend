import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import assetService from '../Services/Asset'
import User from '../Services/User';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import { Button } from '@material-ui/core';
import ModelSelect from '../Components/ModelSelect';
import '../css/Asset.css'
const settings = require('../settings.json')

function AssetPage(props) {
    const { instance, accounts } = useMsal()
    let APILink = props.location.state && props.location.state.isReport ? `${settings.APIBase}/reports/asset/user/${props.location.state.uid}/` : `${settings.APIBase}/asset/user/`

    const [date, setDate] = useState(props.location.state ? props.location.state.date || Date.now() : Date.now())
    const [jobCodes, setJobCodes] = useState(null);
    const [favorites, setFavorites] = useState([])
    const [indexedJobCodes, setIndexJobCodes] = useState({})
    const [newJobCode, setNewJobCode] = useState(0);
    const [newAssetTag, setNewAssetTag] = useState('');
    const [newComment, setNewComment] = useState('');
    const [missingAssetId, setMissingAssetId] = useState(null)
    const noAssetJobCounts = {}
    const { loading, data = [], setData } = useFetch(APILink.concat(getDate(date)), null)
    const [modelSelect, setModelSelect] = useState(null)
    const [newestOnTop, setNewestOnTop] = useState(localStorage.getItem('newestOnTop') === 'true' || false)
    const [showTimestamp, setShowTimestamp] = useState(localStorage.getItem('showTimestamp') === 'true' || false)

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

    useEffect(() => {
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
        sort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function getFavorites() {
        let t = await getTokenSilently()
        const response = await fetch(`${settings.APIBase}/job/favorites/asset`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${t}`
            }
        });
        const data = await response.json();
        setFavorites(data.favorites)
        return data.favorites
    }

    async function getJobCodes(ignoreState = false) {
        let t = await getTokenSilently()
        const response = await fetch(`${settings.APIBase}/job/all/asset`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${t}`
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

    if (!props.permissions.use_asset_tracker && !props.isAdmin) return <Redirect to='/' />

    const handleDateChange = () => {
        setDate(document.getElementById('date_selector').value)
    }

    const handleTextInputChange = async (id, e) => {
        if (isNaN(parseInt(e))) { //checks to make sure e is real, not an int from select
            if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        } else {
            let ele = document.getElementById(`${id}-jobcode`)
            if (ele && ele.classList.contains('invalid')) ele.classList.remove('invalid')
        }
        if (id === 'new') {
            let dateString = new Date(date).toISOString().split('T')[0]
            let job_code = newJobCode;
            let asset = newAssetTag;
            let comment = newComment;
            if (!isNaN(parseInt(e))) { setNewJobCode(parseInt(e)); job_code = parseInt(e) }
            else switch (e.target.id) {
                case 'new-notes':
                    comment = e.target.value
                    await setNewComment(e.target.value)
                    break;
                case 'new-assetid':
                    asset = e.target.value
                    await setNewAssetTag(e.target.value)
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

            //send to api
            let formData = {
                date: dateString,
                job_code: job_code,
                asset_id: asset,
                notes: comment,
            }
            let token = await getTokenSilently()
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
                }
                else {
                    if (document.getElementById('new-assetid')) document.getElementById('new-assetid').classList.add('invalid')
                    try {
                        if (res.error.message.includes('Asset id not found')) {
                            document.getElementById('missingAssetBox').classList.add('Show')
                            document.getElementById('missingAssetId').innerText = `${asset}`
                            setMissingAssetId({ id: 'new', e })
                        }
                    }
                    catch (er) { }
                }
            } else {
                const response = await fetch(APILink.concat(getDate(date)), {
                    mode: 'cors',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Access-Control-Allow-Origin': '*'
                    }
                });
                const d = await response.json();
                let new_assetid = document.getElementById('new-assetid'), new_notes = document.getElementById('new-notes'), new_job = document.getElementById('new-jobcode')
                if (new_assetid) { new_assetid.value = ''; if (new_assetid.classList.contains('invalid')) new_assetid.classList.remove('invalid') }
                if (new_notes) { new_notes.value = ''; if (new_notes.classList.contains('invalid')) new_notes.classList.remove('invalid') }
                if (new_job && new_job.classList.contains('invalid')) new_job.classList.remove('invalid')
                setData(d);
                setNewComment('')
                setNewAssetTag('')
            }
        } else for (let i of data.records) {
            if (id === i.id) {
                //data validation
                let formData = {
                    id: i.id,
                    change: null
                }
                if (!isNaN(parseInt(e))) {
                    formData.change = 'job'
                    formData.value = parseInt(e)
                }
                else switch (e.target.className) {
                    case 'asset_id':
                        if (e.target.value !== i.asset_id) if (e.target.value) formData.change = 'asset'
                        break;
                    case 'notes':
                        if (e.target.value !== i.notes) formData.change = 'notes'
                        break;
                    default:
                        break;
                }

                if (!formData.change) return

                if (!formData.value) formData.value = e.target.value

                //send to api
                let token = await getTokenSilently()
                let res = await assetService.edit(formData, token)
                if (res.isErrored) {
                    if (res.error.message === 'Job code doesnt apply to model type') {
                        alert(`Job code not compatable with asset's model type`)
                        document.getElementById(`${id}-assetid`).value = ''
                        if (document.getElementById(`${id}-jobcode`)) document.getElementById(`${id}-jobcode`).classList.add('invalid')
                    }
                    if (res.error.message === 'Asset is Locked') {
                        console.log('locked')
                        alert(`This asset is currently locked and cannot be modified. Contact a site admin for more information`)
                    }
                    if (e.target) {
                        e.target.classList.add('invalid')
                        try {
                            if (e.target.className.includes('asset_id') && res.error.data.message.includes('Asset id not found')) {
                                document.getElementById('missingAssetBox').classList.add('Show')
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

    const handleAssetAdding = async () => {
        // Get model
        if (!modelSelect) return

        // Get asset
        let asset = document.getElementById('missingAssetId').innerText
        if (!asset) { console.log('Asset missing from asset adding function'); return }

        let FormData = { model_id: modelSelect, asset_id: asset }
        const t = await getTokenSilently()
        let res = await assetService.create(FormData, t)
        if (res.isErrored) {
            console.log(res.error)
        } else document.getElementById('missingAssetBox').classList.remove('Show')

        if (missingAssetId.id && missingAssetId.e) handleTextInputChange(missingAssetId.id, missingAssetId.e).then(() => { setMissingAssetId(null) })
    }

    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e)
    }

    const handleDelete = async (id, e) => {
        let token = await getTokenSilently()
        let res = await assetService.delete(id, getDate(date), token)
        const response = await fetch(APILink.concat(getDate(date)), {
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*'
            }
        });
        const d = await response.json();
        setData(d);

        if (res.isErrored) {
            e.target.classList.add('invalid')
        } else {
            let row = document.getElementById(`${id}-row`)
            if (row) row.remove()
        }
    }

    const handleFavorite = async (job_code) => {
        let data = { type: 'asset', isRemove: 0, job_id: `${job_code}` }
        if (favorites.includes(`${job_code}`)) data.isRemove = 1

        let token = await getTokenSilently()
        let q = await User.updateFavorites(data, token)
        if (q.isErrored) return alert('Failed to update favorites')

        getFavorites()
    }

    const getJobArray = () => {
        let ar = []
        for (let i of jobCodes) {
            if (i.is_hourly) continue
            ar.push({ name: i.job_code, value: i.id })
        }
        return ar
    }

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        let asset = row.asset_id
        for (let i of jobCodes) {
            if (i.id === row.job_code)
                if (!i.requires_asset) {
                    if (noAssetJobCounts[i.id]) { noAssetJobCounts[i.id]++; asset = noAssetJobCounts[i.id] }
                    else { noAssetJobCounts[i.id] = 1; asset = 1 }
                }
        }
        return (<tr id={`${row.id}-row`} key={`${row.id}-row`}>
            {showTimestamp ? <td><p style={{ fontSize: '20px' }}>{formatAMPM(row.time)}</p></td> : undefined}
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
                defaultValue={asset}
                className='asset_id'
                id={`${row.id}-assetid`}
                onBlur={e => handleTextInputChange(row.id, e)}
                onKeyDown={e => handleKeyDown(row.id, e)}></input>
                {row.image ? <img src={row.image} alt={row.asset_id} style={{ maxWidth: '2.5rem', maxHeight: '2.5rem', paddingTop: '.5rem', marginLeft: '1rem' }} /> : <></>}
            </div></td>
            <td style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <input type='text'
                    defaultValue={row.notes ? row.notes : ''}
                    className='notes'
                    placeholder='Notes / Comments'
                    id={`${row.id}-notes`}
                    style={{ width: '79%', marginRight: '1rem' }}
                    onBlur={e => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
                <i className="material-icons delete-icon" onClickCapture={e => handleDelete(row.id, e)}>
                    delete_outline</i>
            </td>
        </tr >)
    }

    //returns blank page if data is loading
    if (loading || !data || !jobCodes) return <PageTemplate highLight='1' {...props} />
    else return (
        <>
            <div style={{ position: 'absolute', top: '2%', left: '14%', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(removeDay(date)) }}>navigate_before</i>
                <input type='date' className='date' id='date_selector' value={getDate(date)} onChange={handleDateChange} />
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(addDay(date)) }}>navigate_next</i>
            </div>
            <div style={{ position: 'absolute', top: '4%', right: '4%', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { localStorage.setItem('showTimestamp', !showTimestamp); setShowTimestamp(!showTimestamp) }}>schedule</i>
                <i className='material-icons DateArrows' style={{ paddingLeft: '1rem' }} onClickCapture={() => { localStorage.setItem('newestOnTop', !newestOnTop); setNewestOnTop(!newestOnTop) }}>sort</i>
            </div>
            <div className='AssetArea'>
                <table className='rows'>
                    <thead>
                        <tr>
                            {showTimestamp ? <th>Time</th> : undefined}
                            <th>Job Code</th>
                            <th>Asset Tag / IMEI</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newestOnTop ? undefined : data.records ? data.records.map(m => RenderRow(m)) : undefined}
                        <tr style={{ borderTop: '1px' }}>
                            {showTimestamp ? <td /> : undefined}
                            <td>
                                <SelectSearch
                                    options={getJobArray()}
                                    search
                                    placeholder="Job Code"
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
                            <td><input type='text' placeholder='Asset Tag / IMEI' className='asset_id' id={`new-assetid`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td><input type='text' placeholder='Comments' className='notes' id={`new-notes`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                        </tr>
                        {newestOnTop ? data.records ? data.records.slice(0).reverse().map(m => RenderRow(m)) : undefined : undefined}
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='1' {...props} />
            <div id='missingAssetBox' className='AddAssetPrompt'>
                <h1 style={{ textDecoration: 'underline', marginLeft: '3rem', marginRight: '3rem' }}>Asset Does Not Exist:</h1>
                <h3 id='missingAssetId' style={{ color: 'white', padding: '1rem', backgroundColor: '#1b1b1b', borderRadius: '.5rem', border: 'white solid 3px', fontFamily: 'Consolas, monaco, monospace' }}>Asset</h3>
                {props.permissions.edit_assets || props.isAdmin ? <ModelSelect setModelSelect={setModelSelect} /> : <></>}
                <div style={{ padding: 0, margin: 0, display: 'flex', justifyContent: 'space-evenly' }}>
                    {props.permissions.edit_assets || props.isAdmin ? <Button variant='contained' color='primary' size='large' style={{ padding: 0, margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#e3de00' }} onClick={() => { handleAssetAdding() }}>Add</Button> : <></>}
                    <Button variant='contained' color='primary' size='large' style={{ padding: 0, margin: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#e3de00' }} onClick={() => {
                        document.getElementById('missingAssetBox').classList.remove('Show')
                    }}>Back</Button>
                </div>
            </div>
        </>
    )
}

export default AssetPage

/**
 * 
 * @param {Date} date 
 * @returns 
 */
function getDate(date) {
    date = new Date(date)
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

function formatAMPM(date) {
    let hours = date.substring(11, 13)
    let minutes = date.substring(14, 16)
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}