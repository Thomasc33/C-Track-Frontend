// Imports
import React, { useState } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { Navigate } from 'react-router-dom'
import { useFetch } from '../Helpers/API';
import { useMSAL } from '../Helpers/MSAL';
import { confirmAlert } from 'react-confirm-alert';
import { Button } from '@material-ui/core';
import Asset from '../Services/Asset';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';

const settings = require('../settings.json')

// --- Global Constants --- //

// dontRender is a list of fields that won't show on this page due to being required for the site to function
const dontRender = ['id', 'status', 'model_number', 'notes', 'watching', 'hold_type', 'location']
// dataTypes is a list of different datatypes accepted by SQL Server and would actually be used
const dataTypes = [{ name: 'varchar(50)', value: 'varchar(50)' }, { name: 'varchar(255)', value: 'varchar(255)' }, { name: 'varchar(15)', value: 'varchar(15)' },
{ name: 'text', value: 'text' }, { name: 'tinyint', value: 'tinyint' }, { name: 'int(11)', value: 'int(11)' },
{ name: 'int', value: 'int' }, { name: 'decimal(13,4)', value: 'decimal(13,4)' }, { name: 'date', value: 'date' },
{ name: 'time', value: 'time' }, { name: 'datetime', value: 'datetime' }]

function AssetManagement(props) {
    // MSAL, Constants, and Hooks
    const { token, tokenLoading } = useMSAL()
    let APILink = `${settings.APIBase}/`

    // useEffect and fetch wrapper for API data
    const { loading, data = [] } = useFetch(APILink.concat('asset/types'), null)

    // States
    const [updatedRows, setUpdatedRows] = useState({})

    // Return to home page if the user cannot access this page
    if (!props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //

    // Handles the changing of a field
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

    // Handles the deletion of a row
    const handleDelete = async (column, e) => {
        let r = await Asset.alterDelete(column, token)
        if (r.isErrored) alert(`Errored:\n${r.error}`)
        else alert('Success, refresh page to confirm changes took effect')
    }

    // Handles the saving of a row after creation/modification
    const handleSave = async (column, e) => {
        if (!updatedRows[column]) return console.log(`save attempted with nothing in udpated rows, ${column}, ${updatedRows}`)
        let r = await Asset.alter(updatedRows[column], token)
        if (r.isErrored) alert(`Errored:\n${r.error}`)
        else alert('Success, refresh page to confirm changes took effect')
    }

    // Handles adding a new column
    const handleNew = async (e) => {
        if (!updatedRows.new || !updatedRows.new.COLUMN_NAME || !updatedRows.new.DATA_TYPE || ![true, false].includes(updatedRows.new.IS_NULLABLE)) {
            console.log(updatedRows)
            alert('Missing information for the new data')
            return
        }
        let r = await Asset.alterNew(updatedRows.new, token)
        if (r.isErrored) alert(`Errored:\n${r.error}`)
        else alert('Success, refresh page to confirm changes took effect')
    }

    // Handles confirmation of saving or deleting a column
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

    // Rendering function for each column of the database
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
                    placeholder="Data Type"
                    value={row.CHARACTER_MAXIMUM_LENGTH ? row.DATA_TYPE !== 'text' ? `${row.DATA_TYPE}(${row.CHARACTER_MAXIMUM_LENGTH})` : row.DATA_TYPE : row.DATA_TYPE}
                    className='job_list'
                    filterOptions={fuzzySearch}
                    autoComplete='on'
                    onChange={e => handleChange(row.COLUMN_NAME || 'new', e, 'datatype')}
                />
            </td>
            <td>
                <Checkbox
                    id={`${row.id}-isAdmin`}
                    className='isAdmin'
                    checked={row === 'new' ? true : row.IS_NULLABLE}
                    borderWidth='5px'
                    borderColor={localStorage.getItem('accentColor') || '#e67c52'}
                    style={{ cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#e67c52'} size={36} />}
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

    // Returns blank page if data is loading
    if (loading || !data || tokenLoading) return <></>
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
        </>
    )
}

export default AssetManagement