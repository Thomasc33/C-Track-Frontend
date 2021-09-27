import React from 'react';
import PageTemplate from './Template'
import { useState, useEffect } from 'react';
import { useFetch } from '../Helpers/API';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import jobService from '../Services/Job'
import { useMsal } from '@azure/msal-react';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import '../css/Asset.css'
import '../css/Jobs.css'
const settings = require('../settings.json')

function JobPage() {
    const { instance, accounts } = useMsal()
    let APILink = `${settings.APIBase}/job/`
    const [newJobCode, setNewJobCode] = useState(0);
    const [newAssetTag, setNewAssetTag] = useState('');
    const [newComment, setNewComment] = useState('');
    const { loading, data = [], setData } = useFetch(`${APILink}/all`, null)
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
        if (id === 'new') {
            let job_code = newJobCode;
            let asset = newAssetTag;
            let comment = newComment;
            if (!isNaN(parseInt(e))) { setNewJobCode(parseInt(e)); job_code = parseInt(e) }
            else switch (e.target.id) {
                case 'new-notes':
                    comment = e.target.value
                    await setNewComment(e.target.value)
                    break;
                case 'new-assetid':
                    asset = e.target.value
                    await setNewAssetTag(e.target.value)
                    break;
                default:
                    console.log('Default Case hit for new')
                    return
            }

            //data validation
            let cont = true;
            if (!job_code) {
                document.getElementById('new-jobcode').getElementsByTagName('input')[0].classList.add('invalid')
                cont = false
            }
            if (!asset) {
                document.getElementById('new-assetid').classList.add('invalid')
                cont = false
            }
            if (!cont) return

            //send to api
            let formData = {
                job_code: job_code,
                asset_id: asset,
                notes: comment,
            }
            let token = await getTokenSilently()
            let res = await jobService.add(formData, token)
            if (res.isErrored) {
                document.getElementById('new-assetid').classList.add('invalid')
            } else {
                const response = await fetch(`${APILink}/all`, {
                    mode: 'cors',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Access-Control-Allow-Origin': '*'
                    }
                });
                const d = await response.json();
                console.log(d)
                document.getElementById('new-assetid').value = ''
                document.getElementById('new-notes').value = ''
                setData(d);
                setNewComment('')
                setNewAssetTag('')
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
                if (e.toString() == 'false' || e.toString() == 'true') {
                    formData.change = 'isHourly'
                    formData.value = e.toString()
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

                if (!formData.value) formData.value = e.target.value
                return
                //send to api
                let token = await getTokenSilently()
                let res = await jobService.edit(formData, token)
                if (res.isErrored) {
                    e.target.classList.add('invalid')
                }
            }
        }
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
        console.log(row)
        return (<tr id={`${row.id}-row`}>
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
                <input type='text'
                    defaultValue={row.price}
                    className='price'
                    id={`${row.id}-price`}
                    onBlur={e => { numberValidatorEventListener(e); handleTextInputChange(row.id, e) }}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
            </td>
            <td>
                <Checkbox id={`${row.id}-isHourly`}
                    className='isHourly'
                    checked={row.is_hourly}
                    borderWidth='5px'
                    borderColor="#8730d9"
                    size='30px'
                    icon={<Icon.FiCheck color='#8730d9' size={30} />}
                    onChange={e => handleTextInputChange(row.id, e)} />
            </td>
        </tr >)
    }


    //returns blank page if data is loading
    if (loading || !data) return <PageTemplate highLight='4' disableSearch />
    else return (
        <>
            <div className='assetarea'>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th>Job Code</th>
                            <th>Job Name</th>
                            <th>Price</th>
                            <th>Hourly</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.job_codes ? data.job_codes.map(m => RenderRow(m)) : <></>}
                        <tr>
                            <td><input type='text' className='job_code' id={`new-jobcode`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td><input type='text' className='job_name' id={`new-jobname`} onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td><input type='text' className='price' id={`new-price`} onBlur={(e) => { numberValidatorEventListener(e); handleTextInputChange('new', e) }} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                            <td><Checkbox id={`new-isHourly`} className='isHourly' checked={false} borderWidth='5px' borderColor="#8730d9" size='30px' icon={<Icon.FiCheck color='#8730d9' size={30} />} onChange={e => handleTextInputChange('new', e)} /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='4' disableSearch />
        </>
    )
}

export default JobPage