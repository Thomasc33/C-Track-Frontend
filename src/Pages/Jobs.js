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
    const [newStatusOnly, setNewStatusOnly] = useState(false)
    const [newPromptCount, setNewPromptCount] = useState(false)
    const [newAppliesSelection, setNewAppliesSelection] = useState([])
    const [newHourlyGoal, setNewHourlyGoal] = useState(null)
    const [updated, setUpdated] = useState(0)
    const [newRestrictedComments, setNewRestrictedComments] = useState(null)
    const [newSnipeId, setNewSnipeId] = useState(null)
    const { loading, data = [], setData } = useFetch(`${APILink}/full`, null)

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

    const handleTextInputChange = async (id, e) => {
        if (!e.isHourly && !e.isSelect && !e.isAsset && !e.statusOnly && !e.promptCount) {
            if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        }
        if (id === 'new') {
            if (e.isHourly) setNewIsHourly(e.selection)
            else if (e.isAsset) setNewIsAsset(e.selection)
            else if (e.statusOnly) setNewStatusOnly(e.selection)
            else if (e.promptCount) setNewPromptCount(e.selection)
            else switch (e.target.id) {
                case 'new-price': setNewPrice(e.target.value); break;
                case 'new-hourly_goal': setNewHourlyGoal(e.target.value); break;
                case 'new-jobname': setNewJobName(e.target.value); break;
                case 'new-jobcode': setNewJobCode(e.target.value); break;
                case 'new-comments': setNewRestrictedComments(e.target.value); break
                case 'new-snipe_id': setNewSnipeId(e.target.value); break;
                default: console.log('Default Case hit for new in jobs'); return
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
                } else if (e.statusOnly) {
                    formData.change = 'statusOnly'
                    formData.value = e.selection.toString()
                } else if (e.promptCount) {
                    formData.change = 'promptCount'
                    formData.value = e.selection.toString()
                } else switch (e.target.className) {
                    case 'price':
                        if (e.target.value !== i.price) if (e.target.value) {
                            formData.change = 'price'
                            formData.value = e.target.value.replace(/[^.\d]/g, '')
                        }
                        break;
                    case 'hourly_goal':
                        if (e.target.value !== i.hourly_goal) {
                            formData.change = 'hourly_goal'
                            if (e.target.value) formData.value = e.target.value.replace(/[^.\d]/g, '')
                        }
                        break;
                    case 'snipe_id':
                        if (e.target.value !== i.price) {
                            formData.change = 'snipe_id'
                            if (e.target.value) formData.value = e.target.value.replace(/[^.\d]/g, '')
                        }
                        break;
                    case 'job_name':
                        if (e.target.value !== i.job_name) if (e.target.value) formData.change = 'job_name'
                        break;
                    case 'job_code':
                        if (e.target.value !== i.job_code) if (e.target.value) formData.change = 'job_code'
                        break;
                    case 'comments':
                        if (e.target.value !== i.restricted_comments) formData.change = 'restricted_comments'
                        break
                    default:
                        return alert('Default case hit, please contact Thomas C')
                }

                if (!formData.change) return

                if (!formData.value && !e.isSelect) formData.value = e.target.value || null

                //send to api
                let token = await getTokenSilently()
                let res = await jobService.edit(formData, token)
                if (res.isErrored) {
                    console.error(res.error.response)
                    if (!e.isHourly && !e.isSelect && !e.isAsset && e.target) e.target.classList.add('invalid')
                }
            }
        }
    }

    const sendNewToAPI = async () => {
        let formData = {
            job_code: newJobCode,
            job_name: newJobName,
            price: newPrice,
            isHourly: newIsHourly,
            applies: newAppliesSelection.map(m => m.value).join(','),
            isAsset: newIsAsset,
            hourly_goal: newHourlyGoal,
            statusOnly: newStatusOnly,
            restricted_comments: newRestrictedComments,
            promptCount: newPromptCount,
            snipe_id: newSnipeId
        }
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
                    'Access-Control-Allow-Origin': '*',
                    'X-Version': require('../backendVersion.json').version
                }
            });
            const d = await response.json();
            setData(d);
            setLoading(false)
        }
    }

    const selectionChange = async (id, e) => {
        if (id === 'new') setNewAppliesSelection(e)
        handleTextInputChange(id, { selection: e, isSelect: true })
    }

    const numberValidatorEventListener = (e) => {
        e.target.value = e.target.value.replace(/[^.\d]/g, '')
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
                    onKeyDown={e => handleKeyDown(row.id, e)}
                    style={{ width: '15vw', padding: '1rem' }} />
            </td>
            <td>
                <input type='text'
                    defaultValue={row.job_name}
                    className='job_name'
                    id={`${row.id}-job_name`}
                    onBlur={e => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)}
                    style={{ width: '15vw', padding: '1rem' }} />
            </td>
            {props.permissions.view_reports || props.isAdmin ?
                <td>
                    <input type='number'
                        defaultValue={row.price}
                        className='price'
                        id={`${row.id}-price`}
                        onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(row.id, e) }}
                        onKeyDown={e => { handleKeyDown(row.id, e) }}
                        style={{ width: '5rem', padding: '1rem' }}
                        step='0.01' />
                </td>
                : undefined}
            <td>
                <Checkbox id={`${row.id}-isHourly`}
                    checked={row.is_hourly}
                    borderWidth='2px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                    onChange={e => { row.is_hourly = e; setUpdated(updated + 1); handleTextInputChange(row.id, { isHourly: true, selection: e }) }} />
            </td>

            {!row.is_hourly ?
                <><td>
                    <Checkbox id={`${row.id}-isAsset`}
                        checked={row.requires_asset}
                        borderWidth='2px'
                        borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                        style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                        size='30px'
                        icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                        onChange={e => handleTextInputChange(row.id, { isAsset: true, selection: e })} />
                </td>
                    <td>
                        <input type='number'
                            defaultValue={row.hourly_goal}
                            placeholder='Target'
                            className='hourly_goal'
                            id={`${row.id}-hourly_goal`}
                            onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(row.id, e) }}
                            onKeyDown={e => { handleKeyDown(row.id, e) }}
                            style={{ width: '7rem', padding: '1rem' }} />
                    </td>
                    <td>
                        <Select menuPlacement='auto' options={multiSelectOptions}
                            isMulti
                            closeMenuOnSelect={false}
                            styles={selectStyles}
                            defaultValue={defaultOptions}
                            isSearchable
                            width='20vw'
                            onChange={e => selectionChange(row.id, e)} />
                    </td></> : <><td /><td /><td /></>}
            <td>
                <Checkbox id={`${row.id}-statusOnly`}
                    checked={row.status_only}
                    borderWidth='2px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                    onChange={e => { row.status_only = e; setUpdated(updated + 1); handleTextInputChange(row.id, { statusOnly: true, selection: e }) }} />
            </td>
            <td >
                <Checkbox id={`${row.id}-promptCount`}
                    checked={row.prompt_count}
                    borderWidth='2px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                    onChange={e => { row.prompt_count = e; setUpdated(updated + 1); handleTextInputChange(row.id, { promptCount: true, selection: e }) }} />
            </td>
            <td>
                <input type='text'
                    defaultValue={row.restricted_comments}
                    placeholder='Restricted Comments'
                    className='comments'
                    id={`${row.id}-comments`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)}
                    style={{ width: '15vw', padding: '1rem' }} />
            </td>
            <td>
                {!row.isHourly && row.requires_asset ?
                    <input type='number'
                        defaultValue={row.snipe_id}
                        placeholder='Snipe ID'
                        className='snipe_id'
                        id={`${row.id}-snipe_id`}
                        onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(row.id, e) }}
                        onKeyDown={e => { handleKeyDown(row.id, e) }}
                        style={{ width: '7rem', padding: '1rem' }} />
                    : undefined}
            </td>
        </tr>)
    }


    //returns blank page if data is loading
    if (loading || !data) return <PageTemplate highLight='jobs' {...props} />
    else return (
        <>
            <div className='AssetArea' style={{ top: '8vh', height: '92vh' }}>
                <table className='rows' style={{ overflowX: 'auto', minWidth: '100vw', left: 0, top: 0 }}>
                    <thead>
                        <tr>
                            <th style={{ width: '30vw', padding: '1rem' }}>Job Code</th>
                            <th style={{ width: '30vw', padding: '1rem' }}>Job Name</th>
                            {props.permissions.view_reports || props.isAdmin ? <th style={{ width: '5vw', padding: '1rem' }}>Price</th> : undefined}
                            <th style={{ width: '25vw', padding: '1rem' }}>Hourly</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Asset</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Hrly Target</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Applies To</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Not Usable</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Prompt Count</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Comments</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Snipe ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {newJobCode && newJobName && newPrice ? <i className="material-icons delete-icon" onClick={e => sendNewToAPI()}>save</i> : undefined}
                                <input type='text' placeholder='T-Seets Name' className='job_code' id={`new-jobcode`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input>
                            </td>
                            <td><input type='text' placeholder='Proper Name' className='job_name' id={`new-jobname`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            {props.permissions.view_reports || props.isAdmin ?
                                <td><input type='number' placeholder='0' className='price' id={`new-price`} onBlur={(e) => { numberValidatorEventListener(e); handleTextInputChange('new', e) }} onKeyDown={e => { handleKeyDown('new', e) }} style={{ width: '5rem', padding: '1rem' }} step='0.01'></input></td>
                                : undefined}
                            <td><Checkbox id={`new-isHourly`} checked={newIsHourly} borderWidth='2px' borderColor={localStorage.getItem('accentColor') || '#00c6fc'} size='30px' icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />} onChange={e => handleTextInputChange('new', { isHourly: true, selection: e })} style={{ backgroundColor: '#1b1b1b67' }} /></td>
                            {!newIsHourly ? <>
                                <td><Checkbox id={`new-isHourly`} checked={true} borderWidth='2px' borderColor={localStorage.getItem('accentColor') || '#00c6fc'} size='30px' icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />} onChange={e => handleTextInputChange('new', { isAsset: true, selection: e })} style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }} /></td>
                                <td>
                                    <input type='number'
                                        className='hourly_goal'
                                        id={`new-hourly_goal`}
                                        placeholder='Target'
                                        onBlur={e => { numberValidatorEventListener(e); handleTextInputChange('new', e) }}
                                        onKeyDown={e => { handleKeyDown('new', e) }}
                                        style={{ width: '7rem', padding: '1rem' }} />
                                </td>
                                <td><Select menuPlacement='auto' options={multiSelectOptions}
                                    isMulti
                                    closeMenuOnSelect={false}
                                    styles={selectStyles}
                                    isSearchable
                                    onChange={e => selectionChange('new', e)} /></td>
                            </> : <><td /><td /><td /></>}
                            <td>
                                <Checkbox id={`new-statusOnly`}
                                    borderWidth='2px'
                                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                                    style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                                    size='30px'
                                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                                    onChange={e => { handleTextInputChange('new', { statusOnly: true, selection: e }) }} />
                            </td>
                            <td>
                                <Checkbox id={`new-promptCount`}
                                    borderWidth='2px'
                                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                                    style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }}
                                    size='30px'
                                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />}
                                    onChange={e => { handleTextInputChange('new', { promptCount: true, selection: e }) }} />
                            </td>
                            <td className='comments'>
                                <input type='text' placeholder='Comma Seperated Comments' className='comments' id={`new-comments`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <input type='number'
                                    className='snipe_id'
                                    id={`new-snipe_id`}
                                    placeholder='Snipe ID'
                                    onBlur={e => { numberValidatorEventListener(e); handleTextInputChange('new', e) }}
                                    onKeyDown={e => { handleKeyDown('new', e) }}
                                    style={{ width: '7rem', padding: '1rem' }} />
                            </td>
                        </tr>
                        {data.job_codes ? data.job_codes.map(m => RenderRow(m)) : <></>}
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='jobs' {...props} />
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

const multiSelectIndexer = {}
for (let i in multiSelectOptions) multiSelectIndexer[multiSelectOptions[i].value] = i