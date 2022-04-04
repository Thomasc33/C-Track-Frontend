import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import ModelSelect from '../Components/ModelSelect'
import { Button } from '@material-ui/core';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import PartService from '../Services/Parts'
import '../css/PartManagement.css'
const APIBase = require('../settings.json').APIBase

function PartManagementPage(props) {
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

    // Misc Functions
    const getModelList = async () => {
        const token = await getTokenSilently()
        let res = await axios.get(`${require('../settings.json').APIBase}/parts/mgmt`, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        })
        if (res.isErrored) return console.log(res)
        setModelList(res.data || [])
    }

    const getPartList = async () => {
        if (!selectedModel) return
        const token = await getTokenSilently()
        let res = await axios.get(`${require('../settings.json').APIBase}/parts/mgmt/model/${selectedModel}`, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        })
        if (res.isErrored) return console.log(res)
        console.log(res.data)
        setPartsList(res.data || [])
    }

    // States
    const [modelList, setModelList] = useState([])
    const [modelAddSelect, setModelAddSelect] = useState(null)
    const [selectedModel, setSelectedModel] = useState(null)
    const [partsList, setPartsList] = useState(null)

    // useEffect(s)
    useEffect(getModelList, [])
    useEffect(getPartList, [selectedModel])


    // Permission Check
    if (!props.permissions.use_importer && !props.isAdmin) return <Redirect to='/' />

    // Event Handlers
    const handleModelAddButton = async () => {
        const token = await getTokenSilently()
        PartService.addModelList({ model: modelAddSelect }, token)
        setModelAddSelect(null)
        getModelList()
    }

    // Renderers
    const renderModelList = row => {
        return <div className='ResultSection' onClick={() => { setSelectedModel(row.model_number) }} >
            <h2 style={{ width: '33.4%', textAlign: 'left' }}>{row.model_number}</h2>
            <h2 style={{ width: '33.3%' }}>{row.manufacturer}</h2>
            <h2 style={{ width: '33.3%', textAlign: 'right' }}>0</h2>
        </div>
    }

    const renderPartList = row => {
        return <tr>
            <td>part</td>
            <td>type</td>
            <td>image</td>
        </tr>
    }

    // Base JSX
    return (
        <><div className='PartManagementArea'>
            {selectedModel ?
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', width: '98%' }}>
                        <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { setSelectedModel(null); setPartsList(null) }}>Back</Button>
                        <h1>Parts for {selectedModel}</h1>
                        <div></div>
                    </div>
                    <hr />
                    {partsList ? <>
                        <table className='rows' style={{ position: 'relative' }}>
                            <thead>
                                <tr><th>Part Number</th><th>Common Type</th><th>Image</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><input type='text' placeholder='New...' /></td>
                                    <td><input type='text' placeholder='New...' /></td>
                                    <td><input type='text' placeholder='New...' /></td></tr>
                                {partsList.map(renderPartList)}
                            </tbody>
                        </table>
                    </> : <CircularProgress size='48px' />}
                </>
                :
                <>
                    <h1>Part Management</h1>
                    <hr />
                    <br />
                    <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', width: '90%', padding: '1rem', borderRadius: '.3rem' }}>
                        <h2 style={{ width: '33.4%', textAlign: 'left' }}>Model Number</h2>
                        <h2 style={{ width: '33.3%' }}>Manufacturer</h2>
                        <h2 style={{ width: '33.3%', textAlign: 'right' }}>Unique Parts</h2>
                    </div>
                    {modelList.map(renderModelList)}
                    <hr />
                    <h2>Add Model</h2>
                    <ModelSelect setModelSelect={setModelAddSelect} />
                    <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={handleModelAddButton} disabled={!modelAddSelect}>Add Model</Button>
                </>
            }
        </div><PageTemplate highLight='7' disableSearch {...props} /></>
    )
}

export default PartManagementPage
