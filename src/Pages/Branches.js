import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useFetch } from '../Helpers/API';
import { useMSAL } from '../Helpers/MSAL';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';
import axios from 'axios';

//https://share.curohs.com/dept/_vti_bin/owssvr.dll?XMLDATA=1&List={0A3683DF-3451-4803-AA8E-ED37816D98C3}&View={3A667BA8-8DA1-4712-B4A0-C748844C6291}&RowLimit=0&RootFolder=%2fdept%2fLists%2fBranchDirectory

const settings = require('../settings.json')
const initialNewJobState = {
    branch: '',
    entity_number: '',
    isClosed: false,
    notes: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: ''
}

function BranchPage(props) {
    // Hooks and Constants
    const { token, tokenLoading } = useMSAL()
    let APILink = `${settings.APIBase}/branch`
    const { loading, data = [], setData } = useFetch(`${APILink}/full`, null)

    // States
    const [newBranch, setNewBranch] = useState(initialNewJobState)
    const [, setLoading] = useState(false)
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
        if (doUpdate && token) getData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doUpdate, token])

    // Return to home page if user can't view route
    if (!props.permissions.view_jobcodes && !props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //

    // Main function for handling changes
    const handleTextInputChange = async (id, e) => {
        if (!e.isClosed) if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        if (id === 'new') {
            if (e.isClosed) setNewBranch({ ...newBranch, isClosed: e.selection })
            else if (!e.isSelect && e.target) switch (e.target.id) {
                case 'new-branch': setNewBranch({ ...newBranch, branch: e.target.value }); break;
                case 'new-entity_number': setNewBranch({ ...newBranch, entity_number: e.target.value }); break;
                case 'new-notes': setNewBranch({ ...newBranch, notes: e.target.value }); break;
                case 'new-phone': setNewBranch({ ...newBranch, phone: e.target.value }); break;
                case 'new-address': setNewBranch({ ...newBranch, address: e.target.value }); break;
                case 'new-address2': setNewBranch({ ...newBranch, address2: e.target.value }); break;
                case 'new-city': setNewBranch({ ...newBranch, city: e.target.value }); break;
                case 'new-state': setNewBranch({ ...newBranch, state: e.target.value }); break;
                default: console.log('Default Case hit for new in jobs'); return
            }
        } else for (let i of data.branches) {
            if (id === i.id) {
                //data validation
                let formData = { id: i.id, change: null, value: null }

                if (e.isClosed) {
                    formData.change = 'is_closed'
                    formData.value = e.selection.toString()
                } else switch (e.target.id) {
                    case `${i.id}-branch`: if (e.target.value !== i.id) formData.change = 'id'; break;
                    case `${i.id}-entity_number`: if (e.target.value !== i.entity_number) formData.change = 'entity_number'; break;
                    case `${i.id}-notes`: if (e.target.value !== i.notes) formData.change = 'notes'; break;
                    case `${i.id}-phone`: if (e.target.value !== i.phone) formData.change = 'phone'; break;
                    case `${i.id}-address`: if (e.target.value !== i.address) formData.change = 'address'; break;
                    case `${i.id}-address2`: if (e.target.value !== i.address2) formData.change = 'address2'; break;
                    case `${i.id}-city`: if (e.target.value !== i.city) formData.change = 'city'; break;
                    case `${i.id}-state`: if (e.target.value !== i.state) formData.change = 'state'; break;
                    default: console.log('Default Case hit in jobs', i.id); return
                }

                if (!formData.change) return
                if (!formData.value && !e.isClosed) formData.value = e.target.value || null

                //send to api
                let res = await axios.post(`${APILink}/edit`, formData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
                    .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
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
        setLoading(true)
        let res = await axios.post(`${APILink}/new`, newBranch, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': 'ignore' } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        if (res.isErrored) {
            setLoading(false)
            if (document.getElementById('new-jobcode')) document.getElementById('new-jobcode').classList.add('invalid')
        } else {
            if (document.getElementById('new-jobcode')) document.getElementById('new-jobcode').value = ''
            setNewBranch(initialNewJobState)
            const response = await fetch(`${APILink}/full`, {
                mode: 'cors',
                headers: { 'Authorization': `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version }
            });
            const d = await response.json();
            setData(d);
            setLoading(false)
        }
    }

    // Enter handler
    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e)
    }

    // --- Renderer --- //
    function RenderRow(row) {
        return (<tr id={`${row.id}-row`} key={`${row.id}-row`}>
            <td>
                <input type='text'
                    placeholder='Branch'
                    defaultValue={row.id}
                    id={`${row.id}-branch`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='text'
                    placeholder='Entity Number'
                    defaultValue={zeroPad(row.entity_number, 5)}
                    id={`${row.id}-entity_number`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <Checkbox
                    id={`${row.id}-isClosed`}
                    checked={row.is_closed}
                    borderWidth='2px'
                    borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={30} />}
                    onChange={e => handleTextInputChange(row.id, { isClosed: true, selection: e })}
                    style={{ backgroundColor: '#1b1b1b67' }} />
            </td>
            <td>
                <input type='text'
                    placeholder='Notes'
                    defaultValue={row.notes}
                    id={`${row.id}-notes`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='text'
                    placeholder='Phone'
                    defaultValue={row.phone}
                    id={`${row.id}-phone`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='text'
                    placeholder='Address'
                    defaultValue={row.address}
                    id={`${row.id}-address`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='text'
                    placeholder='Address 2'
                    defaultValue={row.address2}
                    id={`${row.id}-address2`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='text'
                    placeholder='City'
                    defaultValue={row.city}
                    id={`${row.id}-city`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <input type='text'
                    placeholder='State'
                    defaultValue={row.state}
                    id={`${row.id}-state`}
                    onBlur={(e) => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
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
                            <th style={{ width: '10vw', padding: '1rem' }}>Branch</th>
                            <th style={{ width: '30vw', padding: '1rem' }}>Entity Number</th>
                            <th style={{ width: '10vw', padding: '1rem' }}>Closed</th>
                            <th style={{ width: '50vw', padding: '1rem' }}>Notes</th>
                            <th style={{ width: '30vw', padding: '1rem' }}>Phone</th>
                            <th style={{ width: '70vw', padding: '1rem' }}>Address</th>
                            <th style={{ width: '30vw', padding: '1rem' }}>Address 2</th>
                            <th style={{ width: '30vw', padding: '1rem' }}>City</th>
                            <th style={{ width: '10vw', padding: '1rem' }}>State</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {newBranch.branch ? <i className="material-icons delete-icon" onClick={() => sendNewToAPI()}>save</i> : undefined}
                                <input type='text'
                                    placeholder='Branch'
                                    id={`new-branch`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <input type='text'
                                    placeholder='Entity Number'
                                    id={`new-entity_number`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <Checkbox
                                    id={`new-isClosed`}
                                    checked={newBranch.isClosed}
                                    borderWidth='2px'
                                    borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                                    size='30px'
                                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={30} />}
                                    onChange={e => handleTextInputChange('new', { isClosed: true, selection: e })}
                                    style={{ backgroundColor: '#1b1b1b67' }} />
                            </td>
                            <td>
                                <input type='text'
                                    placeholder='Notes'
                                    id={`new-notes`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <input type='text'
                                    placeholder='Phone'
                                    id={`new-phone`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <input type='text'
                                    placeholder='Address'
                                    id={`new-address`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <input type='text'
                                    placeholder='Address 2'
                                    id={`new-address2`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <input type='text'
                                    placeholder='City'
                                    id={`new-city`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                            <td>
                                <input type='text'
                                    placeholder='State'
                                    id={`new-state`}
                                    onBlur={(e) => handleTextInputChange('new', e)}
                                    onKeyDown={e => handleKeyDown('new', e)} />
                            </td>
                        </tr>
                        {data.branches ? data.branches.map(m => RenderRow(m)) : <></>}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default BranchPage

const zeroPad = (num, places) => String(num).padStart(places, '0')