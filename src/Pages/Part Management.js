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
import SelectSearch, { fuzzySearch } from 'react-select-search';
import Select from 'react-select';
import '../css/PartManagement.css'

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
        setCommonParts(res.data.common || [])
        setPartsList(res.data.parts || [])
    }

    const getCommonParts = () => {
        let ar = []
        for (let i of commonParts) ar.push({ name: i.part_type, value: i.part_type })
        return ar
    }

    const getModels = async () => {
        const token = await getTokenSilently()
        let res = await axios.get(`${require('../settings.json').APIBase}/model/all/numbers`, {
            headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
        })
        if (res.isErrored) return console.log(res)
        let opt = []
        for (let i of res.data.models) {
            opt.push({ value: i.model_number, label: i.model_number })
        }
        setMultiSelectOptions(opt)
    }

    const selectStyles = {
        control: (styles, { selectProps: { width } }) => ({
            ...styles,
            backgroundColor: 'transparent',
            width
        }),
        menu: (provided, state) => ({
            ...provided,
            width: state.selectProps.width,
        }),
        noOptionsMessage: (styles) => ({
            ...styles,
            backgroundColor: '#1b1b1b'
        }),
        menuList: (styles) => ({
            ...styles,
            backgroundColor: '#1b1b1b'
        }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
            return {
                ...styles,
                backgroundColor: '#1b1b1b',
                color: 'white',
                ':active': {
                    ...styles[':active'],
                    backgroundColor: localStorage.getItem('accentColor') || '#003994',
                },
                ':hover': {
                    ...styles[':hover'],
                    backgroundColor: localStorage.getItem('accentColor') || '#003994'
                }
            };
        },
        multiValue: (styles, { data }) => {
            return {
                ...styles,
                backgroundColor: localStorage.getItem('accentColor') || '#003994',
            };
        },
        multiValueLabel: (styles, { data }) => ({
            ...styles,
            color: data.color,
        }),
        multiValueRemove: (styles, { data }) => ({
            ...styles,
            color: 'white',
            ':hover': {
                color: 'red',
            },
        }),

    }

    // States
    const [modelList, setModelList] = useState([])
    const [modelAddSelect, setModelAddSelect] = useState(null)
    const [selectedModel, setSelectedModel] = useState(null)
    const [partsList, setPartsList] = useState(null)
    const [newPart, setNewPart] = useState({})
    const [commonParts, setCommonParts] = useState([])
    const [multiSelectOptions, setMultiSelectOptions] = useState([])

    // useEffect(s)
    useEffect(getModelList, []) // Gets all models with parts enabled
    useEffect(getModels, []) // Gets all model numbers
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

    const handleTextInputChange = async (e, id) => {
        if (id === 'new') {
            let field = e.target.id
            if (!field) return
            let newP = { ...newPart }
            newP[field] = e.target.value
            setNewPart(newP)
            if (newP.part && newP.type && newP.m_stock) handleChange(id, newP)
        } else handleChange(id, { change: e.target.id, value: e.target.value, id })
    }

    const handleSelectChange = async (id, e) => {
        if (id === 'new') {
            let newP = { ...newPart }
            newP.type = e
            setNewPart(newP)
            if (newP.part && newP.type && newP.m_stock) handleChange(id, newP)
        } else handleChange(id, { change: 'type', value: e, id })

    }

    const handleMultiSelectChange = async (id, e) => {
        let models = e.map(m => m.value).join(',')
        if (id === 'new') {
            let t = { ...newPart }
            t.alt_models = models
            setNewPart(t)
        } else handleChange(id, { change: 'alt_models', value: models, id })
    }

    const handleChange = async (id, formData) => {
        let t = await getTokenSilently()
        formData.model = selectedModel
        if (id === 'new') await PartService.newPart(formData, t)
        else await PartService.editPart(formData, t)
        getPartList()
    }

    const numberValidatorEventListener = (e) => { e.target.value = e.target.value.replace(/[^.\d]/g, '') }



    // Renderers
    const renderModelList = row => {
        return <div className='ResultSection' onClick={() => { setSelectedModel(row.model_number) }} >
            <h2 style={{ width: '33.3%', textAlign: 'left' }}>{row.model_number}</h2>
            <h2 style={{ width: '33.4%' }}>{row.manufacturer}</h2>
            <h2 style={{ width: '33.3%', textAlign: 'right' }}>{row.part_count}</h2>
        </div>
    }

    const renderPartList = row => {
        let defaultOptions = []
        if (row.alt_models) for (let i of multiSelectOptions)
            if (row.alt_models.includes(i.value)) defaultOptions.push(i)
        return <tr>
            <td><input type='text' id='part' placeholder='New...' defaultValue={row.part_number} onBlur={e => handleTextInputChange(e, row.id)} /></td>
            <td><SelectSearch
                options={getCommonParts()}
                search
                filterOptions={fuzzySearch}
                value={row.part_type}
                className='job_list'
                autoComplete='on'
                onChange={e => handleSelectChange(row.id, e)}
                menuPlacement='auto'
                id='type' /></td>
            <td><input type='number' id='m_stock' defaultValue={row.minimum_stock} onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(e, row.id) }} /></td>
            <td><input type='text' id='image' placeholder='Image URL' defaultValue={row.image === 'null' ? undefined : row.image} onBlur={e => handleTextInputChange(e, row.id)} /></td>
            <td><Select
                options={multiSelectOptions}
                isMulti
                width='20vw'
                closeMenuOnSelect={false}
                styles={selectStyles}
                defaultValue={defaultOptions}
                isSearchable
                onChange={e => handleMultiSelectChange(row.id, e)}
                menuPlacement='auto'
            /></td>
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
                                <tr><th>Part Number</th><th>Common Type</th><th>Minimum Stock</th><th>Image</th><th>Alternate Models</th></tr>
                            </thead>
                            <tbody>
                                {localStorage.getItem('newestOnTop') ? partsList.map(renderPartList) : undefined}
                                <tr>
                                    <td><input type='text' id='part' placeholder='New...' onBlur={e => handleTextInputChange(e, 'new')} /></td>
                                    <td><SelectSearch
                                        options={getCommonParts()}
                                        search
                                        placeholder="New..."
                                        filterOptions={fuzzySearch}
                                        className='job_list'
                                        autoComplete='on'
                                        onChange={e => handleSelectChange('new', e)}
                                        menuPlacement='auto'
                                        id='type' /></td>
                                    <td><input type='number' id='m_stock' placeholder='0' onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(e, 'new') }} /></td>
                                    <td><input type='text' id='image' placeholder='New...' onBlur={e => handleTextInputChange(e, 'new')} /></td>
                                    <td><Select
                                        options={multiSelectOptions}
                                        isMulti
                                        width='20vw'
                                        closeMenuOnSelect={false}
                                        styles={selectStyles}
                                        isSearchable
                                        onChange={e => handleMultiSelectChange('new', e)}
                                        menuPlacement='auto'
                                    /></td>
                                </tr>
                                {localStorage.getItem('newestOnTop') ? undefined : partsList.map(renderPartList)}
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
        </div><PageTemplate highLight='part_management' {...props} /></>
    )
}

export default PartManagementPage
