import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import CircularProgress from '@mui/material/CircularProgress';
import settings from '../settings.json'
import AssetService from '../Services/Asset'
import '../css/SingleAsset.css'
import axios from 'axios';

const dontRender = ['id', 'image', 'status']
const editable = ['return_reason', 'notes', 'model_number']

function AssetsPage(props) {
    let APILink = `${settings.APIBase}/asset`
    const { instance, accounts } = useMsal()
    const [asset, setAsset] = useState()
    const [assetHistory, setHistory] = useState([])
    const [job_codes, setJobCodes] = useState(null)
    const search = props.searchTerm || new URLSearchParams(props.location.search).get('q')

    useEffect(() => {
        if (!search) return
        getJobCodes()
        getAssetInfo()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
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
        if (res.isErrored) return console.log(res)
        if (res.data.notFound) return setAsset(res.data)
        setHistory(res.data.history)
        data = { ...res.data.info }
        res = await axios.get(`${settings.APIBase}/model/get/${data.model_number}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*'
            }
        })
        if (res.isErrored) console.log(res)
        else data = { ...data, ...res.data }
        console.log(data)
        setAsset(data)
    }
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

    const handleTextInputChange = async (row, e) => {
        if (!editable.includes(row) || !props.permissions.edit_assets) return

        if (e.target.value === asset[row]) return
        let formData = {
            id: search,
            change: row,
            value: e.target.value
        }
        if (!formData.value) formData.value = ''

        let token = await getTokenSilently()
        let res = await AssetService.singleEdit(formData, token)
        if (res.isErrored) { e.target.classList.add('invalid'); console.warn(res.error) }
        if (row === 'model_number') getAssetInfo()
    }

    const handleKeyDown = (row, e) => {
        if (e.code === 'Enter') handleTextInputChange(row, e)
    }

    function renderRow(row) {
        let val = 'Unknown'
        switch (row) {
            case 'status':
                val = job_codes[asset[row]] || asset[row]
                break;
            default:
                val = asset[row]
        }
        return (
            <tr key={row}>
                <td style={{ width: '30%' }}>{titleCase(row.replace('_', ' '))}</td>
                <td style={{ width: '70%' }}>
                    <input type='text'
                        defaultValue={val}
                        id={`${row}`}
                        style={{ width: '79%' }}
                        readOnly={editable.includes(row) && (props.permissions.edit_assets || props.isAdmin) ? false : true}
                        onBlur={e => handleTextInputChange(row, e)}
                        onKeyDown={e => handleKeyDown(row, e)} />
                </td>
            </tr>
        )
    }
    function renderHistoryRow(row) {
        let d = new Date(row.date)
        let date = `${parseInt(d.getMonth()) + 1}-${d.getDate()}-${d.getFullYear()}`
        return (
            <tr key={row.id}>
                <td><p>{row.name}</p></td>
                <td><p>{job_codes[row.job_code]}</p></td>
                <td><p>{date}</p></td>
            </tr>
        )
    }
    return (
        <>
            <PageTemplate highLight='4' {...props} />
            <div className='AssetArea'>
                {!search ? <h1>No search term provided</h1> :
                    !asset ? <CircularProgress size='6rem' /> :
                        asset.notFound ?
                            <div>
                                <h1>{search} not found</h1>
                                {props.permissions.edit_models || props.isAdmin ? <div>
                                    <hr />
                                    <h2>Add it?</h2>
                                </div>
                                    : <></>}
                            </div>
                            : <div style={{ overflow: 'scroll' }}>
                                <h1>Asset Information For:</h1>
                                <h1>{search}</h1>
                                <hr />
                                <div style={{ display: 'flex' }}>
                                    <table style={{ width: asset.image ? '60%' : '100%' }}><tbody>
                                        {Object.keys(asset).map(m => { if (!dontRender.includes(m)) return renderRow(m); else return <></> })}
                                    </tbody></table>
                                    <img style={{ width: '40%', height: 'auto', objectFit: 'contain' }} src={asset.image} alt='Asset' />
                                </div>
                                <br />
                                <h1>Status History</h1>
                                <hr />
                                <div style={{ display: 'flex' }}>
                                    {assetHistory && assetHistory.length > 0 ? <table className='HistoryTable'><thead><th>Technician</th><th>Status</th><th>Date</th></thead>{assetHistory.map(m => renderHistoryRow(m))}</table> : <h2>No Changes Found</h2>}
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