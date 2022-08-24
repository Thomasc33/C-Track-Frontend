// Imports
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useMSAL } from '../Helpers/MSAL';
import axios from 'axios'

function PartInventoryPage(props) {
    // MSAL stuff
    const { token } = useMSAL()

    // Hooks
    const nav = useNavigate()

    // States
    const [data, setData] = useState({})
    const [locationData, setLocationData] = useState([])
    const [selectedLocation, setSelectedLocation] = useState(null)

    // Effects
    useEffect(() => {
        async function getData() {
            let res = await axios.get(`${require('../settings.json').APIBase}/asset/locations`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            if (res.data) setData(res.data)
        }
        if (token) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    useEffect(() => {
        async function getData() {
            let res = await axios.post(`${require('../settings.json').APIBase}/asset/locations`, { location: selectedLocation }, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            if (res.data) setLocationData(res.data.data)
        }
        if (token && selectedLocation) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, selectedLocation])


    // Permission Check
    if (!props.permissions.view_assets && !props.isAdmin) return <Navigate to='/' />

    // Event Handlers

    // Renderers
    function RenderHome() {
        let keys = []
        if (data.data) keys = Object.keys(data.data)
        keys = keys.sort((a, b) => data[a] > data[b] ? -1 : 1)
        return <><h1>Asset Locations</h1>
            <hr />
            <div className='AssetLocationBlobContainer'>
                {keys.map(RenderHomeRow)}
            </div>
        </>
    }

    function RenderLocation() {
        return <><h1>Asset In {selectedLocation}</h1>
            <hr />
            <div className='AssetLocationBlobContainer'>
                {locationData.map(RenderLocationRow)}
            </div>
        </>
    }

    function RenderHomeRow(row) {
        return <div className='AssetLocationBlob' onClick={() => { setSelectedLocation(row) }} key={row}>
            <h2>{row}</h2>
            <h3>{data.data[row]} Devices</h3>
        </div>
    }

    function RenderLocationRow(row) {
        return <div className='AssetLocationBlob' onClick={() => { console.log('add redirect here') }} key={row.id}>
            <h2>{row.id}</h2>
            <h3>{row.status}</h3>
            <h3>{row.model_number}</h3>
            <a href={`/search?q=${row.id}`}
                onClick={e => { nav(`/search?q=${row.id}`); e.preventDefault() }}
                onAuxClick={e => { if (e.button === 1) { window.open(`/search?q=${row.id}&ao=1`, '_blank'); e.preventDefault() } }}>View</a>
        </div>
    }


    // Base JSX
    return (
        <>
            <div className='PartManagementArea'>
                {selectedLocation ? RenderLocation() : RenderHome()}
            </div>
        </>
    )
}

export default PartInventoryPage
