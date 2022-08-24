// Imports
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMSAL } from '../Helpers/MSAL';
import CircularProgress from '@mui/material/CircularProgress';
import settings from '../settings.json';
import ModelService from '../Services/Model';
import Select from 'react-select';
import axios from 'axios';

function ModelPage(props) {
    // Constant, States, and Hooks
    let APILink = `${settings.APIBase}/model`
    const { token, tokenLoading } = useMSAL()
    const [catalog, setCatalog] = useState([])
    const [pageNumber, setPageNumber] = useState(1)
    const [newInfo, setNewInfo] = useState({ model_number: '', model_name: '', manufacturer: '', image: '', category: [] })

    // Effects
    useEffect(() => { // Gets catalog of models
        getCatalog()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Returns to home page if user can't access this page
    if (!props.permissions.view_models && !props.isAdmin) return <Navigate to='/' />

    // Styling for the select box
    const selectStyles = {
        control: (styles, { selectProps: { width } }) => ({ ...styles, backgroundColor: 'transparent', width }),
        menu: (provided, state) => ({ ...provided, width: state.selectProps.width, }),
        noOptionsMessage: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        menuList: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => { return { ...styles, backgroundColor: '#1b1b1b', color: 'white', ':active': { ...styles[':active'], backgroundColor: localStorage.getItem('accentColor') || '#003994', }, ':hover': { ...styles[':hover'], backgroundColor: localStorage.getItem('accentColor') || '#003994' } }; },
        multiValue: (styles, { data }) => { return { ...styles, backgroundColor: localStorage.getItem('accentColor') || '#003994', }; },
        multiValueLabel: (styles, { data }) => ({ ...styles, color: data.color, }),
        multiValueRemove: (styles, { data }) => ({ ...styles, color: 'white', ':hover': { color: 'red', }, }),
    }

    // --- Functions --- //
    // Gets the catalog of models. Offset used if pagination is used (it is)
    async function getCatalog(offset = 0) {
        let res = await axios.post(`${APILink}/catalog`, {
            offset,
            limit: 50,
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

    // Main handler for changes
    const handleTextInputChange = async (id, e, isSelect = false) => {
        if (!isSelect && e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        if (id === 'new') {
            // Update state
            const z = { ...newInfo }
            if (isSelect) { z.category = [...e]; setNewInfo(z) }
            else if (e.target.value !== newInfo[e.target.classList[0]]) {
                z[e.target.classList[0]] = e.target.value
                setNewInfo(z)
            }

            // Check to see if its ready to send to DB
            if (!(z.model_number && z.model_name && z.manufacturer && z.category && z.category.length)) return

            //send to api
            let formData = z
            formData.category = z.category.map(m => m.value).join(',')
            
            let res = await ModelService.add(formData, token)
            if (res.isErrored) {
                document.getElementById('new-model_number').classList.add('invalid')
                document.getElementById('new-model_name').classList.add('invalid')
                document.getElementById('new-manufacturer').classList.add('invalid')
            } else {
                document.getElementById('new-model_number').value = ''
                document.getElementById('new-model_name').value = ''
                document.getElementById('new-manufacturer').value = ''
                document.getElementById('new-image').value = ''
                alert(`Model ${z.model_number} has been added.`)
                getCatalog((pageNumber - 1) * 50)
                setNewInfo({ model_number: '', model_name: '', manufacturer: '', image: '', category: [] })
            }
        } else for (let i of catalog) {
            if (id === i.model_number) {
                // Data gathering
                let formData = {
                    id,
                    change: null,
                    value: null
                }

                if (isSelect) { formData.change = 'category'; formData.value = e.map(m => m.value).join(',') }
                // eslint-disable-next-line default-case
                else switch (e.target.className) {
                    case 'model_number':
                    case 'manufacturer':
                    case 'image':
                        formData.change = e.target.className
                        formData.value = e.target.value
                        break;
                    case 'model_name':
                        formData.change = 'name'
                        formData.value = e.target.value
                        break;
                }

                if (!formData.change || (formData.change !== 'image' && !formData.value)) return e.target.classList.add('invalid')

                let res = await ModelService.edit(formData, token)
                if (res.isErrored) {
                    console.log(res.error)
                    if (!isSelect) e.target.classList.add('invalid')
                }
            }
        }
    }

    // Enter Listner
    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e)
    }

    // Handles the change of the multi-select box
    const handleSelectChange = async (e, id) => {
        handleTextInputChange(id, e, true)
    }

    // Handles changing page and updating catalog
    const handlePageChange = async (e) => {
        if (e.target.id === 'next') {
            setCatalog([])
            setPageNumber(pageNumber + 1)
            getCatalog(pageNumber * 50)
        }
        else {
            setCatalog([])
            setPageNumber(pageNumber - 1)
            getCatalog((pageNumber - 2) * 50)
        }
    }

    // --- Render --- //
    function RenderRow(row) {
        let defaultOption = []
        let category = row.category.split(',')
        for (let i of multiSelectOptions) {
            if (category.includes(i.value)) defaultOption.push(i)
        }
        return (<tr id={`${row.model_number}-row`} key={`${row.model_number}-row`}>
            <td>
                <input type='text'
                    defaultValue={row.model_number}
                    className='model_number'
                    id={`${row.model_number}-model_number`}
                    onBlur={e => handleTextInputChange(row.model_number, e)}
                    onKeyDown={e => handleKeyDown(row.model_number, e)} />
            </td>
            <td>
                <input type='text'
                    defaultValue={row.name}
                    className='model_name'
                    id={`${row.model_number}-model_name`}
                    onBlur={e => handleTextInputChange(row.model_number, e)}
                    onKeyDown={e => handleKeyDown(row.model_number, e)} />
            </td>
            <td>
                <input type='text'
                    defaultValue={row.manufacturer}
                    className='manufacturer'
                    id={`${row.model_number}-manufacturer`}
                    onKeyDown={e => handleKeyDown(row.model_number, e)}
                    onBlur={e => handleTextInputChange(row.model_number, e)} />
            </td>
            <td>
                <input type='text'
                    defaultValue={row.image}
                    placeholder='https://res.cloudindary.com/'
                    className='image'
                    id={`${row.model_number}-image`}
                    onKeyDown={e => handleKeyDown(row.model_number, e)}
                    onBlur={e => handleTextInputChange(row.model_number, e)} />
            </td>
            <td>
                <Select
                    isMulti
                    options={multiSelectOptions}
                    closeMenuOnSelect
                    styles={selectStyles}
                    defaultValue={defaultOption}
                    isSearchable
                    onChange={e => handleSelectChange(e, row.model_number)}
                    menuPlacement='auto'
                />
            </td>
        </tr >)
    }

    if (tokenLoading) return <></>
    return (
        <>
            <div className='PageNavigation'>
                <i className='material-icons PageArrow'
                    style={pageNumber === 1 ? { color: 'gray' } : {}}
                    id='previous'
                    onClick={e => { if (pageNumber > 1) handlePageChange(e) }}
                >navigate_before</i>
                <i className='material-icons PageArrow'
                    style={catalog.length >= 50 ? {} : { color: 'gray' }}
                    id='next'
                    onClick={e => catalog.length >= 50 ? handlePageChange(e) : console.log('Next page unavailable')}
                >navigate_next</i>
            </div>
            <div className='AssetArea'>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th style={{ width: '20%' }}>Model Number</th>
                            <th style={{ width: '30%' }}>Model Name</th>
                            <th style={{ width: '15%' }}>Manufacturer</th>
                            <th style={{ width: '20%' }}>Image</th>
                            <th style={{ width: '15%' }}>Category</th>
                        </tr>
                    </thead>
                    <tbody>
                        {catalog.length === 0 ? <tr><td><CircularProgress /></td><td><CircularProgress /></td><td><CircularProgress /></td><td><CircularProgress /></td></tr> : <></>}
                        {catalog ? catalog.map(m => RenderRow(m)) : <></>}
                        <tr>
                            <td key={`new-model_number`}><input type='text' placeholder='Model Number' className='model_number' id={`new-model_number`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td key={`new-model_name`}><input type='text' placeholder='Model Name' className='model_name' id={`new-model_name`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td key={`new-manufacturer`}><input type='text' placeholder='Manufacturer' className='manufacturer' id={`new-manufacturer`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td key={`new-image`}><input type='text' placeholder='https://res.cloudindary.com/' className='image' id={`new-image`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td key={`new-category`}>
                                <Select
                                    isMulti
                                    value={newInfo.category}
                                    options={multiSelectOptions}
                                    closeMenuOnSelect
                                    styles={selectStyles}
                                    isSearchable
                                    onChange={e => handleSelectChange(e, 'new')}
                                    menuPlacement='auto'
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default ModelPage

// Constants for options usable by the select component
const multiSelectOptions = [
    { value: 'IGEL', label: 'IGEL' },
    { value: 'Thick', label: 'Thick' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Phone', label: 'Phone' },
    { value: 'MiFi', label: 'MiFi' }
]