// Imports
import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useFetch } from '../Helpers/API';
import { useMSAL } from '../Helpers/MSAL';
import { Button } from '@material-ui/core';
import { confirmAlert } from 'react-confirm-alert';
import hourlyService from '../Services/Hourly'
import User from '../Services/User';
import TimeKeeper from 'react-timekeeper';
import Checkbox from 'react-custom-checkbox';
import * as Icon from 'react-icons/fi';

// Global Constants
const settings = require('../settings.json')
const normalTimeRange = [6, 19] // Gives warnings when going before 6AM or after 7PM

function HourlyPage(props) {
    // Hooks and Constants
    const location = useLocation()
    const { token, tokenLoading } = useMSAL()
    const APILink = location.state && location.state.isReport ? `${settings.APIBase}/reports/hourly/user?uid=${location.state.uid}&date=` : `${settings.APIBase}/hourly/user?date=`


    // States
    const [date, setDate] = useState(location.state ? location.state.date || Date.now() : Date.now())
    const [newestOnTop, setNewestOnTop] = useState(localStorage.getItem('newestOnTop') === 'true' || false)
    const [fancyClock, setFancyClock] = useState(localStorage.getItem('fancyClock') === 'true' || false)
    const [jobCodes, setJobCodes] = useState(null);
    const [favorites, setFavorites] = useState([])
    const [indexedJobCodes, setIndexJobCodes] = useState({})
    const [times, setTimes] = useState({})
    const [newRecord, setNewRecord] = useState({ newJobCode: 0, newComment: '' })


    // --- Effects --- //
    // useEffect and Fetch Wrapper
    const { loading, data = [], setData } = useFetch(APILink.concat(getDate(date)), null)

    useEffect(() => { // Gets and sorts job codes
        async function sort() {
            let jc = getJobCodes(true)
            let fav = getFavorites()

            let val = await Promise.all([jc, fav])
            let j = val[0], f = val[1].map(m => parseInt(m))

            // Basically, returns -1 if a is exclusively favorite, 0 if both a and b are favorites, and 1 if b is exclusively favorite
            j.sort((a, b) => { return f.includes(a.id) ? f.includes(b.id) ? 0 : -1 : f.includes(b.id) ? 1 : 0 })

            setJobCodes(j)
        }
        if (token) sort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    useEffect(() => { // Calls parseTime every time the data changes
        if (data && data.records) parseTime()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    // Returns to home page if user can't use route
    if (!props.permissions.use_hourly_tracker && !props.isAdmin) return <Navigate to='/' />

    // --- Functions --- //
    async function updateData() {
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
    }

    async function getFavorites() {
        const response = await fetch(`${settings.APIBase}/job/favorites?type=hrly`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token}`,
                'X-Version': require('../backendVersion.json').version
            }
        });
        const data = await response.json();
        setFavorites(data.favorites)
        return data.favorites
    }

    async function getJobCodes(ignoreState = false) {
        const response = await fetch(`${settings.APIBase}/job/all/type?type=hrly`, {
            mode: 'cors',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Authorization': `Bearer ${token}`,
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

    const handleDateChange = () => {
        setDate(document.getElementById('date_selector').value)
    }

    // Handles the changing of any data on the page (new or old)
    const handleChange = async (id, e, target = false, value = undefined, sendToAPI = true) => {
        if (e && isNaN(parseInt(e))) { //checks to make sure e is real, not an int from select
            if (e.target.classList.contains('invalid')) e.target.classList.remove('invalid')
        } else { //remove invalid from new job code input
            if (document.getElementById('new-jobcode')) document.getElementById('new-jobcode').classList.remove('invalid')
        }
        if (id === 'new') {
            let dateString = new Date(date).toISOString().split('T')[0]
            let job_code = newRecord.newJobCode;
            if (!isNaN(parseInt(e))) { setNewRecord({ ...newRecord, newJobCode: parseInt(e) }); job_code = parseInt(e) }
            let dateInfo = times.new
            let comment = newRecord.newComment;
            if (e && e.target) switch (e.target.id) {
                case 'new-notes':
                    comment = e.target.value
                    setNewRecord({ ...newRecord, newComment: comment })
                    break;
                default:
                    console.log('Default Case hit for new')
                    return
            }

            if (!sendToAPI) return

            // ----------------
            // Data validation
            // ----------------

            if (dateInfo.in_progress || value) dateInfo.endTime = getClosestTime()

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
            if (parseInt(dateInfo.startTime.replace(':', '')) >= parseInt(dateInfo.endTime.replace(':', ''))) {
                if (!dateInfo.in_progress) return alert('End Time Must be Later Than Start Time')
                dateInfo.endTime = addHourToTime(dateInfo.startTime)
            }

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
                uid: (location.state && location.state.uid) || null,
                in_progress: dateInfo.in_progress || value
            }

            let res = await hourlyService.add(formData, token)
            if (res.isErrored) {
                alert('Failed to add hourly row')
            } else {
                updateData()
                document.getElementById('new-notes').value = ''
                setNewRecord({ newJobCode: newRecord.newJobCode, newComment: '' })
                let temp = { ...times }
                temp.new.startTime = temp.new.endTime
                temp.new.endTime = '17:00'
                temp.new.in_progress = false
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
                    uid: (location.state && location.state.uid) || null
                }

                //find change
                if (target) {
                    if (target === 'inProgress') {
                        formData.change = 'in_progress'
                        formData.value = times[id].in_progress ? '1' : '0'
                    } else {
                        formData.change = target.split('-')[1]
                        let dateInfo = times[id]
                        if (formData.change === 'start') formData.value = dateInfo.startTime
                        else formData.value = dateInfo.endTime
                        let total_hours = getTotalHours(dateInfo.startTime, dateInfo.endTime)
                        if (total_hours < 0) if (document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`)) return document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`).classList.add('invalid'); else return
                        formData.total_hours = total_hours
                    }
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
                let res = await hourlyService.edit(formData, token)
                if (res.isErrored) {
                    if (target) {
                        if (document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`)) document.getElementById(`${id}-${formData.change === 'start' ? 'Start' : 'End'}`).classList.add('invalid')
                    } else e.target.classList.add('invalid')
                }
                updateData()
            }
        }
    }

    // Glorified enter listerner
    const handleKeyDown = async (id, e) => {
        if (e.key === 'Enter') handleChange(id, e)
    }

    // Handles the prompt for confirming deletion
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

    // Sends the delete request to the api
    async function sendDelete(id, e) {
        let res = await hourlyService.delete(id, getDate(date), token, (location.state && location.state.uid) || null)
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
    }

    // Handles adding and removing favorite hourly job codes
    const handleFavorite = async (job_code) => {
        let data = { type: 'hrly', isRemove: 0, job_id: `${job_code}` }
        if (favorites.includes(`${job_code}`)) data.isRemove = 1
        let q = await User.updateFavorites(data, token)
        if (q.isErrored) return alert('Failed to update favorites')
        getFavorites()
    }

    // Converts job array to {name, value} object array for use in react-select-search
    const getJobArray = () => {
        let ar = []
        for (let i of jobCodes) {
            if (!i.is_hourly) continue
            ar.push({ name: i.job_code, value: i.id })
        }
        return ar
    }

    // Handles the changing of the react-timekeeper element
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
            handleChange(id, null, `${id}-${isStart ? 'start' : 'end'}`)
        }
    }

    // Handles the changing of the boring time select element
    const handleBoringTimeSelectChange = async (id, isStart, e) => {
        if (e.target.value === '') return
        if (!['00', '15', '30', '45'].includes(e.target.value.substr(3))) {
            let t = e.target.value.split(':')
            if (!(0 < +t[1] && +t[1] < 5)) t[1] = Math.round(+t[1] / 15) * 15
            if (!t[1]) t[1] = '00'
            e.target.value = t.join(':')
        }
        let target = document.getElementById(`${id}-${isStart ? 'Start' : 'End'}`)
        if (target && target.classList && target.classList.contains('invalid')) target.classList.remove('invalid')
        let sendToAPI = false
        if (id === 'new')
            if (times.new) {
                //update 'new' time
                let temp = { ...times }
                if (isStart) temp.new.startTime = e.target.value
                else temp.new.endTime = e.target.value
                setTimes(temp)
            } else {
                //create 'new'
                let time = { startTime: null, endTime: null }
                if (isStart) time.startTime = e.target.value
                else time.endTime = e.target.value
                let temp = { ...times }
                temp['new'] = time
                setTimes(temp)
            }
        else {
            //update 'id' time
            let temp = { ...times }
            if (isStart) temp[`${id}`].startTime = e.target.value
            else temp[`${id}`].endTime = e.target.value
            setTimes(temp)
            if (['00', '15', '30', '45'].includes(e.target.value.substr(3))) sendToAPI = true
        }

        if (sendToAPI) {
            handleChange(id, null, `${id}-${isStart ? 'start' : 'end'}`)
        }
    }

    // Called every time data is updated. Converts the start and end time to usable data for react-timekeeper
    const parseTime = () => {
        let temp = { ...times }
        for (let row of data.records) {
            let time = { startTime: row.start_time.substr(11, 5), endTime: row.end_time.substr(11, 5) }
            temp[row.id] = time
        }
        if (!temp.new) temp.new = {}
        if (!temp.new.startTime) {
            if (data.records.length > Object.keys(times).length)
                temp.new.startTime = temp.new.startTime = data.records[data.records.length - 1].end_time.substr(11, 5) || '08:30'
            else temp.new.startTime = '08:30'
            temp.new.endTime = '17:00'
        }
        setTimes(temp)
        return < ></>
    }

    // Handles the change of the current check box
    const handleCurrentChange = async (id, e) => {
        if (id === 'new') {
            let temp = { ...times }
            if (!temp.new) temp.new = {}
            temp.new.in_progress = e
            if (!temp.new.startTime) temp.new.startTime = '08:30'
            if (!temp.new.endTime) temp.new.endTime = addHourToTime(temp.new.startTime)
            setTimes(temp)
            handleChange('new', null)
        } else {
            let temp = { ...times }
            temp[`${id}`].in_progress = e
            setTimes(temp)
            handleChange(id, null, 'inProgress', e)
        }
    }

    // --- Renderers --- //
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
                    onChange={e => handleChange(row.id, e)}
                    menuPlacement='auto'
                    id={`${row.id}-jobcode`}
                    renderOption={(optionProps) => <button {...optionProps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="material-icons favorite-icon" onMouseDown={e => { e.stopPropagation(); e.preventDefault() }} onClick={e => handleFavorite(optionProps.value)}>{favorites.includes(`${optionProps.value}`) ? 'star' : 'star_border'}</i>
                        {indexedJobCodes[optionProps.value]}
                    </button>} />
            </td>
            <td><div className={fancyClock ? "TimeKeeper Minimized-Time" : "TimeKeeper"} id={`${row.id}-Start`}
                style={{ border: (parseInt(row.start_time.split('T')[1].substr(0, 2)) < normalTimeRange[0] || parseInt(row.start_time.split('T')[1].substr(0, 2)) > normalTimeRange[1] || row.hours >= 10) ? 'solid 3px #b8680d' : undefined, paddingBottom: '10px' }}>
                {fancyClock ?
                    <TimeKeeper
                        coarseMinutes='15'
                        time={row.start_time.substr(11, 5)}
                        css={{ color: localStorage.getItem('accentColor') || '#00c6fc' }}
                        forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                        onChange={e => handleTimeSelectChange(`${row.id}`, true, e)}
                    /> :
                    <input type='time' step='900' min='05:00' max='20:00' value={row.start_time.substr(11, 5)} onChange={e => handleBoringTimeSelectChange(`${row.id}`, true, e)} />
                }</div></td>
            <td><div className={fancyClock ? "TimeKeeper Minimized-Time" : "TimeKeeper"} id={`${row.id}-End`}
                style={{ border: (parseInt(row.end_time.split('T')[1].substr(0, 2)) < normalTimeRange[0] || parseInt(row.end_time.split('T')[1].substr(0, 2)) > normalTimeRange[1] || row.hours >= 10) ? 'solid 3px #b8680d' : undefined, paddingBottom: '10px' }}>
                {row.in_progress ? undefined :
                    fancyClock ?
                        <TimeKeeper
                            coarseMinutes='15'
                            time={row.end_time.substr(11, 5)}
                            forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                            onChange={e => handleTimeSelectChange(`${row.id}`, false, e)}
                        /> :
                        <input type='time' step='900' min='05:00' max='20:00' defaultValue={row.end_time.substr(11, 5)} onChange={e => handleBoringTimeSelectChange(`${row.id}`, false, e)} />
                }</div></td>
            <td>
                <Checkbox
                    id={`${row.id}-inProgress`}
                    className='inProgress'
                    checked={row.in_progress}
                    borderWidth='5px'
                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                    style={{ cursor: 'pointer' }}
                    size='30px'
                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={36} />}
                    onChange={e => handleCurrentChange(row.id, e)} />
            </td>
            <td style={{ display: 'inline-flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
                <input type='text'
                    defaultValue={row.notes ? row.notes : ''}
                    className='notes'
                    placeholder='Notes / Comments'
                    id={`${row.id}-notes`}
                    style={{ width: '79%', marginRight: '1rem' }}
                    onBlur={e => handleChange(row.id, e)}
                    onKeyDown={e => handleKeyDown(row.id, e)} />
                <i className="material-icons delete-icon" onClickCapture={e => handleDelete(row.id, e, row)}>delete_outline</i>
            </td>
        </tr >)
    }

    // Returns blank page if data is loading
    if (loading || tokenLoading || !data || !jobCodes) return <></>
    else return (
        <>
            {data.records.length > Object.keys(times).length ? parseTime() : <></>}
            <div style={{ position: 'absolute', top: '8vh', left: '13vw', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(removeDay(date)) }}>navigate_before</i>
                <input type='date' className='date' id='date_selector' value={getDate(date)} onChange={handleDateChange} />
                <i className='material-icons DateArrows' onClickCapture={() => { setDate(addDay(date)) }}>navigate_next</i>
            </div>

            <div style={{ position: 'absolute', top: '8vh', right: '4vw', display: 'inline-flex', alignItems: 'center' }}>
                <i className='material-icons DateArrows' style={{ padding: '1rem' }} onClickCapture={() => { localStorage.setItem('fancyClock', !fancyClock); setFancyClock(!fancyClock) }}>schedule</i>
                <i className='material-icons DateArrows' onClickCapture={() => { localStorage.setItem('newestOnTop', !newestOnTop); setNewestOnTop(!newestOnTop) }}>sort</i>
            </div>

            {location.state && location.state.isReport ?
                <div style={{ position: 'absolute', top: '2vh', width: '100vw', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p>Viewing {location.state.name}'s hourly tracking</p>
                </div>
                : undefined
            }

            <div className='AssetArea' style={{ overflowX: 'scroll', top: '15vh', height: '85vh' }} >
                <table className='rows'>
                    <thead>
                        <tr>
                            <th>Job Code</th>
                            <th className='TimeColumn'>Start Time</th>
                            <th className='TimeColumn'>End Time</th>
                            <th style={{ width: '7%' }}>Current</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newestOnTop ? undefined : data.records ? data.records.map(m => RenderRow(m)) : undefined}
                        <tr style={{ verticalAlign: 'top' }}>
                            <td>
                                <SelectSearch
                                    options={getJobArray()}
                                    value={newRecord.newJobCode || null}
                                    search
                                    placeholder="Job Code"
                                    filterOptions={fuzzySearch}
                                    className='job_list'
                                    autoComplete='on'
                                    onChange={e => handleChange('new', e, undefined, undefined, false)}
                                    menuPlacement='auto'
                                    id={`new-jobcode`}
                                    renderOption={(optionProps) => <button {...optionProps} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="material-icons favorite-icon" onMouseDown={e => { e.stopPropagation(); e.preventDefault() }} onClick={e => handleFavorite(optionProps.value)}>{favorites.includes(`${optionProps.value}`) ? 'star' : 'star_border'}</i>
                                        {indexedJobCodes[optionProps.value]}
                                    </button>} />
                            </td>
                            <td><div className="TimeKeeper" id='new-Start'
                                style={{ border: times.new && times.new.startTime && (parseInt(times.new.startTime.substr(0, 2).replace(':', '')) < normalTimeRange[0] || parseInt(times.new.startTime.substr(0, 2).replace(':', '')) > normalTimeRange[1] || (times.new.endTime && getTotalHours(times.new.startTime, times.new.endTime) >= 10)) ? 'solid 1px #b8680d' : undefined, paddingBottom: '10px' }}>
                                {fancyClock ? <TimeKeeper
                                    time={times.new && times.new.startTime ? times.new.startTime : '08:30'}
                                    coarseMinutes='15'
                                    forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                                    onChange={e => handleTimeSelectChange('new', true, e)}
                                    doneButton={(newTime) => (
                                        <div style={{ textAlign: 'center', padding: '8px 0', backgroundColor: '#141414a6', borderBottomLeftRadius: '.5rem', borderBottomRightRadius: '.5rem', boxShadow: '0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)' }} onClickCapture={e => handleChange('new', null, 'new-start')}>
                                            <i className="material-icons">done</i>
                                        </div>
                                    )}
                                /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className='material-icons' style={{ cursor: 'pointer', fontSize: '2rem', paddingRight: '.5rem' }} onClick={e => { handleChange('new', null, 'new-start') }}>done</i>
                                    <input type='time' step='900' min='05:00' max='20:00' defaultValue={times.new.startTime} onChange={e => handleBoringTimeSelectChange('new', true, e)} />
                                </div>

                                }
                            </div></td>
                            <td><div className="TimeKeeper" id='new-End'
                                style={{ border: times.new && times.new.endTime && (parseInt(times.new.endTime.substr(0, 2).replace(':', '')) < normalTimeRange[0] || parseInt(times.new.endTime.substr(0, 2).replace(':', '')) > normalTimeRange[1] || (times.new.startTime && getTotalHours(times.new.startTime, times.new.endTime) >= 10)) ? 'solid 1px #b8680d' : undefined, paddingBottom: '10px' }}>
                                {times.new && times.new && times.new.in_progress ? undefined :
                                    fancyClock ?
                                        <TimeKeeper
                                            time={times.new && times.new.endTime ? times.new.endTime : '17:00'}
                                            coarseMinutes='15'
                                            forceCoarseMinutes closeOnMinuteSelect switchToMinuteOnHourDropdownSelect switchToMinuteOnHourSelect
                                            onChange={e => handleTimeSelectChange('new', false, e)}
                                            doneButton={(newTime) => (
                                                <div style={{ textAlign: 'center', padding: '8px 0', backgroundColor: '#141414a6', borderBottomLeftRadius: '.5rem', borderBottomRightRadius: '.5rem', boxShadow: '0 0 25px rgba(0, 0, 0, .1), 0 5px 10px -3px rgba(0, 0, 0, .13)' }} onClickCapture={e => handleChange('new', null, 'new-start')}>
                                                    <i className="material-icons">done</i>
                                                </div>
                                            )}
                                        /> :
                                        <input type='time' step='900' min='05:00' max='20:00' value={times.new.endTime} onChange={e => handleBoringTimeSelectChange('new', false, e)} />
                                }</div></td>
                            <td>
                                <Checkbox
                                    id={`new-inProgress`}
                                    className='inProgress'
                                    borderWidth='5px'
                                    borderColor={localStorage.getItem('accentColor') || '#00c6fc'}
                                    style={{ cursor: 'pointer' }}
                                    size='30px'
                                    checked={times.new && times.new.in_progress}
                                    icon={<Icon.FiCheck color={localStorage.getItem('accentColor') || '#00c6fc'} size={36} />}
                                    onChange={e => handleCurrentChange('new', e)} />
                            </td>
                            <td><input type='text' className='notes' id={`new-notes`} placeholder='Notes / Comments' onBlur={(e) => handleChange('new', e)} onKeyDown={e => handleKeyDown('new', e)}></input></td>
                        </tr>
                        {newestOnTop ? data.records ? data.records.slice(0).reverse().map(m => RenderRow(m)) : undefined : undefined}
                    </tbody>
                </table>
            </div>
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

function getClosestTime() {
    let now = new Date()
    let mod = now.getMinutes() % 15
    if (mod === 0) return `${now.getHours()}:${now.getMinutes()}`
    if (mod >= 7) if (now.getMinutes() > 45) return `${now.getHours() + 1}:00`
    if (mod < 7) return `${now.getHours() + 1}:${now.getMinutes() - mod}`
}

function addHourToTime(time) {
    let t = time.split(':')
    if (t.length !== 2) { console.log(`Received Invalid Time in addHourToTime: ${time}`) }
    return `${parseInt(t[0]) + 1}:${t[1]}`
}