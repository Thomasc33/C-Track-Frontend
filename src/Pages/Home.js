import React from 'react';
import PageTemplate from './Template'
import { useFetch } from '../Helpers/API'
import '../css/Home.css'
const settings = require('../settings.json')

function HomePage() {
    //Get data, and update every 2 seconds
    let APILink = `${settings.APIBase}/home/user`
    const { loading, data = [] } = useFetch(APILink, 30000)

    /**
     * Function to control rendering of data
     * 
     */
    function renderStatsData(i, v) {
        if (i === 'Daily Dollars') return <div className='stat'>
            <h2 className='name'>{i}</h2>
            <h2 className='value'>{`$${v}`}</h2>
            <br></br>
            <br></br>
            <br></br>
        </div>
        //TO DO: Add ID or some sorting to split daily dollars from the rest
        return <div className="stat">
            <h2 className='name'>{i}</h2>
            <h2 className='value'>{(typeof (v) == 'object') ? v.is_hourly ? v.count == '1' ? `${v.count} hour` : `${v.count} hours` : `${v.count}` : v}</h2>
            <br></br>
        </div>
    }

    //returns blank page if data is loading
    if (loading) return <PageTemplate highLight='0' />

    else return (
        <>
            <div className='HomeData'>
                <div className='ToDoArea'>
                    <h1>To Do</h1>
                    <h2>TBI</h2>
                </div>
                <div className='StatsArea'>
                    <h1>Daily Statistics</h1>
                    {Object.keys(data).map(m => renderStatsData(m, data[m]))}
                </div>
            </div>
            <PageTemplate highLight='0' />
        </>
    )
}

export default HomePage