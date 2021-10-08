import React, { useEffect, useState } from 'react';
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
    }, [])
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
    async function getCatalog() {
        const token = await getTokenSilently()
        let res = await axios.post(`${APILink}/catalog`, {
            offset: 0,
            limit: null,
            orderBy: 'model_number'
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*'
            }
        })
        if (res.isErrored) return console.log(res)
        setCatalog(res.data.records)
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
    const columns = [
        { field: 'id', headerName: 'Asset Tag', width: 350 },
        { field: 'status', headerName: 'Status', width: 500, valueGetter: params => job_codes[params.value] || params.value },
        { field: 'model_number', headerName: 'Model', width: 500, },
    ]

    return (
        <>
            <PageTemplate highLight='4' {...props} />
            <div className='AssetGridArea'>
                <DataGrid
                    className='Grid'
                    columns={columns}
                    loading={catalog.length < 1}
                    rows={catalog}
                    disableSelectionOnClick
                    hideFooterSelectedRowCount
                    autoPageSize
                />
            </div>
        </>
    )
}

export default AssetsPage

