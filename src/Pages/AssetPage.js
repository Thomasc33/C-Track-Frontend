import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import { DataGrid } from '@mui/x-data-grid';
import settings from '../settings.json'
import '../css/Assets.css'
import axios from 'axios';

function AssetsPage(props) {
    let APILink = `${settings.APIBase}/asset`
    const { instance, accounts } = useMsal()
    const [catalog, setCatalog] = useState([])
    const [job_codes, setJobCodes] = useState(null)

    useEffect(() => {
        getJobCodes()
        getCatalog()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!props.permissions.view_assets && !props.isAdmin) return <Redirect to='/' />

    async function getJobCodes() {
        let t = await getTokenSilently()
        const response = await fetch(`${settings.APIBase}/job/full`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${t}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        let jc = {}
        for (let i of data.job_codes) { jc[i.id] = i.job_name }
        setJobCodes(jc)
    }
    async function getCatalog() {
        const token = await getTokenSilently()
        let res = await axios.post(`${APILink}/catalog`, {
            offset: 0,
            limit: null,
            orderBy: 'model_number'
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        })
        if (res.isErrored) return console.log(res)
        setCatalog(res.data.records)
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
    const columns = [
        { field: 'id', headerName: 'Asset Tag', width: 250 },
        { field: 'status', headerName: 'Status', width: 350, valueGetter: params => job_codes[params.value] || params.value },
        { field: 'model_number', headerName: 'Model', width: 400 },
        { field: 'notes', headerName: 'Notes', width: 800 }
    ]

    return (
        <>
            <PageTemplate highLight='assetpage' {...props} />
            <div className='AssetGridArea'>
                <DataGrid
                    className='Grid'
                    columns={columns}
                    loading={catalog.length < 1}
                    rows={catalog}
                    disableSelectionOnClick
                    hideFooterSelectedRowCount
                    autoPageSize
                    onCellClick={(params) => { props.history.push(`/search?q=${params.id}`, { assetOnly: true }) }}
                    style={{ cursor: 'pointer' }}
                />
            </div>
        </>
    )
}

export default AssetsPage

