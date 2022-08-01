// Imports
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMSAL } from '../Helpers/MSAL';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import PageTemplate from './Template'
import settings from '../settings.json'
import '../css/Assets.css'

function AssetsPage(props) {
    // States, Hooks, and MSAL
    let APILink = `${settings.APIBase}/asset`
    const { token, tokenLoading } = useMSAL()
    const [catalog, setCatalog] = useState([])
    const [job_codes, setJobCodes] = useState(null)
    const nav = useNavigate()

    // Effects
    useEffect(() => { // Gets job codes and catalog of assets
        getJobCodes()
        getCatalog()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Returns to home page if user can't access this page
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

    async function getCatalog() {
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

    // Constant for the columns of the data grid
    const columns = [
        { field: 'id', headerName: 'Asset Tag', width: 250 },
        { field: 'status', headerName: 'Status', width: 350, valueGetter: params => job_codes[params.value] || params.value },
        { field: 'model_number', headerName: 'Model', width: 400 },
        { field: 'notes', headerName: 'Notes', width: 800 }
    ]

    // Renders the page
    if (tokenLoading) return <PageTemplate highLight='assetpage' {...props} />
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
                    onCellClick={(params) => nav(`/search?q=${params.id}`, { state: { assetOnly: true } })}
                    style={{ cursor: 'pointer' }}
                />
            </div>
        </>
    )
}

export default AssetsPage

