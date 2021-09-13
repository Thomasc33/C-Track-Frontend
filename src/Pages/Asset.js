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

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        //TO DO: Add ID or some sorting to split daily dollars from the rest
        console.log(row)
        return (<tr>
            <td><input type='text' value={row.job_code} className='jobcode'></input></td>
            <td><input type='text' value={row.asset_id} className='jobcode'></input></td>
            <td><input type='text' value={row.notes ? row.notes : ''} className='jobcode'></input></td>
        </tr>)
    }

    //returns blank page if data is loading
    if (loading) return <PageTemplate highLight='1' />
    else return (
        <>
            <input type='date' className='date' id='date_selector' value={getDate(date)} onChange={handleDateChange} />
            <form>
                <table className='rows'>
                    <tr>
                        <th>Job Code</th>
                        <th>Asset Tag</th>
                        <th>Comments</th>
                    </tr>
                    {data.records.map(m => RenderRow(m))}
                </table>
            </form>
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