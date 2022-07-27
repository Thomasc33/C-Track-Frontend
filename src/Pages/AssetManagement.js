import React, { useState } from 'react';
import { Navigate } from 'react-router-dom'
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import Asset from '../Services/Asset';
import { confirmAlert } from 'react-confirm-alert';
import { Button } from '@material-ui/core';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';
import '../css/Asset.css'

const settings = require('../settings.json')

const dontRender = ['id', 'status', 'model_number', 'notes', 'watching', 'hold_type']
const dataTypes = [{ name: 'varchar(50)', value: 'varchar(50)' }, { name: 'varchar(255)', value: 'varchar(255)' }, { name: 'varchar(15)', value: 'varchar(15)' },
{ name: 'text', value: 'text' }, { name: 'tinyint', value: 'tinyint' }, { name: 'int(11)', value: 'int(11)' },
{ name: 'int', value: 'int' }, { name: 'decimal(13,4)', value: 'decimal(13,4)' }, { name: 'date', value: 'date' },
{ name: 'time', value: 'time' }, { name: 'datetime', value: 'datetime' }]

function AssetManagement(props) {
    const { instance, accounts } = useMsal()
    let APILink = `${settings.APIBase}/`
    const { loading, data = [] } = useFetch(APILink.concat('asset/types'), null)
    const [updatedRows, setUpdatedRows] = useState({})

    if (!props.isAdmin) return <Navigate to='/' />

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

    const handleChange = async (column, e, type) => {
        if (!type) return

        let t
        if (updatedRows[column || 'new']) t = updatedRows[column || 'new']
        else if (column === 'new') t = { DATA_TYPE: undefined, IS_NULLABLE: true, COLUMN_NAME: undefined }
        else for (let i of data.data) if (i.COLUMN_NAME === column) t = { ...i }

        switch (type) {
            case 'name':
                t.COLUMN_NAME = e.target.value.replace(/[^a-z_]/gi, '').toLowerCase()
                break;
            case 'datatype':
                let ind = e.indexOf('(')
                if (ind >= 0) {
                    t.DATA_TYPE = e.substr(0, ind)
                    t.CHARACTER_MAXIMUM_LENGTH = e.substr(ind + 1).replace(/[^\d]/gi, '')
                } else t.DATA_TYPE = e
                break;
            case 'nullable':
                t.IS_NULLABLE = e ? 1 : 0
                break;
            default:
                return console.log('defualt case hit on assetmanagement, handleChange', type)
        }

        let c = { ...updatedRows }
        c[column] = t

        setUpdatedRows(c)
    }

    const handleDelete = async (column, e) => {
        let token = await getTokenSilently()
        let r = await Asset.alterDelete(column, token)
        if (r.isErrored) alert(`Errored:\n${r.error}`)
        else alert('Success, refresh page to confirm changes took effect')
    }

    const handleSave = async (column, e) => {
        if (!updatedRows[column]) return console.log(`save attempted with nothing in udpated rows, ${column}, ${updatedRows}`)
        let token = await getTokenSilently()
        let r = await Asset.alter(updatedRows[column], token)
        if (r.isErrored) alert(`Errored:\n${r.error}`)
        else alert('Success, refresh page to confirm changes took effect')
    }

    const handleNew = async (e) => {
        if (!updatedRows.new || !updatedRows.new.COLUMN_NAME || !updatedRows.new.DATA_TYPE || ![true, false].includes(updatedRows.new.IS_NULLABLE)) {
            console.log(updatedRows)
            alert('Missing information for the new data')
            return
        }
        let token = await getTokenSilently()
        let r = await Asset.alterNew(updatedRows.new, token)
        if (r.isErrored) alert(`Errored:\n${r.error}`)
        else alert('Success, refresh page to confirm changes took effect')
    }

    const confirm = async (column, e, type) => {
        return confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className='confirm-alert'>
                        <h1>Confirm</h1>
                        <p>Modifying the database can result in data loss. Please only continue if you know what you are doing and have a recent backup in case things go south.</p>
                        <br />
                        <span style={{ margins: '1rem' }}>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67' }} onClick={() => {
                                if (type === 0) handleDelete(column, e)
                                else if (type === 1) handleSave(column, e)
                                else if (type === 2) handleNew(e)
                                onClose()
                            }}
                            >Confirm</Button>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349' }} onClick={() => {
                                onClose()
                            }}>Nevermind</Button>
                        </span>
                    </div>
                )
            }
        })
    }

    function RenderRow(row) {
        if (row !== 'new' && dontRender.includes(row.COLUMN_NAME)) return undefined
        return (<tr id={`${row.COLUMN_NAME || 'new'}-row`} key={`${row.COLUMN_NAME || 'new'}-row`}>
            <td>
                {row === 'new' ?
                    <input type='text' onBlur={e => handleChange('new', e, 'name')} placeholder='New...' />
                    :
                    <p>{row.COLUMN_NAME}</p>
                }
            </td>
            <td>
                <SelectSearch
                    options={dataTypes}
                    search
                    placeholder="Job Code"
                    value={row.CHARACTER_MAXIMUM_LENGTH ? row.DATA_TYPE !== 'text' ? `${row.DATA_TYPE}(${row.CHARACTER_MAXIMUM_LENGTH})` : row.DATA_TYPE : row.DATA_TYPE}
                    filterOptions={fuzzySearch}
                    className='job_list'
                    autoComplete='on'
                    onChange={e => handleChange(row.COLUMN_NAME || 'new', e, 'datatype')}
                    id={`${row.COLUMN_NAME}-jobcode`}
                />
            </td>
            <td>
                <Checkbox
                    id={`${row.id}-isAdmin`}
                    className='isAdmin'
                    checked={row === 'new' ? true : row.IS_NULLABLE}
                    borderWidth='5px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={36} />}
                    onChange={e => handleChange(row.COLUMN_NAME || 'new', e, 'nullable')} />
            </td>
            <td>{row === 'new' ? undefined : <i className="material-icons delete-icon" onClickCapture={e => confirm(row.COLUMN_NAME || 'new', e, 0)}>delete_outline</i>}</td>
            <td>
                {updatedRows[row.COLUMN_NAME || 'new'] ?
                    <i className='material-icons delete-icon' onClickCapture={e => confirm(row.COLUMN_NAME || 'new', e, row === 'new' ? 2 : 1)}>save</i>
                    : undefined}
            </td>
        </tr >)
    }


    //returns blank page if data is loading
    if (loading || !data) return <PageTemplate highLight='assetmanagement' {...props} />
    else return (
        <>
            <div className='AssetArea'>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Datatype</th>
                            <th style={{ width: '8rem' }}>Nullable</th>
                            <th style={{ width: '8rem' }}>Delete</th>
                            <th style={{ width: '6rem' }}>Save</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.data ? data.data.map(m => RenderRow(m)) : <></>}
                        {RenderRow('new')}
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='assetmanagement' {...props} />
        </>
    )
}

export default AssetManagement