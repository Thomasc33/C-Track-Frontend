import React, { useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useFetch } from '../Helpers/API';
import { useMSAL } from '../Helpers/MSAL';
import jobService from '../Services/Job'
import Select from 'react-select';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';

const settings = require('../settings.json')
const initialNewJobState = {
    code: '',
    name: '',
    price: 0,
    isHourly: false,
    isAsset: true,
    isStatusOnly: false,
    doesPromptCount: false,
    applies: [],
    usageRuleGroup: null,
    hourlyGoal: null,
    restrictedComments: null,
    snipeId: null
}

function JobPage(props) {
    // Hooks and Constants
    const { token, tokenLoading } = useMSAL()
    let APILink = `${settings.APIBase}/job`
    const { loading, data = [], setData } = useFetch(`${APILink}/full`, null)
    const selectStyles = {
        control: (styles, { selectProps: { width } }) => ({ ...styles, backgroundColor: 'transparent', width }),
        menu: (provided, state) => ({ ...provided, width: state.selectProps.width, }),
        noOptionsMessage: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        menuList: (styles) => ({ ...styles, backgroundColor: '#1b1b1b' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => { return { ...styles, backgroundColor: '#1b1b1b', color: 'white', ':active': { ...styles[':active'], backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67', }, ':hover': { ...styles[':hover'], backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' } }; },
        multiValue: (styles, { data }) => { return { ...styles, backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67', }; },
        multiValueLabel: (styles, { data }) => ({ ...styles, color: data.color, }),
        multiValueRemove: (styles, { data }) => ({ ...styles, color: 'white', ':hover': { color: 'red', }, }),
    }

    // States
    const [newJob, setNewJob] = useState(initialNewJobState)
    const [, setLoading] = useState(false)
    const [updated, setUpdated] = useState(0)
    const [doUpdate, setDoUpdate] = useState(false)

    // Effects
    useEffect(() => {
        async function getData() {
            const response = await fetch(`${APILink}/full`, {
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Access-Control-Allow-Origin': '*',
                    'X-Version': require('../backendVersion.json').version
                }
            });
            const d = await response.json();
            setData(d);
            setDoUpdate(false)
        }
        if (doUpdate) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doUpdate])

    // Return to home page if user can't view route
    if (!props.permissions.view_jobcodes && !props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //

    // Main function for handling changes
    const handleTextInputChange = async (id, e) => {
        if (!e.isHourly && !e.isSelect && !e.isAsset && !e.statusOnly && !e.promptCount) {
            if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        }
        if (id === 'new') {
            if (e.isHourly) setNewJob({ ...newJob, isHourly: e.selection })
            else if (e.isAsset) setNewJob({ ...newJob, isAsset: e.selection })
            else if (e.statusOnly) setNewJob({ ...newJob, isStatusOnly: e.selection })
            else if (e.promptCount) setNewJob({ ...newJob, doesPromptCount: e.selection })
            else if (!e.isSelect && e.target) switch (e.target.id) {
                case 'new-price': setNewJob({ ...newJob, price: e.target.value }); break;
                case 'new-hourly_goal': setNewJob({ ...newJob, hourlyGoal: e.target.value }); break;
                case 'new-jobname': setNewJob({ ...newJob, name: e.target.value }); break;
                case 'new-jobcode': setNewJob({ ...newJob, code: e.target.value }); break;
                case 'new-comments': setNewJob({ ...newJob, restrictedComments: e.target.value }); break
                case 'new-snipe_id': setNewJob({ ...newJob, snipeId: e.target.value }); break;
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
                    if (e.isUsage) {
                        formData.change = 'usageRule'
                        formData.value = e.selection
                    } else {
                        formData.change = 'applies'
                        formData.value = e.selection.map(m => m.value).join(',')
                    }
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
                let res = await jobService.edit(formData, token)
                if (res.isErrored) {
                    console.error(res.error.response)
                    if (!e.isHourly && !e.isSelect && !e.isAsset && e.target) e.target.classList.add('invalid')
                }

                // Update data
                setDoUpdate(true)
            }
        }
    }

    // Handles sending new data to API
    const sendNewToAPI = async () => {
        let formData = {
            job_code: newJob.code,
            job_name: newJob.name,
            price: newJob.price,
            isHourly: newJob.isHourly,
            applies: newJob.applies.map(m => m.value).join(','),
            isAsset: newJob.isAsset,
            hourly_goal: newJob.hourlyGoal,
            statusOnly: newJob.isStatusOnly,
            restricted_comments: newJob.restrictedComments,
            promptCount: newJob.doesPromptCount,
            snipe_id: newJob.snipeId,
            usageRuleGroup: newJob.usageRuleGroup
        }
        setLoading(true)
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
            setNewJob(initialNewJobState)
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

    // Handles changing of the "applies to" selection
    const selectionChange = async (id, e) => {
        if (id === 'new') setNewJob({ ...newJob, applies: e })
        else handleTextInputChange(id, { selection: e, isSelect: true })
    }

    const handeUsageRulesChange = async (id, e) => {
        console.log(e)
        if (id === 'new') setNewJob({ ...newJob, usageRuleGroup: e })
        else handleTextInputChange(id, { selection: e, isSelect: true, isUsage: true })
    }

    // Validates text inputed is number
    const numberValidatorEventListener = (e) => {
        e.target.value = e.target.value.replace(/[^.\d]/g, '')
    }

    // Enter handler
    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e)
    }

    // --- Renderer --- //
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
                    </td>
                    <td>
                        <SelectSearch
                            options={usageRulesOptions}
                            search
                            placeholder="Group"
                            value={row.usage_rule_group && row.usage_rule_group !== 'remove' ? row.usage_rule_group : undefined}
                            className='job_list'
                            filterOptions={fuzzySearch}
                            autoComplete='on'
                            onChange={e => handeUsageRulesChange(row.id, e)} />
                    </td>
                </> : <><td /><td /><td /><td /></>}
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


    // Returns blank page if data is loading
    if (loading || tokenLoading || !data) return <></>
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
                            <th style={{ width: '25vw', padding: '1rem' }}>Usage Rules</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Not Usable</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Prompt Count</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Comments</th>
                            <th style={{ width: '25vw', padding: '1rem' }}>Snipe ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {newJob.code && newJob.name && newJob.price ? <i className="material-icons delete-icon" onClick={e => sendNewToAPI()}>save</i> : undefined}
                                <input type='text' placeholder='T-Seets Name' className='job_code' id={`new-jobcode`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input>
                            </td>
                            <td><input type='text' placeholder='Proper Name' className='job_name' id={`new-jobname`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            {props.permissions.view_reports || props.isAdmin ?
                                <td><input type='number' placeholder='0' className='price' id={`new-price`} onBlur={(e) => { numberValidatorEventListener(e); handleTextInputChange('new', e) }} onKeyDown={e => { handleKeyDown('new', e) }} style={{ width: '5rem', padding: '1rem' }} step='0.01'></input></td>
                                : undefined}
                            <td><Checkbox id={`new-isHourly`} checked={newJob.isHourly} borderWidth='2px' borderColor={localStorage.getItem('accentColor') || '#00c6fc'} size='30px' icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />} onChange={e => handleTextInputChange('new', { isHourly: true, selection: e })} style={{ backgroundColor: '#1b1b1b67' }} /></td>
                            {!newJob.isHourly ? <>
                                <td><Checkbox id={`new-isHourly`} checked={true} borderWidth='2px' borderColor={localStorage.getItem('accentColor') || '#00c6fc'} size='30px' icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={30} />} onChange={e => handleTextInputChange('new', { isAsset: true, selection: e })} style={{ backgroundColor: '#1b1b1b67', cursor: 'pointer' }} /></td>
                                <td><input type='number'
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
                                    onChange={e => selectionChange('new', e)} />
                                </td>
                                <td><SelectSearch
                                    options={usageRulesOptions}
                                    search
                                    placeholder="Group"
                                    value={newJob.usageRuleGroup && newJob.usageRuleGroup !== 'remove' ? newJob.usageRuleGroup : undefined}
                                    className='job_list'
                                    filterOptions={fuzzySearch}
                                    autoComplete='on'
                                    onChange={e => handeUsageRulesChange('new', e)} />
                                </td>
                            </> : <><td /><td /><td /><td /></>}
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

const usageRulesOptions = [
    { value: 'remove', name: 'Remove' },
    { value: 'chkn', name: 'Check-in' },
    { value: 'ship', name: 'Ship' },
    { value: 'deploy', name: 'Deploy' },
    { value: 'decom', name: 'Decommission' },
    { value: 'work', name: 'Work' },
    { value: 'new', name: 'New Asset' },
]

const multiSelectIndexer = {}
for (let i in multiSelectOptions) multiSelectIndexer[multiSelectOptions[i].value] = i