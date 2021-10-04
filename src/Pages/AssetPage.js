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

    useEffect(() => {
        getCatalog()
    }, [])
    async function getCatalog() {
        const token = await getTokenSilently()
        let res = await axios.post(`${APILink}/catalog`, {
            offset: 0,
            limit: 25,
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

    return (
        <>
            <PageTemplate highLight='4' {...props} />
            <div className='AssetArea'>
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

const columns = [
    { field: 'id', headerName: 'Asset Tag', width: 250 },
    { field: 'status', headerName: 'Status', width: 250 },
    { field: 'model_number', headerName: 'Model', width: 250 },
]