// Imports
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@material-ui/core';
import { useMSAL } from '../Helpers/MSAL';
import axios from 'axios'

function PartInventoryPage(props) {
    // MSAL stuff
    const { token } = useMSAL()

    // States
    const [data, setData] = useState([])
    const [selectedModel, setSelectedModel] = useState(null)
    const [selectedPart, setSelectedPart] = useState(null)

    // Effects
    useEffect(() => {
        async function getData() {
            let res = await axios.get(`${require('../settings.json').APIBase}/parts/inventory`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            setData(res.data || [])
        }
        if (token) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])


    // Permission Check
    if (!props.permissions.use_importer && !props.isAdmin) return <Navigate to='/' />

    // Event Handlers

    // Renderers
    function RenderHome() {
        return <><h1>Parts Inventory</h1>
            <hr />
            <br />
            <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', width: '90%', padding: '1rem', borderRadius: '.3rem' }}>
                <h2 style={{ width: '33.4%', textAlign: 'left' }}>Model </h2>
                <h2 style={{ width: '33.3%' }}>Associated Parts</h2>
                <h2 style={{ width: '33.3%', textAlign: 'right' }}>Stock</h2>
            </div>
            {data ? data.map(RenderHomeRow) : undefined}
        </>
    }

    function RenderModel() {
        let selectedInfo
        for (let i of data) if (i.model.model_number === selectedModel) { selectedInfo = i; break }
        return <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', width: '98%' }}>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { setSelectedModel(null) }}>Back</Button>
                <h1>Parts for {selectedModel}</h1>
                <div></div>
            </div>
            <hr />
            <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', width: '90%', padding: '1rem', borderRadius: '.3rem' }}>
                <h2 style={{ width: '33.4%', textAlign: 'left' }}>Type</h2>
                <h2 style={{ width: '33.3%' }}>Part Number</h2>
                <h2 style={{ width: '33.3%', textAlign: 'right' }}>Stock</h2>
            </div>
            {selectedInfo.parts.map(m => RenderModelRow(m, selectedInfo))}
        </>
    }

    function RenderPart() {
        let selectedInfo
        for (let i of data) if (i.model.model_number === selectedModel) { selectedInfo = i; break }
        return <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', width: '98%' }}>
                <Button variant='contained' color='primary' size='large' style={{ boxShadow: 'box-shadow: 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)', padding: '.5rem', margin: '.5rem', backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => { setSelectedPart(null) }}>Back</Button>
                <h1>{selectedPart}</h1>
                <div></div>
            </div>
            <hr />
            <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', width: '90%', padding: '1rem', borderRadius: '.3rem' }}>
                <h2 style={{ width: '20%' }}>ID</h2>
                <h2 style={{ width: '20%' }}>Location</h2>
                <h2 style={{ width: '20%' }}>Used</h2>
                <h2 style={{ width: '20%' }}>By</h2>
                <h2 style={{ width: '20%' }}>Added</h2>
                <h2 style={{ width: '20%' }}>By</h2>
            </div>
            {selectedInfo.inventory.filter(a => a.part_id === selectedPart).map(RenderPartRow)}
        </>
    }

    function RenderHomeRow(row) {
        return <div className='ResultSection' onClick={() => { setSelectedModel(row.model.model_number) }} key={row.model.model_number} style={{ backgroundColor: row.low_stock ? '#781c19' : null }}>
            <h2 style={{ width: '33.3%', textAlign: 'left' }}>{row.model.model_number}</h2>
            <h2 style={{ width: '33.4%' }}>{row.parts.length}</h2>
            <h2 style={{ width: '33.3%', textAlign: 'right' }}>{row.total_stock}</h2>
        </div>
    }

    function RenderModelRow(row, parent) {
        let stock = 0
        if (parent.inventory.length) stock = parent.inventory.filter(a => a.part_id === row.id && !a.location).length
        return <div className='ResultSection' onClick={() => { setSelectedPart(row.id) }} key={row.id} style={{ backgroundColor: row.low_stock ? '#781c19' : null }}>
            <h2 style={{ width: '33.3%', textAlign: 'left' }}>{row.part_type}</h2>
            <h2 style={{ width: '33.4%' }}>{row.part_number}</h2>
            <h2 style={{ width: '33.3%', textAlign: 'right' }}>{stock}</h2>
        </div>
    }

    function RenderPartRow(row) {
        return <div className='ResultSection' onClick={() => { setSelectedModel(row.model.model_number) }} key={row.id} style={{ backgroundColor: row.low_stock ? '#781c19' : null }}>
            <h2 style={{ width: '20%' }}>{row.id}</h2>
            <h2 style={{ width: '20%' }}>{row.location || 'Inventory'}</h2>
            <h2 style={{ width: '20%' }}>{row.used_on ? row.used_on.split('T')[0] : ''}</h2>
            <h2 style={{ width: '20%' }}>{row.used_by}</h2>
            <h2 style={{ width: '20%' }}>{row.added_on ? row.added_on.split('T')[0] : ''}</h2>
            <h2 style={{ width: '20%' }}>{row.added_by}</h2>
        </div>
    }

    // Base JSX

    return (
        <>
            <div className='PartManagementArea'>
                {selectedModel ? selectedPart ? RenderPart() : RenderModel() : RenderHome()}
            </div>
        </>
    )
}

export default PartInventoryPage
