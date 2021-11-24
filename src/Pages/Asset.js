import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import assetService from '../Services/Asset'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import { Button } from '@material-ui/core';
import '../css/Asset.css'
const settings = require('../settings.json')

function AssetPage(props) {
    const { instance, accounts } = useMsal()
    let APILink = props.location.state && props.location.state.isReport ? `${settings.APIBase}/reports/asset/user/${props.location.state.uid}/` : `${settings.APIBase}/asset/user/`

    const [date, setDate] = useState(props.location.state ? props.location.state.date || Date.now() : Date.now())
    const [jobCodes, setJobCodes] = useState(null);
    const [newJobCode, setNewJobCode] = useState(0);
    const [newAssetTag, setNewAssetTag] = useState('');
    const [newComment, setNewComment] = useState('');
    const [missingAssetId, setMissingAssetId] = useState(null)
    const noAssetJobCounts = {}
    const { loading, data = [], setData } = useFetch(APILink.concat(getDate(date)), null)
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
        async function getJobCodes() {
            let t = await getTokenSilently()
            const response = await fetch(`${settings.APIBase}/job/all`, {
                mode: 'cors',
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Authorization': `Bearer ${t}`
                }
            });
            const data = await response.json();
            setJobCodes(data.job_codes)
        }
        getJobCodes()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                if (res.error && res.error.status === 406) {
                    document.getElementById(`${id}-assetid`).value = '';
                    alert(`Job code not compatable with asset's model type`)
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
                    if (res.error.status === 406) {
                        alert(`Job code not compatable with asset's model type`)
                        document.getElementById(`${id}-assetid`).value = ''
                        if (document.getElementById(`${id}-jobcode`)) document.getElementById(`${id}-jobcode`).classList.add('invalid')
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
        if (document.getElementById('model_input').classList.contains('invalid')) document.getElementById('model_input').classList.remove('invalid')
        let model = document.getElementById('model_input').value
        if (!model) return document.getElementById('model_input').classList.add('invalid')

        // Get asset
        let asset = document.getElementById('missingAssetId').innerText
        if (!asset) { console.log('Asset missing from asset adding function'); document.getElementById('model_input').classList.add('invalid'); return }

        let FormData = { model_id: model, asset_id: asset }
        const t = await getTokenSilently()
        let res = await assetService.create(FormData, t)
        if (res.isErrored) {
            document.getElementById('model_input').value = `Invalid Model Number`
            document.getElementById('model_input').classList.add('invalid')
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
                    id={`${row.id}-jobcode`}
                />
            </td>
            <td><input type='text'
                defaultValue={asset}
                className='asset_id'
                id={`${row.id}-assetid`}
                onBlur={e => handleTextInputChange(row.id, e)}
                onKeyDown={e => handleKeyDown(row.id, e)}></input></td>
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
            <div className='AssetArea'>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th>Job Code</th>
                            <th>Asset Tag / IMEI</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.records ? data.records.map(m => RenderRow(m)) : <></>}
                        <tr>
                            <td>
                                <SelectSearch
                                    options={getJobArray()}
                                    search
                                    placeholder="Job Code"
                                    filterOptions={fuzzySearch}
                                    className='job_list'
                                    autoComplete='on'
                                    onChange={e => handleTextInputChange('new', e)}
                                    id='new-jobcode'
                                />
                            </td>
                            <td><input type='text' placeholder='Asset Tag / IMEI' className='asset_id' id={`new-assetid`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td><input type='text' placeholder='Comments' className='notes' id={`new-notes`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='1' {...props} />
            <div id='missingAssetBox' className='AddAssetPrompt'>
                <h1 style={{ textDecoration: 'underline', marginLeft: '3rem', marginRight: '3rem' }}>Asset Does Not Exist:</h1>
                <h3 id='missingAssetId' style={{ color: 'white', padding: '1rem', backgroundColor: '#1b1b1b', borderRadius: '.5rem', border: 'white solid 3px', fontFamily: 'Consolas, monaco, monospace' }}>Asset</h3>
                {props.permissions.edit_assets || props.isAdmin ? <input id='model_input' type='text' className='notes' placeholder='Model Number' /> : <></>}
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