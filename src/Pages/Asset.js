import React from 'react';
import PageTemplate from './Template'
import { useState, useEffect } from 'react';
import { useFetch } from '../Helpers/API';
import SelectSearch, { useSelect, fuzzySearch } from 'react-select-search';
import '../css/Asset.css'
import StringSim from 'string-similarity';
const settings = require('../settings.json')

function AssetPage() {
    //Get data, and update every 2 seconds
    let APILink = `${settings.APIBase}/asset/user/${/* Place holder for user id*/1}/`
    const [date, setDate] = useState(Date.now())
    const [jobCodes, setJobCodes] = useState(null);
    const [SelectedJobCodes, setSelectedJobCodes] = useState({})
    const { loading, data = [] } = useFetch(APILink.concat(getDate(date)), null)


    useEffect(() => {
        async function getJobCodes() {
            const response = await fetch(`${settings.APIBase}/job/all`, {
                mode: 'cors',
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });
            const data = await response.json();
            setJobCodes(data.job_codes)
        }
        getJobCodes()
    }, [])

    const handleDateChange = () => {
        setDate(document.getElementById('date_selector').value)
    }

    const handleTextInputChange = (id, e = null) => {
        if (id === 'new') {
            //get data
            let job_code = e
            let asset = document.getElementById('new-assetid')
            let notes = document.getElementById('new-notes')

            //data validation
            if (!job_code || isNaN(parseInt(e))) {
                document.getElementById('new-jobcode').getElementsByTagName('input')[0].classList.add('invalid')
                console.log('e')
                return
            }
            if (!asset) return

            //send to api
            console.log('sending to api')
        } else for (let i of data) {
            if (id === i.id) {
                //data validation
                //send to api
            }
        }
    }

    const getJobArray = () => {
        let ar = []
        for (let i of jobCodes) {
            //if (i.is_hourly) continue
            ar.push({ name: i.job_code, value: i.id })
        }
        console.log(ar)
        return ar
    }

    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        //TO DO: Add ID or some sorting to split daily dollars from the rest
        console.log(row) //add events to the inputs for on unfocus or on change
        return (<tr>
            <td>
                <SelectSearch
                    options={getJobArray()}
                    search
                    placeholder="Job Code"
                    value={row.job_code}
                    filterOptions={fuzzySearch}
                    className='job_list'
                    autoComplete='on'
                    onChange={e => handleTextInputChange('new', e)}
                    id={`${row.id}-jobcode`}
                />
            </td>
            <td><input type='text' value={row.asset_id} className='asset_id' id={`${row.id}-assetid`} onBlur={(e) => handleTextInputChange(row.id)}></input></td>
            <td><input type='text' value={row.notes ? row.notes : ''} className='notes' id={`${row.id}-notes`} onBlur={(e) => handleTextInputChange(row.id)}></input></td>
        </tr >)
    }



    //returns blank page if data is loading
    if (loading || !jobCodes) return <PageTemplate highLight='1' />
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
                        <SelectSearch
                            options={getJobArray()}
                            search
                            placeholder="Job Code"
                            filterOptions={fuzzySearch}
                            className='job_list'
                            autoComplete='on'
                            onChange={e => handleTextInputChange('new', e)}
                            id='new-jobcode'
                        />
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