import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { Navigate } from 'react-router-dom';
import { confirmAlert } from 'react-confirm-alert';
import { Button } from '@material-ui/core';
import { useMSAL } from '../Helpers/MSAL';
import ModelSelect from '../Components/ModelSelect'
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import PartService from '../Services/Parts'
import Select from 'react-select';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';

function PartManagementPage(props) {
    // MSAL stuff
    const { token } = useMSAL()

    // Misc Functions
    const getCommonParts = () => {
        let ar = []
        for (let i of commonParts) ar.push({ name: i.part_type, value: i.part_type })
        return ar
    }

    // Constant for multi-select styles
    const selectStyles = {
        control: (styles, { selectProps: { width } }) => ({ ...styles, backgroundColor: 'transparent', width }),
        menu: (provided, state) => ({ ...provided, width: state.selectProps.width, }),
        noOptionsMessage: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        menuList: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }), option: (styles, { data, isDisabled, isFocused, isSelected }) => { return { ...styles, backgroundColor: '#1b1b1b', color: 'white', ':active': { ...styles[':active'], backgroundColor: localStorage.getItem('accentColor') || '#003994', }, ':hover': { ...styles[':hover'], backgroundColor: localStorage.getItem('accentColor') || '#003994' } }; },
        multiValue: (styles, { data }) => { return { ...styles, backgroundColor: localStorage.getItem('accentColor') || '#003994', }; },
        multiValueLabel: (styles, { data }) => ({ ...styles, color: data.color, }),
        multiValueRemove: (styles, { data }) => ({ ...styles, color: 'white', ':hover': { color: 'red', }, }),
    }

    // States
    const [modelList, setModelList] = useState([])
    const [modelAddSelect, setModelAddSelect] = useState(null)
    const [selectedModel, setSelectedModel] = useState(null)
    const [partsList, setPartsList] = useState(null)
    const [newPart, setNewPart] = useState({})
    const [commonParts, setCommonParts] = useState([])
    const [multiSelectOptions, setMultiSelectOptions] = useState([])
    const [updateModelList, setUpdateModelList] = useState(true)
    const [updatePartList, setUpdatePartList] = useState(true)

    // useEffect(s)
    useEffect(() => { // Gets all models with parts enabled
        const getModelList = async () => {
            let res = await axios.get(`${require('../settings.json').APIBase}/parts/mgmt`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            setModelList(res.data || [])
        }
        if (token && updateModelList) getModelList().then(() => setUpdateModelList(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateModelList, token])

    useEffect(() => { // Gets all model numbers
        const getModels = async () => {
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
        if (token) getModels()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    useEffect(() => {// Gets all parts for selected model
        const getPartList = async () => {
            if (!selectedModel) return
            let res = await axios.get(`${require('../settings.json').APIBase}/parts/mgmt/model?model=${selectedModel}`, {
                headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            })
            if (res.isErrored) return console.log(res)
            setCommonParts(res.data.common || [])
            setPartsList(res.data.parts || [])
            setUpdatePartList(false)
        }
        if (token && updatePartList) getPartList()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedModel, token, updatePartList])

    // Reset the block on updating part list when a new model is selected
    useEffect(() => { setUpdatePartList(true); if (!selectedModel) setUpdateModelList(true) }, [selectedModel])


    // Permission Check
    if (!props.permissions.use_importer && !props.isAdmin) return <Navigate to='/' />

    // Event Handlers
    const handleModelAddButton = async () => {
        PartService.addModelList({ model: modelAddSelect }, token)
        setModelAddSelect(null)
        setUpdateModelList(true)
    }

    const handleTextInputChange = async (e, id) => {
        if (id === 'new') {
            let field = e.target.id
            if (!field) return
            let newP = { ...newPart }
            newP[field] = e.target.value
            setNewPart(newP)
        } else handleChange(id, { change: e.target.id, value: e.target.value, id })
    }

    const handleSelectChange = async (id, e) => {
        if (id === 'new') setNewPart({ ...newPart, type: e })
        else handleChange(id, { change: 'type', value: e, id })
    }

    const handleMultiSelectChange = async (id, e) => {
        let models = e.map(m => m.value).join(',')
        if (id === 'new') setNewPart({ ...newPart, alt_models: models })
        else handleChange(id, { change: 'alt_models', value: models, id })
    }

    const handleChange = async (id, formData) => {
        formData.model = selectedModel
        await PartService.editPart(formData, token)
        setUpdatePartList(true)
    }

    const handleSaveButton = async () => {
        await PartService.newPart({ ...newPart, model: selectedModel }, token)
        setUpdatePartList(true)
        try {
            document.getElementsByClassName('NS_new_part')[0].value = ''
            document.getElementsByClassName('NS_new_image')[0].value = ''
            setNewPart({ ...newPart, part: undefined, image: undefined })
        } catch (er) { console.warn(er) }
    }

    const numberValidatorEventListener = (e) => { e.target.value = e.target.value.replace(/[^.\d]/g, '') }

    const handleDelete = async (id, e, row) => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className='confirm-alert'>
                        <h1>Confirm the deletion</h1>
                        <br />
                        <span style={{ margins: '1rem' }}>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67', margin: '1rem' }} onClick={() => {
                                sendDelete(id, e, row)
                                onClose()
                            }}
                            >Confirm</Button>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                onClose()
                            }}>Nevermind</Button>
                        </span>
                    </div>
                )
            }
        })
    }

    const sendDelete = async (id, e, row) => {
        await PartService.deletePart(id, token)
        let temp = [...partsList].filter(p => !(p.id === id && p.part_number === row.part_number))
        setPartsList(temp)
    }

    const handleWatchToggle = async (id, e, row) => {
        if (e) await PartService.watchPart(id, token)
        else await PartService.unwatchPart(id, token)
    }

    // Renderers
    const renderModelList = row => {
        return <div key={row.model_number} className='ResultSection' onClick={() => { setSelectedModel(row.model_number) }} >
            <h2 style={{ width: '33.3%', textAlign: 'left' }}>{row.model_number}</h2>
            <h2 style={{ width: '33.4%' }}>{row.manufacturer}</h2>
            <h2 style={{ width: '33.3%', textAlign: 'right' }}>{row.part_count}</h2>
        </div>
    }

    const renderPartList = row => {
        let defaultOptions = []
        if (row.alt_models) for (let i of multiSelectOptions)
            if (row.alt_models.includes(i.value)) defaultOptions.push(i)
        return <tr key={row.id}>
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
            <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Select
                    options={multiSelectOptions}
                    isMulti
                    width='20vw'
                    closeMenuOnSelect={false}
                    styles={selectStyles}
                    defaultValue={defaultOptions}
                    isSearchable
                    onChange={e => handleMultiSelectChange(row.id, e)}
                    menuPlacement='auto'
                />
                <i className="material-icons delete-icon" onClickCapture={e => handleDelete(row.id, e, row)}>delete_outline</i>
            </td>
            <td>
                <Checkbox id={`${row.id}-watched`}
                    checked={row.watching}
                    borderWidth='2px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                    onChange={e => handleWatchToggle(row.id, e, row)} />
            </td>
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
                        <div />
                    </div>
                    <hr />
                    {partsList ? <>
                        <table className='rows' style={{ position: 'relative' }}>
                            <thead>
                                <tr><th>Part Number</th><th>Common Type</th><th>Minimum Stock</th><th>Image</th><th>Alternate Models</th><th>Notify</th></tr>
                            </thead>
                            <tbody>
                                {localStorage.getItem('newestOnTop') ? partsList.map(renderPartList) : undefined}
                                <tr>
                                    <td><input type='text' className='NS_new_part' id='part' placeholder='New...' onBlur={e => handleTextInputChange(e, 'new')} /></td>
                                    <td><SelectSearch
                                        options={getCommonParts()}
                                        value={newPart.type ? newPart.type : null}
                                        search
                                        placeholder="New..."
                                        filterOptions={fuzzySearch}
                                        className='job_list'
                                        autoComplete='on'
                                        onChange={e => handleSelectChange('new', e)}
                                        menuPlacement='auto'
                                        id='type' /></td>
                                    <td><input type='number' id='m_stock' placeholder='0' onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(e, 'new') }} /></td>
                                    <td><input type='text' className='NS_new_image' id='image' placeholder='New...' onBlur={e => handleTextInputChange(e, 'new')} /></td>
                                    <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Select
                                            options={multiSelectOptions}
                                            isMulti
                                            width='20vw'
                                            closeMenuOnSelect={false}
                                            styles={selectStyles}
                                            isSearchable
                                            onChange={e => handleMultiSelectChange('new', e)}
                                            menuPlacement='auto'
                                        />
                                        {newPart.part && newPart.type && newPart.m_stock ?
                                            <i className="material-icons delete-icon" onClickCapture={handleSaveButton}>save</i> : undefined}
                                    </td>
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
        </div>
        </>
    )
}

export default PartManagementPage
