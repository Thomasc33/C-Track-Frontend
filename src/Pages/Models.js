import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import CircularProgress from '@mui/material/CircularProgress';
import settings from '../settings.json';
import ModelService from '../Services/Model';
import Select from 'react-select';
import '../css/Asset.css'
import '../css/Models.css'
import axios from 'axios';

function ModelPage(props) {
    let APILink = `${settings.APIBase}/model`
    const { instance, accounts } = useMsal()
    const [catalog, setCatalog] = useState([])
    const [pageNumber, setPageNumber] = useState(1)
    const [newInfo, setNewInfo] = useState({ model_number: '', model_name: '', manufacturer: '', image: '', category: '' })

    useEffect(() => {
        getCatalog()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!props.permissions.view_models && !props.isAdmin) return <Redirect to='/' />

    async function getCatalog(offset = 0) {
        const token = await getTokenSilently()
        let res = await axios.post(`${APILink}/catalog`, {
            offset,
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

    const handleTextInputChange = async (id, e) => {
        if (!e.isSelect && e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        if (id === 'new') {
            // Update state
            const z = { ...newInfo }
            if (e.isSelect) { z.category = e.value; setNewInfo(z) }
            else if (e.target.value !== newInfo[e.target.classList[0]]) {
                z[e.target.classList[0]] = e.target.value
                setNewInfo(z)
            }

            // Check to see if its ready to send to DB
            if (!(z.model_number && z.model_name && z.manufacturer && z.category)) return

            //send to api
            let formData = z
            let token = await getTokenSilently()
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
                getCatalog((pageNumber - 1) * 25)
                setNewInfo({ model_number: '', model_name: '', manufacturer: '', image: '', category: '' })
            }
        } else for (let i of catalog) {
            if (id === i.model_number) {
                // Data gathering
                let formData = {
                    id,
                    change: null,
                    value: null
                }

                if (e.isSelect) { formData.change = 'category'; formData.value = e.value }
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
                }

                if (!formData.change || !formData.value) return e.target.classList.add('invalid')

                let token = await getTokenSilently()
                let res = await ModelService.edit(formData, token)
                if (res.isErrored) {
                    console.log(res.error)
                    if (!e.isSelect) e.target.classList.add('invalid')
                }
            }
        }
    }

    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e)
    }

    const handleSelectChange = async (e, id) => {
        handleTextInputChange(id, { ...e, isSelect: true })
    }

    const handlePageChange = async (e) => {
        if (e.target.id === 'next') {
            setCatalog([])
            setPageNumber(pageNumber + 1)
            getCatalog(pageNumber * 25)
        }
        else {
            setCatalog([])
            setPageNumber(pageNumber - 1)
            getCatalog((pageNumber - 2) * 25)
        }
    }

    function RenderRow(row) {
        let defaultOption
        for (let i of multiSelectOptions) {
            if (i.value === row.category) defaultOption = [i]
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

    return (
        <>
            <PageTemplate highLight='5' {...props} />
            <div className='PageNavigation'>
                <i className='material-icons PageArrow'
                    style={pageNumber === 1 ? { color: 'gray' } : {}}
                    id='previous'
                    onClick={e => { if (pageNumber > 1) handlePageChange(e) }}
                >navigate_before</i>
                <i className='material-icons PageArrow'
                    style={catalog.length >= 25 ? {} : { color: 'gray' }}
                    id='next'
                    onClick={e => catalog.length >= 25 ? handlePageChange(e) : console.log('Next page unavailable')}
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

const multiSelectOptions = [
    { value: 'IGEL', label: 'IGEL' },
    { value: 'Thick', label: 'Thick' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Phone', label: 'Phone' },
    { value: 'MiFi', label: 'MiFi' }
]

const selectStyles = {
    control: (styles, { selectProps: { width } }) => ({
        ...styles,
        backgroundColor: '#1b1b1b67',
        boxShadow: ' 0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)',
        borderRadius: '.25rem',
        padding: '.5rem',
        border: 'none',
        width
    }),
    menu: (provided, state) => ({
        ...provided,
        width: '100%',
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
                backgroundColor: localStorage.getItem('accentColor') || '#524e00',
            },
            ':hover': {
                ...styles[':hover'],
                backgroundColor: localStorage.getItem('accentColor') || '#524e00'
            }
        };
    },
    singleValue: (styles, { data }) => {
        return {
            ...styles,
            color: 'white',
            textAlign: 'left'
        };
    }
}