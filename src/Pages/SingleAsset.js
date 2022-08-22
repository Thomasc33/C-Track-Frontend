// Imports
import React, { useEffect, useState } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useMSAL } from '../Helpers/MSAL';
import { Button } from '@material-ui/core';
import { getDate } from './Asset';
import CircularProgress from '@mui/material/CircularProgress';
import settings from '../settings.json'
import AssetService from '../Services/Asset'
import Checkbox from 'react-custom-checkbox';
import axios from 'axios';
import ModelSelect from '../Components/ModelSelect';
import * as Icon from 'react-icons/fi';

// Global Constants

// Fields to not render
const dontRender = ['id', 'image']

// Fields that are not editable
const notEditable = ['status']

// Render First
const priorityRender = new Set(['status', 'model_number', 'location'])

// Fields to rename {fieldname: 'displayname'}
const nameOverrides = {
    icc_id: 'ICCID',
    hold_type: 'On Hold'
}


function AssetsPage(props) {
    // Hooks and Constants
    const nav = useNavigate()
    const location = useLocation()
    let APILink = `${settings.APIBase}/asset`
    const { token } = useMSAL()

    // States
    const [asset, setAsset] = useState(null)
    const [assetHistory, setHistory] = useState([])
    const [repairHistory, setRepairHistory] = useState([])
    const [results, setResults] = useState([])
    const [jobCodes, setJobCodes] = useState(null)
    const [editName, setEditName] = useState(false)
    const [uid, setUid] = useState(null)
    const [search, setSearch] = useState(props.searchTerm || new URLSearchParams(location.search).get('q'))
    const [modelSelect, setModelSelect] = useState(null)
    const [modelInfo, setModelInfo] = useState(null)
    const [onlyAsset, setOnlyAsset] = useState(!!new URLSearchParams(location.search).get('ao'))

    // Effects
    useEffect(() => {
        if (!search) return
        setAsset(null)
        setHistory([])
        setRepairHistory([])
        setResults([])
        setOnlyAsset(false)
        getJobCodes()
        getAssetInfo()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])
    useEffect(() => { // Update the search when the url changes
        setSearch(new URLSearchParams(location.search).get('q'))
    }, [location])

    // Return to Home page if user can't access this page
    if (!props.permissions.view_assets && !props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //
    async function getJobCodes() {
        const response = await fetch(`${settings.APIBase}/job/full`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        let jc = {}
        for (let i of data.job_codes) { jc[i.id] = i.job_name }
        setJobCodes(jc)
    }

    async function getAssetInfo() {
        let data = {}
        let res = await axios.get(`${APILink}/get?q=${search}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        })
        setModelInfo(null)
        if (res.isErrored) return console.log(res)
        if (res.data.resu.notFound) return setAsset(res.data.resu) // Not found
        setUid(res.data.uid)
        if (res.data.resu.length === 1 || onlyAsset) { //1 result found
            if (res.data.resu[0].type === 'model') { // if the only result is a model
                setModelInfo({
                    ...res.data.resu[0]
                })
            } else {
                setHistory(res.data.resu[0].history)
                setRepairHistory(res.data.resu[0].repairs)
                data = { ...res.data.resu[0].info }
                res = await axios.get(`${settings.APIBase}/model/get?q=${data.model_number}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Access-Control-Allow-Origin': '*',
                        'X-Version': require('../backendVersion.json').version
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
                    let info = {
                        type: i.type,
                        data: i.info,
                        history: undefined,
                        repair: undefined,
                        assets: i.assets
                    }
                    results.push(info)
                } else {
                    assets.add(i.info.id)
                    let info = { history: i.history, type: i.type, repairs: i.repairs }
                    res = await axios.get(`${settings.APIBase}/model/get?q=${i.info.model_number}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Access-Control-Allow-Origin': '*',
                            'X-Version': require('../backendVersion.json').version
                        }
                    })
                    if (res.isErrored) console.log(res)
                    else info.data = { ...i.info, ...res.data.resu }
                    results.push(info)
                }
            }
            setResults(results)
        }
    }


    // Main Function for editing rows
    const handleTextInputChange = async (row, e) => {
        if (notEditable.includes(row) || !(props.permissions.edit_assets || props.isAdmin) || modelInfo) return
        if (e.target && e.target.value === asset[row]) return
        if (!e.target && !e) return
        let formData = {
            id: search,
            change: row,
            value: e.target ? e.target.value : e
        }
        if (!formData.value) formData.value = ''
        let res = await AssetService.singleEdit(formData, token)
        if (res.isErrored) { e.target.classList.add('invalid'); console.warn(res.error) }
        if (row === 'model_number') getAssetInfo()
    }

    // Handles toggling watching/unwatching an asset
    const handleWatchUnWatch = async e => {
        const FormData = { id: asset.id }
        if (e) await AssetService.watch(FormData, token)
        else await AssetService.unwatch(FormData, token)
    }

    // Handles toggling lock on an asset
    const handleLocking = async e => {
        const FormData = { id: asset.id }
        if (e) await AssetService.lock(FormData, token)
        else await AssetService.unlock(FormData, token)
    }

    // Handles toggling hold on an asset
    const handleUnhold = async e => {
        const FormData = { id: asset.id }
        await AssetService.unHold(FormData, token)
    }

    // Handles adding a new asset
    const handleAssetAdding = async () => {
        if (!modelSelect) return

        let FormData = { model_id: modelSelect, asset_id: search }
        let res = await AssetService.create(FormData, token)
        if (res.isErrored) {
            alert(`Model not added: ${res.error.message}`)
            console.warn(res.error)
        } else { let s = search; setSearch(null); setSearch(s) }
    }

    // Enter event listener
    const handleKeyDown = (row, e) => {
        if (e.code === 'Enter') handleTextInputChange(row, e)
    }

    // Handles renaming an asset
    async function changeAssetName(e, oldName) {
        if (!props.permissions.edit_models && !props.isAdmin) return console.log('missing perms')
        let newName = document.getElementById('newNameInput').value
        if (!newName) return
        let res = await AssetService.rename({ oldName, newName }, token)
        if (res.isErrored) return alert(`Error changing name: ${res.error.status}`)
        setEditName(false)
        setAsset({ ...asset, id: newName })
        nav(`/search?q=${newName}`)
    }

    // Handles cycling through the results
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
            setRepairHistory([])
            setAsset(null)
            setModelInfo({ type: 'model', info: results[j].data, assets: results[j].assets })
        } else {
            setModelInfo(null)
            setHistory(results[j].history)
            setRepairHistory(results[j].repairs)
            setAsset(results[j].data)
        }
    }

    // --- Render --- //
    function renderResultsRow(row) {
        return <div key={row.data.id} style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', borderRadius: '1rem', background: '#1b1b1b67', padding: '1rem', margin: '1rem', cursor: 'pointer' }}
            onClick={() => { if (row.type === 'model') { setModelInfo({ type: 'model', info: row.data, assets: row.assets }) } else { setAsset(row.data); setHistory(row.history); setRepairHistory(row.repairs) } }}>
            {row.type === 'asset' || row.type === 'tracker' ?
                <>
                    <h2 style={{ fontWeight: '300' }}>Asset: {row.data.id}</h2>
                    <h2 style={{ fontWeight: '200' }}>Model: {row.data.model_number}</h2>
                    <h2 style={{ fontWeight: '200' }}>Status Changes: {row.history ? row.history.length : '0'}</h2>
                    <h2 style={{ fontWeight: '200' }}>Matched: {row.type === 'asset' ? 'Asset' : 'Tracker Comment'}</h2>
                </> : <>
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
                val = jobCodes[asset[row]] ? titleCase(jobCodes[asset[row]]) : asset[row]
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
                            readOnly={!notEditable.includes(row) && (props.permissions.edit_assets || props.isAdmin) ? false : true}
                            onBlur={e => handleTextInputChange(row, e)}
                            onKeyDown={e => handleKeyDown(row, e)} />
                        :
                        row.toLowerCase() === 'watching' ?
                            <Checkbox id={`${row}`}
                                checked={asset && asset.watching ? asset.watching.includes(`${uid}`) : false}
                                borderWidth='2px'
                                borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                                style={{ margin: '1rem', marginLeft: '3rem', backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                                size='30px'
                                icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                                onChange={(e) => handleWatchUnWatch(e)} /> :
                            row.toLowerCase() === 'locked' ?
                                <Checkbox id={`${row}`}
                                    checked={asset && asset.locked ? true : false}
                                    borderWidth='2px'
                                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                                    style={{ margin: '1rem', marginLeft: '3rem', backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                                    size='30px'
                                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                                    onChange={(e) => handleLocking(e)} /> :
                                row.toLowerCase() === 'hold_type' ?
                                    <Checkbox id={`${row}-hold`}
                                        checked={asset && asset.hold_type}
                                        disabled={!asset || !asset.hold_type}
                                        borderWidth='2px'
                                        borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                                        style={{ margin: '1rem', marginLeft: '3rem', backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                                        size='30px'
                                        icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                                        onChange={(e) => handleUnhold(e)} /> :
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
                                            readOnly={!notEditable.includes(row) && (props.permissions.edit_assets || props.isAdmin) ? false : true}
                                            onBlur={e => handleTextInputChange(row, e)}
                                            onKeyDown={e => handleKeyDown(row, e)} />
                    }

                </td>
            </tr>
        )
    }

    function renderAssetAdding(checkForMatch = false, addHr = false) {
        if (checkForMatch) {
            if (results.length > 0) for (let i of results) if (i.type === 'asset' && i.data && i.data.id && i.data.id.toLowerCase().trim() === search.toLowerCase().trim()) return undefined
            if (!asset || asset.id.toLowerCase().trim() === search.toLowerCase().trim()) return undefined
        }
        return <>
            {addHr ? <hr /> : undefined}
            <div><h1>{search} not found</h1>
                {props.permissions.edit_models || props.isAdmin ? <div>
                    <hr />
                    <h2>Add it?</h2>
                    <ModelSelect setModelSelect={setModelSelect} modelSelect={modelSelect} />
                    <br />
                    <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { handleAssetAdding() }}>Add</Button>
                </div>
                    : <></>
                }
            </div>
        </>
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

    function renderRepairRow(row) {
        let d = getDate(row.used_on)
        let t = formatAMPM(row.used_on.slice(11, 16))
        return (
            <tr key={row.id}>
                <td><p>{row.tech}</p></td>
                <td><p>{row.part_type}</p></td>
                <td><p>{row.part_number}</p></td>
                <td><p>{d} {t}</p></td>
            </tr>
        )
    }

    function renderModelsAssetsRow(row) {
        return (
            <tr key={row.id}>
                <td style={{ cursor: 'pointer' }} onClick={e => { nav(`/search?q=${row.id}`); setSearch(row.id) }}><p>{row.id}</p></td>
                <td><p>{jobCodes[row.status] ? titleCase(jobCodes[row.status]) : row.status}</p></td>
                <td><p>{row.company}</p></td>
                <td><p>{row.locked ? 'Yes' : 'No'}</p></td>
                <td style={{ maxWidth: '20vw' }}><p>{row.notes || 'None'}</p></td>
            </tr>
        )
    }

    return (
        <>
            <div className='AssetArea'>
                {!search ? <h1>No search term provided</h1> :
                    modelInfo ?
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { setModelInfo(null) }}>Back</Button> : <></>}
                                <h1>Model Information: {modelInfo.info.model_number}</h1>
                                {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { nextAsset() }}>Next</Button> : <></>}
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
                            <hr />
                            {renderAssetAdding()}
                        </div>
                        :
                        !asset ? results.length > 0 ? <div>
                            <h1>Search Results:</h1>
                            <hr />
                            {results.map(m => renderResultsRow(m))}
                            {renderAssetAdding(true, true)}
                        </div> : <CircularProgress size='6rem' /> :
                            asset.notFound ?
                                renderAssetAdding()
                                : <div style={{ overflow: 'scroll' }}>
                                    {renderAssetAdding(true) ? <>{renderAssetAdding(true)}<hr /><h2>The following has a matching comment:</h2></> : undefined}
                                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                        {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { setHistory([]); setAsset(null); setRepairHistory([]) }}>Back</Button> : <></>}
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
                                        {results.length > 0 ? <Button variant='contained' color='primary' size='large' style={{ padding: '1rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { nextAsset() }}>Next</Button> : <></>}
                                    </div>
                                    <hr />
                                    <div style={{ display: 'flex' }}>
                                        <table style={{ width: asset.image ? '60%' : '100%' }}><tbody>
                                            {Object.keys(asset).map(m => { if (priorityRender.has(m) && !dontRender.includes(m)) return renderRow(m); else return <></> })}
                                            <hr />
                                            {Object.keys(asset).map(m => { if (!priorityRender.has(m) && !dontRender.includes(m)) return renderRow(m); else return <></> })}
                                        </tbody></table>
                                        {asset.image ? <img style={{ width: '40%', height: 'auto', objectFit: 'contain' }} src={asset.image} alt='Asset' /> : <></>}
                                    </div>
                                    <br />
                                    <h1>Status History</h1>
                                    <hr />
                                    <div style={{ display: 'flex' }}>
                                        {assetHistory && assetHistory.length > 0 ? <table className='HistoryTable'><thead><th>Technician</th><th>Status</th><th>Date</th><th>Notes</th></thead><tbody>{assetHistory.map(m => renderHistoryRow(m))}</tbody></table> : <h2 style={{ width: '100%', textAlign: 'center' }}>No Changes Found</h2>}
                                    </div>
                                    <hr />
                                    <br />
                                    <h1>Repair History</h1>
                                    <hr />
                                    <div style={{ display: 'flex' }}>
                                        {repairHistory && repairHistory.length > 0 ? <table className='HistoryTable'><thead><th>Technician</th><th>Repair Type</th><th>Part Number</th><th>Repair Time</th></thead><tbody>{repairHistory.map(m => renderRepairRow(m))}</tbody></table> : <h2 style={{ width: '100%', textAlign: 'center' }}>No Changes Found</h2>}
                                    </div>
                                    <hr style={{ marginBottom: '2rem' }} />
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
    minutes = ('0' + minutes).slice(-2);
    return hours + ':' + minutes + ' ' + ampm;
}

const companies = [
    { name: 'CURO', value: 'CURO' },
    { name: 'Palliative Care', value: 'Palliative Care' },
    { name: 'Home Health', value: 'Home Health' }
]