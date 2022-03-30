import React from 'react';
import { Redirect } from 'react-router';
import PageTemplate from './Template'
import { useState, useEffect } from 'react';
import { useFetch } from '../Helpers/API';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import hourlyService from '../Services/Hourly'
import User from '../Services/User';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import TimeKeeper from 'react-timekeeper';
import { Button } from '@material-ui/core';
import { confirmAlert } from 'react-confirm-alert';
import '../css/Hourly.css';
const settings = require('../settings.json')

function HourlyPage(props) {
    const { instance, accounts } = useMsal()
    let APILink = props.location.state && props.location.state.isReport ? `${settings.APIBase}/reports/hourly/user/${props.location.state.uid}/` : `${settings.APIBase}/hourly/user/`
    const [date, setDate] = useState(props.location.state ? props.location.state.date || Date.now() : Date.now())
    const [jobCodes, setJobCodes] = useState(null);
    const [favorites, setFavorites] = useState([])
    const [indexedJobCodes, setIndexJobCodes] = useState({})
    const [newJobCode, setNewJobCode] = useState(0);
    const [newComment, setNewComment] = useState('');
    const { loading, data = [], setData } = useFetch(APILink.concat(getDate(date)), null)
    const [times, setTimes] = useState({})
    const [newestOnTop, setNewestOnTop] = useState(localStorage.getItem('newestOnTop') === 'true' || false)

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

    useEffect(() => {
        async function sort() {
            let jc = getJobCodes(true)
            let fav = getFavorites()

            let val = await Promise.all([jc, fav])
            let j = val[0], f = val[1].map(m => parseInt(m))

            // Sorry to anyone that ever has to read this :)
            // Basically, returns -1 if a is exclusively favorite, 0 if both a and b are favorites, and 1 if b is exclusively favorite
            j.sort((a, b) => { return f.includes(a.id) ? f.includes(b.id) ? 0 : -1 : f.includes(b.id) ? 1 : 0 })

            setJobCodes(j)
        }
        sort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (data && data.records) parseTime()
    }, [data])

    async function getFavorites() {
        let t = await getTokenSilently()
        const response = await fetch(`${settings.APIBase}/job/favorites/hrly`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${t}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        setFavorites(data.favorites)
        return data.favorites
    }

    async function getJobCodes(ignoreState = false) {
        let t = await getTokenSilently()
        const response = await fetch(`${settings.APIBase}/job/all/hrly`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${t}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        if (!ignoreState) setJobCodes(data.job_codes)
        let te = {}
        for (let i of data.job_codes) {
            te[i.id] = i.job_code
        }
        setIndexJobCodes(te)
        return data.job_codes
    }

    if (!props.permissions.use_hourly_tracker && !props.isAdmin) return <Redirect to='/' />

    const handleDateChange = () => {
        setDate(document.getElementById('date_selector').value)
    }

    const handleTextInputChange = async (id, e, target = false) => {
        if (target) {
            document.getElementById(`${id}-${target.split('-')[1] === 'start' ? 'Start' : 'End'}`)
        } else if (e && isNaN(parseInt(e))) { //checks to make sure e is real, not an int from select
            if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        } else { //remove invalid from new job code input
            if (document.getElementById('new-jobcode')) document.getElementById('new-jobcode').classList.remove('invalid')
        }
        if (id === 'new') {
            let dateString = new Date(date).toISOString().split('T')[0]
            let job_code = newJobCode;
            if (!isNaN(parseInt(e))) { setNewJobCode(parseInt(e)); job_code = parseInt(e) }
            let dateInfo = times.new
            let comment = newComment;
            if (e && e.target) switch (e.target.id) {
                case 'new-notes':
                    comment = e.target.value
                    await setNewComment(e.target.value)
                    break;
                default:
                    console.log('Default Case hit for new')
                    return
            }

            // ----------------
            // Data validation
            // ----------------

            // Check to see if date is added
            if (!dateInfo) {
                document.getElementById('new-Start').classList.add('invalid')
                document.getElementById('new-End').classList.add('invalid')
                return
            }
            if (!dateInfo.startTime) return document.getElementById('new-Start').classList.add('invalid')
            if (!dateInfo.endTime) return document.getElementById('new-End').classList.add('invalid')

            // Make sure the end date is after start date
            // Parses the date as a number for simple conversion for time savings. More in depth methods used below for getting actual times
            if (parseInt(dateInfo.startTime.replace(':', '')) > parseInt(dateInfo.endTime.replace(':', ''))) return document.getElementById('new-End').classList.add('invalid')


            let total_hours = getTotalHours(dateInfo.startTime, dateInfo.endTime)
            if (total_hours < 0) return document.getElementById('new-End').classList.add('invalid')

            // Return if no job code provided
            // This will be reached if date is done before job code
            if (!job_code) return document.getElementById('new-jobcode').getElementsByTagName('input')[0].classList.add('invalid')


            //send to api
            let formData = {
                date: dateString,
                job_code: job_code,
                startTime: dateInfo.startTime,
                endTime: dateInfo.endTime,
                total_hours,
                notes: comment,
                uid: props.location.state && props.location.state.uid || null
            }
            let token = await getTokenSilently()
            let res = await hourlyService.add(formData, token)
            if (res.isErrored) {
                alert('Failed to add hourly row')
            } else {
                const response = await fetch(APILink.concat(getDate(date)), {
                    mode: 'cors',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Access-Control-Allow-Origin': '*',
                        'X-Version': require('../backendVersion.json').version
                    }
                });
                const d = await response.json();
                document.getElementById('new-notes').value = ''
                setData(d);
                setNewComment('')
                let temp = { ...times }
                temp.new.startTime = temp.new.endTime
                temp.new.endTime = '17:00'
                setTimes(temp)
                document.getElementById('new-Start').classList.remove('invalid')
                document.getElementById('new-End').classList.remove('invalid')
            }
        } else for (let i of data.records) {
            // eslint-disable-next-line eqeqeq
            if (`${id}` === `${i.id}`) {
                let formData = {
                    id: i.id,
                    change: null,
                    value: null,
                    total_hours: null,
                    uid: props.location.state && props.location.state.uid || null
                }

                //find change
                if (target) {
                    formData.change = target.split('-')[1]
                    let dateInfo = times[id]
                    if (formData.change === 'start') formData.value = dateInfo.startTime
                    else formData.value = dateInfo.endTime
                    let total_hours = getTotalHours(dateInfo.startTime, dateInfo.endTime)
                    if (total_hours < 0) if (document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`)) return document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`).classList.add('invalid'); else return
                    formData.total_hours = total_hours
                } else {
                    if (!isNaN(parseInt(e))) {
                        formData.change = 'job'
                        formData.value = parseInt(e)
                    } else {
                        if (e.target.value !== i.notes) {
                            formData.change = 'notes'
                            formData.value = e.target.value
                        }
                    }
                }
                if (!formData.change) return console.log('exited on change because no formData.change')
                let token = await getTokenSilently()
                let res = await hourlyService.edit(formData, token)
                if (res.isErrored) {
                    if (target) {
                        if (document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`)) document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`).classList.add('invalid')
                    } else e.target.classList.add('invalid')
                }
            }
        }
    }

    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleTextInputChange(id, e)
    }

    const handleDelete = (id, e, row) => {
        let jc = 'unknown'
        for (let i of jobCodes) if (i.id === row.job_code) jc = i.job_name
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className='confirm-alert'>
                        <h1>Confirm the deletion</h1>
                        <br />
                        <h2>{row.start_time.substr(11, 5)} → {row.end_time.substr(11, 5)}</h2>
                        <h3>Job: {jc}</h3>
                        {row.notes ? <p>{row.notes}</p> : undefined}
                        <span style={{ margins: '1rem' }}>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: localStorage.getItem('accentColor') || '#00c6fc67', margin: '1rem' }} onClick={() => {
                                sendDelete(id, e)
                                onClose()
                            }}
                            >Confirm</Button>
                            <Button variant='contained' color='primary' size='large' style={{ backgroundColor: '#fc0349', margin: '1rem' }} onClick={() => {
                                onClose()
                            }}>Nevermind</Button>
                        </span>
                    </div>
                )
            }
        })
    }

    async function sendDelete(id, e) {
        let token = await getTokenSilently()
        let res = await hourlyService.delete(id, getDate(date), token, props.location.state && props.location.state.uid || null)
        const response = await fetch(APILink.concat(getDate(date)), {
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Access-Control-Allow-Origin': '*',
                'X-Version': require('../backendVersion.json').version
            }
        });
        const d = await response.json();
        setData(d);

        if (res.isErrored) {
            alert('Failed to delete. Try again or see Thomas if it continues to fail')
            console.log(res.error)
        }
        else {
            let row = document.getElementById(`${id}-row`)
            if (row) row.remove()
        }
    }

    const handleFavorite = async (job_code) => {
        let data = { type: 'hrly', isRemove: 0, job_id: `${job_code}` }
        if (favorites.includes(`${job_code}`)) data.isRemove = 1

        let token = await getTokenSilently()
        let q = await User.updateFavorites(data, token)
        if (q.isErrored) return alert('Failed to update favorites')

        getFavorites()
    }

    const getJobArray = () => {
        let ar = []
        for (let i of jobCodes) {
            if (!i.is_hourly) continue
            ar.push({ name: i.job_code, value: i.id })
        }
        return ar
    }

    const handleTimeSelectChange = async (id, isStart, e) => {
        let target = document.getElementById(`${id}-${isStart ? 'Start' : 'End'}`)
        if (target && target.classList && target.classList.contains('invalid')) target.classList.remove('invalid')
        let sendToAPI = false
        if (id === 'new')
            if (times.new) {
                //update 'new' time
                let temp = { ...times }
                if (isStart) temp.new.startTime = e.formatted24
                else temp.new.endTime = e.formatted24
                setTimes(temp)
            } else {
                //create 'new'
                let time = { startTime: null, endTime: null }
                if (isStart) time.startTime = e.formatted24
                else time.endTime = e.formatted24
                let temp = { ...times }
                temp['new'] = time
                setTimes(temp)
            }
        else {
            //update 'id' time
            let temp = { ...times }
            if (isStart) temp[`${id}`].startTime = e.formatted24
            else temp[`${id}`].endTime = e.formatted24
            setTimes(temp)
            sendToAPI = true
        }

        if (sendToAPI) {
            handleTextInputChange(id, null, `${id}-${isStart ? 'start' : 'end'}`)
        }
    }

    const parseTime = () => {
        let temp = { ...times }
        for (let row of data.records) {
            let time = { startTime: row.start_time.substr(11, 5), endTime: row.end_time.substr(11, 5) }
            temp[row.id] = time
        }
        if (!temp.new) temp.new = {}
        if (!temp.new.startTime) {
            if (data.records.length > Object.keys(times).length)
                temp.new.startTime = temp.new.startTime = data.records[data.records.length - 1].end_time.substr(11, 5) || '8:30'
            else temp.new.startTime = '8:30'
        }
        setTimes(temp)
        return < ></>
    }
    /**
     * Function to control rendering of data
     * 
     */
    function RenderRow(row) {
        return (<tr id={`${row.id}-row`} key={`${row.id}-row`} style={{ verticalAlign: 'top' }}>
            <td>
                <SelectSearch
                    options={getJobArray()}
                    search
                    placeholder="Job Code"
                    value={row.job_code}
                    filterOptions={fuzzySearch}
                    className='job_list'
                    autoComplete='on'
                    onChange={e => handleTextInputChange(row.id, e)}
                    menuPlacement='auto'
                    id={`${row.id}-jobcode`}
                    renderOption={(optionProps) => <button {...optionProps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="material-icons favorite-icon" onMouseDown={e => { e.stopPropagation(); e.preventDefault() }} onClick={e => handleFavorite(optionProps.value)}>{favorites.includes(`${optionProps.value}`) ? 'star' : 'star_border'}</i>
                        {indexedJobCodes[optionProps.value]}
                    </button>} />
            </td>
            <td><div className="TimeKeeper Minimized-Time" id={`${row.id}-Start`} >.
                <TimeKeeper
                    coarseMinutes='15'
                    time={row.start_time.substr(11, 5)}
                    css={{ color: localStorage.getItem('accentColor') || '#00c6fc' }}
                    forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                    onChange={e => handleTimeSelectChange(`${row.id}`, true, e)}
                /></div></td>
            <td><div className="TimeKeeper Minimized-Time" id={`${row.id}-End`} >.
                <TimeKeeper
                    coarseMinutes='15'
                    time={row.end_time.substr(11, 5)}
                    forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                    onChange={e => handleTimeSelectChange(`${row.id}`, false, e)}
                /></div></td>
            <td style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <input type='text'
                    defaultValue={row.notes ? row.notes : ''}
                    className='notes'
                    placeholder='Notes / Comments'
                    id={`${row.id}-notes`}
                    style={{ width: '79%', marginRight: '1rem' }}
                    onBlur={e => handleTextInputChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
                <i className="material-icons delete-icon" onClickCapture={e => handleDelete(row.id, e, row)}>
                    delete_outline</i>
            </td>
        </tr >)
    }

    //returns blank page if data is loading
    if (loading || !data || !jobCodes) return <PageTemplate highLight='2' {...props} />
    else return (
        <>
            {data.records.length > Object.keys(times).length ? parseTime() : <></>}
            <div style={{ position: 'absolute', top: '2%', left: '14%', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(removeDay(date)) }}>navigate_before</i>
                <input type='date' className='date' id='date_selector' value={getDate(date)} onChange={handleDateChange} />
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(addDay(date)) }}>navigate_next</i>
            </div>

            <div style={{ position: 'absolute', top: '4%', right: '4%', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { localStorage.setItem('newestOnTop', !newestOnTop); setNewestOnTop(!newestOnTop) }}>sort</i>
            </div>

            <div className='AssetArea' style={{ overflowX: 'scroll' }}>
                <table className='rows'>
                    <thead>
                        <tr>
                            <th>Job Code</th>
                            <th className='TimeColumn'>Start Time</th>
                            <th className='TimeColumn'>End Time</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newestOnTop ? undefined : data.records ? data.records.map(m => RenderRow(m)) : undefined}
                        <tr style={{ verticalAlign: 'top' }}>
                            <td>
                                <SelectSearch
                                    options={getJobArray()}
                                    search
                                    placeholder="Job Code"
                                    filterOptions={fuzzySearch}
                                    className='job_list'
                                    autoComplete='on'
                                    onChange={e => handleTextInputChange('new', e)}
                                    menuPlacement='auto'
                                    id={`new-jobcode`}
                                    renderOption={(optionProps) => <button {...optionProps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="material-icons favorite-icon" onMouseDown={e => { e.stopPropagation(); e.preventDefault() }} onClick={e => handleFavorite(optionProps.value)}>{favorites.includes(`${optionProps.value}`) ? 'star' : 'star_border'}</i>
                                        {indexedJobCodes[optionProps.value]}
                                    </button>} />
                            </td>
                            <td><div className="TimeKeeper" id='new-Start'>.
                                <TimeKeeper
                                    time={times.new && times.new.startTime ? times.new.startTime : '8:30'}
                                    coarseMinutes='15'
                                    forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                                    onChange={e => handleTimeSelectChange('new', true, e)}
                                    doneButton={(newTime) => (
                                        <div style={{ textAlign: 'center', padding: '8px 0', backgroundColor: '#141414a6', borderBottomLeftRadius: '.5rem', borderBottomRightRadius: '.5rem', boxShadow: '0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)' }} onClickCapture={e => handleTextInputChange('new', null, 'new-start')}>
                                            <i className="material-icons">done</i>
                                        </div>
                                    )}
                                /></div></td>
                            <td><div className="TimeKeeper" id='new-End'>.
                                <TimeKeeper
                                    time={times.new && times.new.endTime ? times.new.endTime : '17:00'}
                                    coarseMinutes='15'
                                    forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                                    onChange={e => handleTimeSelectChange('new', false, e)}
                                    doneButton={(newTime) => (
                                        <div style={{ textAlign: 'center', padding: '8px 0', backgroundColor: '#141414a6', borderBottomLeftRadius: '.5rem', borderBottomRightRadius: '.5rem', boxShadow: '0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)' }} onClickCapture={e => handleTextInputChange('new', null, 'new-start')}>
                                            <i className="material-icons">done</i>
                                        </div>
                                    )}
                                /></div></td>
                            <td><input type='text' className='notes' id={`new-notes`} placeholder='Notes / Comments' onBlur={(e) => handleTextInputChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                        </tr>
                        {newestOnTop ? data.records ? data.records.slice(0).reverse().map(m => RenderRow(m)) : undefined : undefined}
                    </tbody>
                </table>
            </div>
            <PageTemplate highLight='2' {...props} />
        </>
    )
}

export default HourlyPage

/**
 * 
 * @param {Date} date 
 * @returns 
 */
function getDate(date) {
    date = new Date(date)
    return date.toISOString().split('T')[0]
}

/**
 * 
 * @param {String} startTime 
 * @param {String} endTime 
 */
function getTotalHours(startTime, endTime) {
    // Get total hours from start and end date
    // Split the times into hours and minutes
    let total_hours = 0
    let startHour, endHour, startMinute, endMinute
    let t = startTime.split(':')
    startHour = parseInt(t[0])
    startMinute = parseInt(t[1])
    t = endTime.split(':')
    endHour = parseInt(t[0])
    endMinute = parseInt(t[1])

    // end - start
    // if start minute > end minute, carry over 60 from the hour and subtract
    if (startMinute > endMinute) {
        endMinute += 60;
        endHour--;
    }
    // Add the hours to total
    total_hours += endHour - startHour;

    // End minutes - start minutes
    t = endMinute - startMinute;
    /*
    Say 45min - 30min
    15 min needs to go to .25
    Divide by 15 to get the 15 minute intervals, and multiply by .25 to get the fraction
    */
    t = Math.round(t / 15) * .25
    //add that to total hours
    total_hours += t;
    return total_hours
}

function addDay(date) {
    date = new Date(date)
    date.setTime(date.getTime() + 86400000)
    return date.toISOString().split('T')[0]
}

function removeDay(date) {
    date = new Date(date)
    date.setTime(date.getTime() - 86400000)
    return date.toISOString().split('T')[0]
}