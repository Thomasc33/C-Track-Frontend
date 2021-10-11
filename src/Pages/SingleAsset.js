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

const dontRender = ['id', 'image']
const editable = ['return_reason', 'notes', 'model_number']

function AssetsPage(props) {
    let APILink = `${settings.APIBase}/asset`
    const { instance, accounts } = useMsal()
    const [asset, setAsset] = useState()
    const [job_codes, setJobCodes] = useState(null)
    const search = props.searchTerm || new URLSearchParams(props.location.search).get('q')

    useEffect(() => {
        if (!search) return
        getJobCodes()
        getAssetInfo()
    }, [])
    if (!props.permissions.view_assets && !props.isAdmin) return <Redirect to='/' />
    async function getJobCodes() {
        const response = await fetch(`${settings.APIBase}/job/full`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*'
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
        data = { ...res.data }
        res = await axios.get(`${settings.APIBase}/model/get/${data.model_number}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*'
            }
        })
        if (res.isErrored) console.log(res)
        else data = { ...data, ...res.data, image: 'https://cpoc.snipe-it.io/uploads/models/assetmodel-image-HbUU9iqzqS.png' } // remove this later
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
        if (res.isErrored) { e.target.classList.add('invalid'); console.log(res.error) }
        if(row === 'model_number') getAssetInfo()
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
            <tr>
                <td style={{ width: '30%' }}>{titleCase(row.replace('_', ' '))}</td>
                <td style={{ width: '70%' }}>
                    <input type='text'
                        defaultValue={val}
                        id={`${row}`}
                        style={{ width: '79%' }}
                        readOnly={editable.includes(row) && props.permissions.edit_assets ? false : true}
                        onBlur={e => handleTextInputChange(row, e)}
                        onKeyDown={e => handleKeyDown(row, e)} />
                </td>
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
                            : <div>
                                <h1>Asset Information For:</h1>
                                <h1>{search}</h1>
                                <hr />
                                <div style={{ display: 'flex' }}>
                                    <table style={{ width: asset.image ? '60%' : '100%' }}><tbody>
                                        {Object.keys(asset).map(m => { if (!dontRender.includes(m)) return renderRow(m); else return <></> })}
                                    </tbody></table>
                                    <img style={{ width: '40%', height: 'auto', objectFit: 'contain' }} src={asset.image} />
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