// Imports
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMSAL } from '../Helpers/MSAL';
import * as timeago from 'timeago.js'
import axios from 'axios'
import { Button, CircularProgress } from '@material-ui/core';
import Misc from '../Services/Misc';

function PartInventoryPage(props) {
    // MSAL stuff
    const { token } = useMSAL()

    // Hooks
    const location = useLocation()

    // States
    const [onHistory, setOnHistory] = useState(false)
    const [inventoryPastList, setInventoryPastList] = useState([])
    const [inventoryHistoryData, setInventoryHistoryData] = useState({})
    const [searchId, setSearchId] = useState(new URLSearchParams(location.search).get('id'))

    // Effects
    useEffect(() => {
        async function getData() {
            let res = await axios.get(`${require('../settings.json').APIBase}/misc/inventory`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            if (res.data) setInventoryPastList(res.data.history)
        }
        if (token && onHistory) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, onHistory])

    useEffect(() => {
        async function getData() {
            let res = await axios.get(`${require('../settings.json').APIBase}/misc/inventory/${searchId}`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            if (res.data) setInventoryHistoryData(res.data.data)
        }
        if (token && searchId) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, searchId])

    // Permission Check
    if (!props.permissions.use_inventory_scan && !props.isAdmin) return <Navigate to='/' />

    // Event Handlers
    async function handleSubmit() {
        let text = document.getElementById('scantext').value

        let res = await Misc.submitInventoryScan({ data: text }, token)
        if (res.isErrored) return console.log(res)

        if (res.data.id) setSearchId(res.data.id)
    }

    // Renderers
    function renderHistoryRow(row) {
        return <div className='AssetLocationBlob' style={{ margin: '1rem' }} onClick={() => { setSearchId(row.id) }} key={row.id}>
            <h3>{row.user}'s Inventory</h3>
            <h3>From {timeago.format(new Date(row.timestamp), 'en_US', { relativeDate: new Date().setHours(new Date().getHours() - 4) })}</h3>
        </div>
    }

    function renderInventoryReport() {
        return <>
            <div className='break' />
            <h1>Inventory By: {inventoryHistoryData.user}</h1>
            <div className='break' />
            <h2>Inventory Taken: {timeago.format(new Date(inventoryHistoryData.timestamp), 'en_US', { relativeDate: new Date().setHours(new Date().getHours() - 4) })}</h2>
            <div className='break' />
            <hr />
            <h2>Up To Date Assets</h2>
            <div className='break' />
            <div className='AssetLocationBlobContainer'>
                {inventoryHistoryData.up_to_date_assets.length ? inventoryHistoryData.up_to_date_assets.map(m => renderAssetBlob(m)) : <h2>None!</h2>}
            </div>
            <hr />
            <h2>Assets That Were in Wrong Location</h2>
            <div className='break' />
            <div className='AssetLocationBlobContainer'>
                {inventoryHistoryData.location_changes.length ? inventoryHistoryData.location_changes.map(m => renderAssetBlob(m[0], m[1])) : <h2>None!</h2>}
            </div>
            <hr />
            <h2>"In House" Assets That Weren't Scanned</h2>
            <div className='break' />
            <div className='AssetLocationBlobContainer'>
                {inventoryHistoryData.in_house_not_scanned.length ? inventoryHistoryData.in_house_not_scanned.map(m => renderAssetBlob(m)) : <h2>None!</h2>}
            </div>
            <hr />
            <h2>Scanned Assets that Don't Exist</h2>
            <div className='break' />
            <div className='AssetLocationBlobContainer'>
                {inventoryHistoryData.missing_assets.length ? inventoryHistoryData.missing_assets.map(m => renderAssetBlob(m)) : <h2>None!</h2>}
            </div>
        </>
    }

    function renderAssetBlob(row, previousLocation = undefined) {
        return <div className='AssetLocationBlob' style={{ padding: '1rem' }} onClick={() => { window.open(`/search?q=${row}&ao=1`, '_blank') }} key={row}>
            <h2>{row}</h2>
            {previousLocation ? <h3>Was at: {previousLocation}</h3> : <></>}
            <a href={`/search?q=${row}`}
                onClick={e => { window.open(`/search?q=${row}&ao=1`, '_blank'); e.preventDefault() }}
                onAuxClick={e => { if (e.button === 1) { window.open(`/search?q=${row}&ao=1`, '_blank'); e.preventDefault() } }}>View</a>
        </div>
    }

    // Base JSX
    return (
        <>
            <div className='PartManagementArea'>
                <span style={{ display: 'flex', justifyContent: 'space-between', width: '95%' }}>
                    <Button variant='contained' color='primary' size='large' style={{ visibility: onHistory || searchId ? 'visible' : 'hidden', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => {
                        if (searchId) { setSearchId(undefined); location.search = ''; } else setOnHistory(false)
                    }}>Back</Button>
                    <h1>{searchId ? 'Inventory Report' : onHistory ? 'Inventory Scan History' : 'Inventory Scanning'}</h1>
                    <Button variant='contained' color='primary' size='large' style={{ visibility: onHistory || searchId ? 'hidden' : 'visible', backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => { setOnHistory(true) }}>View History</Button>
                </span>
                <hr />
                {searchId ?
                    Object.keys(inventoryHistoryData).length ? renderInventoryReport() : <CircularProgress />
                    :
                    onHistory ?
                        <div className='AssetLocationBlobContainer'>
                            {inventoryPastList.map(renderHistoryRow)}
                        </div>
                        :
                        <>
                            <h2>Scan assets in and seperate by new line (auto return on scanner)</h2>
                            <div className='break' />
                            <textarea id='scantext' style={{ boxShadow: '0px 8px 16px 0px rgba(0, 0, 0, 0.2)', width: '90%', height: '20rem', padding: '1rem', margin: '1rem', backgroundColor: '#1b1b1b', borderColor: 'white', borderWidth: '3px', color: 'white', fontSize: '16px', verticalAlign: 'top' }} />
                            <div className='break' />
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => { handleSubmit() }}>Submit</Button>
                        </>
                }
            </div>
        </>
    )
}

export default PartInventoryPage
