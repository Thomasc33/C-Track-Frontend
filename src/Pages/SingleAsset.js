import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import CircularProgress from '@mui/material/CircularProgress';
import settings from '../settings.json'
import AssetService from '../Services/Asset'
import { Button } from '@material-ui/core';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';
import axios from 'axios';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import ModelSelect from '../Components/ModelSelect';
import '../css/SingleAsset.css'

const dontRender = ['id', 'image', 'status']
const editable = ['return_reason', 'notes', 'model_number', 'company', 'icc_id']
const nameOverrides = {
    icc_id: 'ICCID'
}


function AssetsPage(props) {
    let APILink = `${settings.APIBase}/asset`
    const { instance, accounts } = useMsal()
    const [asset, setAsset] = useState(null)
    const [assetHistory, setHistory] = useState([])
    const [results, setResults] = useState([])
    const [jobCodes, setJobCodes] = useState(null)
    const [editName, setEditName] = useState(false)
    const [uid, setUid] = useState(null)
    const [search, setSearch] = useState(props.searchTerm || new URLSearchParams(props.location.search).get('q'))
    const [modelSelect, setModelSelect] = useState(null)
    const [modelInfo, setModelInfo] = useState(null)

    useEffect(() => {
        if (!search) return
        setAsset(null)
        getJobCodes()
        getAssetInfo()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    if (!props.permissions.view_assets && !props.isAdmin) return <Redirect to='/' />

    async function getJobCodes() {
        let t = await getTokenSilently()
        const response = await fetch(`${settings.APIBase}/job/full`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${t}`
            }
        });
        const data = await response.json();
        let jc = {}
        for (let i of data.job_codes) { jc[i.id] = i.job_name }
        setJobCodes(jc)
    }

    async function getAssetInfo() {
        let data = {}
        const token = await getTokenSilently()
        let res = await axios.get(`${APILink}/get/${search}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*'
            }
        })
        setModelInfo(null)
        if (res.isErrored) return console.log(res)
        if (res.data.resu.notFound) return setAsset(res.data.resu) // Not found
        setUid(res.data.uid)
        if (res.data.resu.length === 1 || props.assetOnly) { //1 result found
            if (res.data.resu[0].type === 'model') { // if the only result is a model
                console.log(res.data.resu[0])
                setModelInfo({
                    ...res.data.resu[0]
                })
            } else {
                setHistory(res.data.resu[0].history)
                data = { ...res.data.resu[0].info }
                res = await axios.get(`${settings.APIBase}/model/get/${data.model_number}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Access-Control-Allow-Origin': '*'
                    }
                })
                if (res.isErrored) console.log(res)
                else data = { ...data, ...res.data.resu }
                setAsset(data)
            }
        } else {
            let assets = new Set()
            let results = []
            for (let i of res.data.resu) {
                if (assets.has(i.info.id)) continue
                if (i.type === 'model') {
                    console.log(i)
                    let info = {
                        type: i.type,
                        data: i.info,
                        history: undefined,
                        assets: i.assets
                    }
                    results.push(info)
                } else {
                    assets.add(i.info.id)
                    let info = { history: i.history, type: i.type }
                    res = await axios.get(`${settings.APIBase}/model/get/${i.info.model_number}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Access-Control-Allow-Origin': '*'
                        }
                    })
                    if (res.isErrored) console.log(res)
                    else info.data = { ...i.info, ...res.data.resu }
                    results.push(info)
                }

            }
            console.log(results)
            setResults(results)
        }
    }

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

    const handleTextInputChange = async (row, e) => {
        if (!editable.includes(row) || !(props.permissions.edit_assets || props.isAdmin) || modelInfo) return
        if (e.target && e.target.value === asset[row]) return
        if (!e.target && !e) return
        let formData = {
            id: search,
            change: row,
            value: e.target ? e.target.value : e
        }
        if (!formData.value) formData.value = ''

        let token = await getTokenSilently()
        let res = await AssetService.singleEdit(formData, token)
        if (res.isErrored) { e.target.classList.add('invalid'); console.warn(res.error) }
        if (row === 'model_number') getAssetInfo()
    }

    const handleWatchUnWatch = async e => {
        const token = await getTokenSilently()
        const FormData = { id: asset.id }
        if (e) await AssetService.watch(FormData, token)
        else await AssetService.unwatch(FormData, token)
    }

    const handleLocking = async e => {
        const token = await getTokenSilently()
        const FormData = { id: asset.id }
        if (e) await AssetService.lock(FormData, token)
        else await AssetService.unlock(FormData, token)
    }

    const handleAssetAdding = async () => {
        if (!modelSelect) return

        let FormData = { model_id: modelSelect, asset_id: search }
        const t = await getTokenSilently()
        let res = await AssetService.create(FormData, t)
        if (res.isErrored) {
            alert(`Model not added: ${res.error.message}`)
            console.warn(res.error)
        } else { let s = search; setSearch(null); setSearch(s) }
    }

    const handleKeyDown = (row, e) => {
        if (e.code === 'Enter') handleTextInputChange(row, e)
    }

    function renderResultsRow(row) {
        console.log('row', row)
        return <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', borderRadius: '1rem', background: '#1b1b1b67', padding: '1rem', margin: '1rem', cursor: 'pointer' }}
            onClick={() => { if (row.type === 'model') { setModelInfo({ type: 'model', info: row.data, assets: row.assets }) } else { setAsset(row.data); setHistory(row.history) } }}>
            {row.type === 'asset' || row.type === 'tracker' ?
                <>
                    <h2 style={{ fontWeight: '300' }}>Asset: {row.data.id}</h2>
                    <h2 style={{ fontWeight: '200' }}>Model: {row.data.model_number}</h2>
                    <h2 style={{ fontWeight: '200' }}>Status Changes: {row.history ? row.history.length : '0'}</h2>
                    <h2 style={{ fontWeight: '200' }}>Matched: {row.type === 'asset' ? 'Asset' : 'Tracker Comment'}</h2>
                </>
                :
                <>
                    <h2 style={{ fontWeight: '300' }}>Model: {row.data.model_number}</h2>
                    <h2 style={{ fontWeight: '200' }}>Model Name: {row.data.name}</h2>
                    <h2 style={{ fontWeight: '200' }}>Device Count: {row.assets.length}</h2>
                    <h2 style={{ fontWeight: '200' }}>Matched: Model</h2>
                </>
            }
        </div>
    }

    function renderRow(row) {
        let val = 'Unknown'
        if (modelInfo) val = modelInfo.info[row]
        else switch (row) {
            case 'status':
                val = jobCodes[asset[row]] || asset[row]
                break;
            default:
                val = asset[row]
        }
        return (
            <tr key={row} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <td style={{ width: '30%' }}>{nameOverrides[row] ? nameOverrides[row] : titleCase(row.replace('_', ' '))}</td>
                <td style={{ width: '70%' }}>
                    {row.toLowerCase() === 'notes' ?
                        <textarea
                            defaultValue={val}
                            id={`${row}`}
                            style={{ padding: '1rem', margin: '.5rem', height: '10rem', width: '87.5%' }}
                            readOnly={editable.includes(row) && (props.permissions.edit_assets || props.isAdmin) ? false : true}
                            onBlur={e => handleTextInputChange(row, e)}
                            onKeyDown={e => handleKeyDown(row, e)} />
                        :
                        row.toLowerCase() === 'watching' ?
                            <Checkbox id={`${row}`}
                                checked={asset && asset.watching ? asset.watching.includes(`${uid}`) : false}
                                borderWidth='2px'
                                borderColor={localStorage.getItem('accentColor') || '#e3de00'}
                                style={{ margin: '1rem', marginLeft: '3rem', backgroundColor: '#1b1b1b67' }}
                                size='30px'
                                icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e3de00'} size={30} />}
                                onChange={(e) => handleWatchUnWatch(e)} /> :
                            row.toLowerCase() === 'locked' ?
                                <Checkbox id={`${row}`}
                                    checked={asset && asset.locked ? true : false}
                                    borderWidth='2px'
                                    borderColor={localStorage.getItem('accentColor') || '#e3de00'}
                                    style={{ margin: '1rem', marginLeft: '3rem', backgroundColor: '#1b1b1b67' }}
                                    size='30px'
                                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e3de00'} size={30} />}
                                    onChange={(e) => handleLocking(e)} /> :
                                row.toLowerCase() === 'company' ?
                                    <div style={{ paddingLeft: '1.4rem', margin: '.5rem', width: '94%' }}>
                                        <SelectSearch
                                            options={companies}
                                            value={val}
                                            search
                                            placeholder="Company"
                                            filterOptions={fuzzySearch}
                                            className='model_select'
                                            autoComplete='on'
                                            id='company_select'
                                            onChange={e => handleTextInputChange(row, e)}
                                        /></div> :
                                    <input type='text'
                                        defaultValue={val}
                                        id={`${row}`}
                                        style={{ margin: '.5rem', width: '79%' }}
                                        readOnly={editable.includes(row) && (props.permissions.edit_assets || props.isAdmin) ? false : true}
                                        onBlur={e => handleTextInputChange(row, e)}
                                        onKeyDown={e => handleKeyDown(row, e)} />
                    }

                </td>
            </tr>
        )
    }

    function renderHistoryRow(row) {
        let d = new Date(row.date)
        let date = `${parseInt(d.getMonth()) + 1}-${parseInt(d.getDate()) + 1}-${d.getFullYear()}`
        let time = ''
        if (row.time) { let t = row.time.slice(11, 16); time = formatAMPM(t) }
        return (
            <tr key={row.id}>
                <td><p>{row.name}</p></td>
                <td><p>{jobCodes[row.job_code]}</p></td>
                <td><p>{date} {time}</p></td>
                <td style={{ maxWidth: '20vw' }}><p>{row.notes || 'None'}</p></td>
            </tr>
        )
    }

    function renderModelsAssetsRow(row) {
        return (
            <tr key={row.id}>
                <td style={{ cursor: 'pointer' }} onClick={e => { props.history.push(`/search?q=${row.id}`); setSearch(row.id) }}><p>{row.id}</p></td>
                <td><p>{jobCodes[row.status]}</p></td>
                <td><p>{row.company}</p></td>
                <td><p>{row.locked ? 'Yes' : 'No'}</p></td>
                <td style={{ maxWidth: '20vw' }}><p>{row.notes || 'None'}</p></td>
            </tr>
        )
    }

    async function changeAssetName(e, oldName) {
        if (!props.permissions.edit_models && !props.isAdmin) return console.log('missing perms')
        let newName = document.getElementById('newNameInput').value
        if (!newName) return
        let token = await getTokenSilently()
        if (!token) return
        let res = await AssetService.rename({ oldName, newName }, token)
        if (res.isErrored) return alert(`Error changing name: ${res.error.status}`)
        setEditName(false)
        setAsset({ ...asset, id: newName })
        props.history.push(`/search?q=${newName}`)
    }

    function nextAsset() {
        let j
        for (let i in results) { // Get current index and add 1/reset to 0
            if (results[i].type === 'model') {
                if (modelInfo && results[i].data.model_number === modelInfo.info.model_number) {
                    if (`${i}` === `${results.length - 1}`) j = 0;
                    else j = parseInt(i) + 1
                }
            } else {
                if (asset && results[i].data.id === asset.id) {
                    if (`${i}` === `${results.length - 1}`) j = 0;
                    else j = parseInt(i) + 1
                }
            }
        }
        if (isNaN(j)) return alert("Error going to next")
        if (results[j].type === 'model') {
            setHistory([])
            setAsset(null)
            setModelInfo({ type: 'model', info: results[j].data, assets: results[j].assets })
        } else {
            setModelInfo(null)
            setHistory(results[j].history)
            setAsset(results[j].data)
        }
    }

    return (
        <>
            <PageTemplate highLight='4' {...props} setSearch={setSearch} />
            <div className='AssetArea'>
                {!search ? <h1>No search term provided</h1> :
                    modelInfo ?
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524E00' }} onClick={() => { setModelInfo(null) }}>Back</Button> : <></>}
                                <h1>Model Information: {modelInfo.info.model_number}</h1>
                                {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524E00' }} onClick={() => { nextAsset() }}>Next</Button> : <></>}
                            </div>
                            <hr />
                            <div style={{ display: 'flex' }}>
                                <table style={{ width: modelInfo.info.image ? '60%' : '100%' }}><tbody>
                                    {Object.keys(modelInfo.info).map(m => { if (!dontRender.includes(m)) return renderRow(m); else return <></> })}
                                </tbody></table>
                                {modelInfo.info.image ? <img style={{ width: '40%', height: 'auto', objectFit: 'contain' }} src={modelInfo.info.image} alt='Asset' /> : <></>}
                            </div>
                            <h1>Assets</h1>
                            <hr />
                            <div style={{ display: 'flex' }}>
                                {modelInfo.assets && modelInfo.assets.length > 0 ?
                                    <table className='HistoryTable'>
                                        <thead>
                                            <tr>
                                                <th>Asset Tag</th>
                                                <th>Status</th>
                                                <th>Company</th>
                                                <th>Locked</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {modelInfo.assets.map(m => renderModelsAssetsRow(m))}
                                        </tbody>
                                    </table> :
                                    <h2>No Assets Found</h2>}
                            </div>

                        </div>
                        :
                        !asset ? results.length > 0 ? <div>
                            <h1>Search Results:</h1>
                            <hr />
                            {results.map(m => renderResultsRow(m))}
                        </div> : <CircularProgress size='6rem' /> :
                            asset.notFound ?
                                <div>
                                    <h1>{search} not found</h1>
                                    {props.permissions.edit_models || props.isAdmin ? <div>
                                        <hr />
                                        <h2>Add it?</h2>
                                        <ModelSelect setModelSelect={setModelSelect} />
                                        <br />
                                        <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524E00' }} onClick={() => { handleAssetAdding() }}>Add</Button>
                                    </div>
                                        : <></>}
                                </div>
                                : <div style={{ overflow: 'scroll' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                        {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524E00' }} onClick={() => { setHistory([]); setAsset(null) }}>Back</Button> : <></>}
                                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <h1>Asset Information For: </h1>
                                            {editName ?
                                                <><input id='newNameInput' type='text' defaultValue={asset.id} style={{ fontSize: '2rem', marginLeft: '.5rem', width: 'auto', background: '#1b1b1b67', border: 'none', boxShadow: '0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', color: 'white' }} />
                                                    <i className="material-icons" style={{ padding: '.2em', cursor: 'pointer' }} onClick={(e) => {
                                                        changeAssetName(e, asset.id)
                                                    }}>done</i></> : <>
                                                    <h1 style={{ padding: '.2em' }}>{asset.id}</h1>
                                                    {props.permissions.edit_models || props.isAdmin ?
                                                        <i className="material-icons" style={{ padding: '.2em', cursor: 'pointer' }} onClick={(e) => { setEditName(true) }}>edit</i> : <></>} </>}
                                        </div>
                                        {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#524E00' }} onClick={() => { nextAsset() }}>Next</Button> : <></>}
                                    </div>
                                    <hr />
                                    <div style={{ display: 'flex' }}>
                                        <table style={{ width: asset.image ? '60%' : '100%' }}><tbody>
                                            {Object.keys(asset).map(m => { if (!dontRender.includes(m)) return renderRow(m); else return <></> })}
                                        </tbody></table>
                                        {asset.image ? <img style={{ width: '40%', height: 'auto', objectFit: 'contain' }} src={asset.image} alt='Asset' /> : <></>}
                                    </div>
                                    <br />
                                    <h1>Status History</h1>
                                    <hr />
                                    <div style={{ display: 'flex' }}>
                                        {assetHistory && assetHistory.length > 0 ? <table className='HistoryTable'><th>Technician</th><th>Status</th><th>Date</th><th>Notes</th>{assetHistory.map(m => renderHistoryRow(m))}</table> : <h2>No Changes Found</h2>}
                                    </div>
                                </div>
                }
            </div>
        </>
    )
}


export default AssetsPage

function titleCase(str) {
    let splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
}

function formatAMPM(time) {
    time = time.split(':')
    let hours = time[0]
    let minutes = time[1]
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12
    hours = hours ? hours : 12;
    minutes = minutes = ('0' + minutes).slice(-2);
    return hours + ':' + minutes + ' ' + ampm;
}

const companies = [
    { name: 'CURO', value: 'CURO' },
    { name: 'Palliative Care', value: 'Palliative Care' },
    { name: 'Home Health', value: 'Home Health' }
]