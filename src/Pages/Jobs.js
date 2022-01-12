import React from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useState } from 'react';
import { useFetch } from '../Helpers/API';
import jobService from '../Services/Job'
import { useMsal } from '@azure/msal-react';
import Select from 'react-select';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import '../css/Asset.css'
import '../css/Jobs.css'
const settings = require('../settings.json')

function JobPage(props) {
    const { instance, accounts } = useMsal()
    let APILink = `${settings.APIBase}/job`
    const [newJobCode, setNewJobCode] = useState('');
    const [newJobName, setNewJobName] = useState('');
    const [inApi, setLoading] = useState(false)
    const [newPrice, setNewPrice] = useState(0);
    const [newIsHourly, setNewIsHourly] = useState(false)
    const [newIsAsset, setNewIsAsset] = useState(false)
    const [newAppliesSelection, setNewAppliesSelection] = useState([])
    const [updated, setUpdated] = useState(0)
    const { loading, data = [], setData } = useFetch(`${APILink}/all`, null)

    if (!props.permissions.view_jobcodes && !props.isAdmin) return <Redirect to='/' />

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
                    backgroundColor: localStorage.getItem('accentColor') || '#524e00',
                },
                ':hover': {
                    ...styles[':hover'],
                    backgroundColor: localStorage.getItem('accentColor') || '#524e00'
                }
            };
        },
        multiValue: (styles, { data }) => {
            return {
                ...styles,
                backgroundColor: localStorage.getItem('accentColor') || '#524e00',
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

    const handleTextInputChange = async (id, e) => {
        if (!e.isHourly && !e.isSelect && !e.isAsset) {
            if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        }
        if (id === 'new') {
            if (inApi) return
            let job_code = newJobCode;
            let job_name = newJobName;
            let price = newPrice;
            let isHourly = newIsHourly;
            let isAsset = newIsAsset
            let applies = newAppliesSelection;
            if (e.isHourly) { isHourly = e.selection; setNewIsHourly(e.selection) }
            else if (e.isAsset) { isAsset = e.selection; setNewIsAsset(e.selection) }
            else if (e.isSelect) { applies = e.selection.map(m => m.value).join(',') }
            else switch (e.target.id) {
                case 'new-price':
                    price = e.target.value
                    await setNewPrice(e.target.value)
                    break;
                case 'new-jobname':
                    job_name = e.target.value
                    await setNewJobName(e.target.value)
                    break;
                case 'new-jobcode':
                    job_code = e.target.value
                    await setNewJobCode(e.target.value)
                    break;
                default:
                    console.log('Default Case hit for new')
                    return
            }

            //data validation
            let cont = true;
            if (!job_code) {
                document.getElementById('new-jobcode').classList.add('invalid')
                cont = false
            }
            if (!job_name) {
                document.getElementById('new-jobname').classList.add('invalid')
                cont = false
            }
            if (!price) {
                document.getElementById('new-price').classList.add('invalid')
                cont = false
            }
            if (!cont) return

            //send to api
            let formData = { job_code, job_name, price, isHourly, applies, isAsset }
            setLoading(true)
            let token = await getTokenSilently()
            let res = await jobService.add(formData, token)
            if (res.isErrored) {
                setLoading(false)
                if (document.getElementById('new-jobcode')) document.getElementById('new-jobcode').classList.add('invalid')
                if (document.getElementById('new-jobname')) document.getElementById('new-jobname').classList.add('invalid')
                if (document.getElementById('new-price')) document.getElementById('new-price').classList.add('invalid')
            } else {
                if (document.getElementById('new-jobcode')) document.getElementById('new-jobcode').value = ''
                if (document.getElementById('new-jobname')) document.getElementById('new-jobname').value = ''
                if (document.getElementById('new-price')) document.getElementById('new-price').value = ''
                setNewPrice(0)
                setNewJobName('')
                setNewJobCode('')
                const response = await fetch(`${APILink}/all`, {
                    mode: 'cors',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Access-Control-Allow-Origin': '*'
                    }
                });
                const d = await response.json();
                setData(d);
                setLoading(false)
            }
        } else for (let i of data.job_codes) {
            if (id === i.id) {
                //data validation
                let formData = {
                    id: i.id,
                    change: null,
                    value: null
                }
                // eslint-disable-next-line eqeqeq
                if (e.isHourly) {
                    formData.change = 'isHourly'
                    formData.value = e.selection.toString()
                }
                else if (e.isAsset) {
                    formData.change = 'isAsset'
                    formData.value = e.selection.toString()
                } else if (e.isSelect) {
                    formData.change = 'applies'
                    formData.value = e.selection.map(m => m.value).join(',')
                    // eslint-disable-next-line default-case
                } else switch (e.target.className) {
                    case 'price':
                        if (e.target.value !== i.price) if (e.target.value) {
                            formData.change = 'price'
                            formData.value = e.target.value.replace(/[^\d]/g, '')
                        }
                        break;
                    case 'job_name':
                        if (e.target.value !== i.job_name) if (e.target.value) formData.change = 'job_name'
                        break;
                    case 'job_code':
                        if (e.target.value !== i.job_code) if (e.target.value) formData.change = 'job_code'
                        break;
                }

                if (!formData.change) return

                if (!formData.value && !e.isSelect) formData.value = e.target.value

                //send to api
                let token = await getTokenSilently()
                let res = await jobService.edit(formData, token)
                if (res.isErrored) {
                    console.error(res.error.response)
                    if (!e.isHourly && !e.isSelect && !e.isAsset) e.target.classList.add('invalid')
                }
            }
        }
    }

    const selectionChange = async (id, e) => {
        if (id === 'new') setNewAppliesSelection(e)
        handleTextInputChange(id, { selection: e, isSelect: true })
    }

    const numberValidatorEventListener = (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, '')
    }

    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e)
    }

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        let defaultOptions = []
        if (row.applies) for (let i of row.applies) if (multiSelectIndexer[i] !== null) defaultOptions.push(multiSelectOptions[multiSelectIndexer[i]])
        return (<tr id={`${row.id}-row`} key={`${row.id}-row`}>
            <td>
                <input type='text'
                    defaultValue={row.job_code}
                    className='job_code'
                    id={`${row.id}-job_code`}
                    onBlur={e => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='text'
                    defaultValue={row.job_name}
                    className='job_name'
                    id={`${row.id}-job_name`}
                    onBlur={e => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='number'
                    defaultValue={row.price}
                    className='price'
                    id={`${row.id}-price`}
                    onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(row.id, e) }}
                    onKeyDown={e => { handleKeyDown(row.id, e) }}
                    style={{ width: '5rem', padding: '1rem' }} />
            </td>
            <td className='isHourly'>
                <Checkbox id={`${row.id}-isHourly`}
                    checked={row.is_hourly}
                    borderWidth='2px'
                    borderColor={localStorage.getItem('accentColor') || '#e3de00'}
                    style={{ backgroundColor: '#1b1b1b67' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e3de00'} size={30} />}
                    onChange={e => { row.is_hourly = e; setUpdated(updated + 1); handleTextInputChange(row.id, { isHourly: true, selection: e }) }} />
            </td>

            {!row.is_hourly ?
                <><td>
                    <Checkbox id={`${row.id}-isAsset`}
                        checked={row.requires_asset}
                        borderWidth='2px'
                        borderColor={localStorage.getItem('accentColor') || '#e3de00'}
                        style={{ backgroundColor: '#1b1b1b67' }}
                        size='30px'
                        icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e3de00'} size={30} />}
                        onChange={e => handleTextInputChange(row.id, { isAsset: true, selection: e })} />
                </td>
                    <td>
                        <Select menuPlacement='auto' options={multiSelectOptions}
                            isMulti
                            closeMenuOnSelect={false}
                            styles={selectStyles}
                            defaultValue={defaultOptions}
                            isSearchable
                            onChange={e => selectionChange(row.id, e)} />
                    </td></> : <></>}
        </tr >)
    }


    //returns blank page if data is loading
    if (loading || !data) return <PageTemplate highLight='7' disableSearch {...props} />
    else return (
        <>
            <div className='AssetArea' style={{ top: '3vh', height: '97vh' }}>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Job Code</th>
                            <th style={{ width: '30%' }}>Job Name</th>
                            <th style={{ width: '5%' }}>Price</th>
                            <th style={{ width: '5%' }}>Hourly</th>
                            <th style={{ width: '5%' }}>Asset</th>
                            <th style={{ width: '25%' }}>Applies To</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.job_codes ? data.job_codes.map(m => RenderRow(m)) : <></>}
                        <tr>
                            <td><input type='text' placeholder='T-Seets Name' className='job_code' id={`new-jobcode`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td><input type='text' placeholder='Proper Name' className='job_name' id={`new-jobname`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td><input type='number' placeholder='0' className='price' id={`new-price`} onBlur={(e) => { numberValidatorEventListener(e); handleTextInputChange('new', e) }} onKeyDown={e => { handleKeyDown('new', e) }} style={{ width: '5rem', padding: '1rem' }}></input></td>
                            <td className='isHourly'><Checkbox id={`new-isHourly`} checked={newIsHourly} borderWidth='2px' borderColor={localStorage.getItem('accentColor') || '#e3de00'} size='30px' icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e3de00'} size={30} />} onChange={e => handleTextInputChange('new', { isHourly: true, selection: e })} style={{ backgroundColor: '#1b1b1b67' }} /></td>
                            {!newIsHourly ? <>
                                <td><Checkbox id={`new-isHourly`} checked={true} borderWidth='2px' borderColor={localStorage.getItem('accentColor') || '#e3de00'} size='30px' icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e3de00'} size={30} />} onChange={e => handleTextInputChange('new', { isAsset: true, selection: e })} style={{ backgroundColor: '#1b1b1b67' }} /></td>
                                <td><Select menuPlacement='auto' options={multiSelectOptions}
                                    isMulti
                                    closeMenuOnSelect={false}
                                    styles={selectStyles}
                                    isSearchable
                                    onChange={e => selectionChange('new', e)} /></td>
                            </> : <></>}
                        </tr>
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='7' disableSearch {...props} />
        </>
    )
}

export default JobPage

const multiSelectOptions = [
    { value: 'IGEL', label: 'IGEL' },
    { value: 'Thick', label: 'Thick' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'MiFi', label: 'MiFi' },
]

const multiSelectIndexer = { 'IGEL': 0, 'Thick': 1, 'Phone': 2, 'Tablet': 3, 'MiFi': 4 }