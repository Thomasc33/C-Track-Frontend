import React from 'react';
import PageTemplate from './Template'
import { useState, useEffect } from 'react';
import { useFetch } from '../Helpers/API';
import '../css/Asset.css'
const settings = require('../settings.json')

function AssetPage() {
    //Get data, and update every 2 seconds
    let APILink = `${settings.APIBase}/asset/user/${/* Place holder for user id*/1}/`
    const [date, setDate] = useState(Date.now())
    const { loading, data = [] } = useFetch(APILink.concat(getDate(date)), null)

    const handleDateChange = () => {
        setDate(document.getElementById('date_selector').value)
    }

    const handleTextInputChange = id => {
        console.log('storing', id)
        if (id === 'new') {
            //data validation
            let job_code = ''
            //send to api
        } else for (let i of data) {
            if (id === i.id) {
                //data validation
                //send to api
            }
        }
    }

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        //TO DO: Add ID or some sorting to split daily dollars from the rest
        console.log(row) //add events to the inputs for on unfocus or on change
        return (<tr>
            <td><input type='text' value={row.job_code} className='jobcode' id={`${row.id}-jobcode`} onBlur={(e) => handleTextInputChange(row.id)}></input></td>
            <td><input type='text' value={row.asset_id} className='asset_id' id={`${row.id}-assetid`} onBlur={(e) => handleTextInputChange(row.id)}></input></td>
            <td><input type='text' value={row.notes ? row.notes : ''} className='notes' id={`${row.id}-notes`} onBlur={(e) => handleTextInputChange(row.id)}></input></td>
        </tr>)
    }

    //returns blank page if data is loading
    if (loading) return <PageTemplate highLight='1' />
    else return (
        <>
            <input type='date' className='date' id='date_selector' value={getDate(date)} onChange={handleDateChange} />
            <table className='rows'>
                <tr>
                    <th>Job Code</th>
                    <th>Asset Tag</th>
                    <th>Comments</th>
                </tr>
                {data ? data.records.map(m => RenderRow(m)) : <></>}
                <tr>
                    <td>
                        <input type='text' className='jobcode' id={`new-jobcode`} onBlur={(e) => handleTextInputChange('new')}></input>

                    </td>
                    <td><input type='text' className='asset_id' id={`new-assetid`} onBlur={(e) => handleTextInputChange('new')}></input></td>
                    <td><input type='text' className='notes' id={`new-notes`} onBlur={(e) => handleTextInputChange('new')}></input></td>
                </tr>
            </table>
            <PageTemplate highLight='1' />
        </>
    )
}

export default AssetPage

/**
 * 
 * @param {Date} date 
 * @returns 
 */
function getDate(date) {
    date = new Date(date)
    return date.toISOString().split('T')[0]
}