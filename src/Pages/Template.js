import React from 'react'
import { useMsal } from "@azure/msal-react";
import CookieConsent from 'react-cookie-consent-notification';
import ParticlesElement from '../Components/Particles';
import '../css/Page-Template.css';

function PageTemplate(props) {
    const { instance, accounts } = useMsal()
    const permissions = props.permissions
    const isAdmin = props.isAdmin
    const accent = localStorage.getItem('accentColor') || '#00c6fc'

    const clickHandler = async () => {
        let search = document.getElementById('search').value
        if (!search) return
        if (props.setSearch) props.setSearch(search)
        props.history.push(`/search?q=${search}`)
    }

    const handleKeyDown = e => {
        if (e.key === 'Enter') clickHandler()
    }

    const LogoutHandler = async () => {
        instance.logoutPopup({
            postLogoutRedirectUri: "/",
            mainWindowRedirectUri: "/"
        })
        localStorage.setItem('isVerified', null)
    }

    return (
        <div className="App">
            <ParticlesElement {...props} color={accent} />
            <CookieConsent background={'#000'} color={'#fff'}>Like every other website, this site uses cookies :)</CookieConsent>
            <div className='SideBar'>
                <ul>
                    <li>
                        <p style={{ color: props.highLight === "0" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/')}>Home</p>
                    </li>
                    {isAdmin || (permissions && permissions.use_asset_tracker) ?
                        <li>
                            <p style={{ color: props.highLight === "1" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/asset')}>Asset Tracking</p>
                        </li> : <></>}
                    {isAdmin || (permissions && permissions.use_hourly_tracker) ?
                        <li>
                            <p style={{ color: props.highLight === "2" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/hourly')}>Hourly Tracking</p>
                        </li> : <></>}
                    {isAdmin || (permissions && permissions.use_repair_log) ?
                        <li>
                            <p style={{ color: props.highLight === "8" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/repair')}>Repair Tracking</p>
                        </li> : <></>}
                    {isAdmin || (permissions && permissions.view_reports) ?
                        <li>
                            <p style={{ color: props.highLight === "3" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/reports')}>Reports</p>
                        </li> : <></>}
                    {isAdmin || (permissions && permissions.view_part_inventory) ?
                        <li>
                            <p style={{ color: props.highLight === "9" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/inventory')}>Parts Inventory</p>
                        </li> : <></>}
                    {isAdmin || (permissions && permissions.view_assets) ?
                        <li>
                            <p style={{ color: props.highLight === "4" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/assets')}>Assets</p>
                        </li> : <></>}
                    {isAdmin || (permissions && permissions.view_models) ?
                        <li>
                            <p style={{ color: props.highLight === "5" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/models')}>Models</p>
                        </li> : <></>}
                    <li>
                        <p style={{ color: props.highLight === "6" ? accent : 'white' }} onClickCapture={(e) => props.history.push('/guide')}>Guide</p>
                    </li>
                    {isAdmin || (permissions && (permissions.use_importer || permissions.view_jobcodes || permissions.view_users)) ? < li >
                        <div className='dropDownHeader'>
                            <p style={{ color: props.highLight === "7" ? accent : 'white' }} onClickCapture={(e) => { }}>Tools</p>
                            <div className='dropdown-content'>
                                {isAdmin || (permissions && permissions.use_importer) ?
                                    <p style={{ '&:hover': { background: localStorage.getItem('accentColor') || '#003994' } }} onClickCapture={(e) => props.history.push('/importer')}>Importer</p> : <></>}
                                {isAdmin || (permissions && permissions.view_jobcodes) ?
                                    <p style={{ ':hover': { background: localStorage.getItem('accentColor') || '#003994' } }} onClickCapture={(e) => props.history.push('/jobs')}>Job Codes</p> : <></>}
                                {isAdmin || (permissions && permissions.view_users) ?
                                    <p style={{ ':hover': { background: localStorage.getItem('accentColor') || '#003994' } }} onClickCapture={(e) => props.history.push('/users')}>Users</p> : <></>}
                                {isAdmin || (permissions && permissions.view_jobcodes) ?
                                    <p style={{ ':hover': { background: localStorage.getItem('accentColor') || '#003994' } }} onClickCapture={(e) => props.history.push('/parts')}>Part Management</p> : <></>}
                                {isAdmin || (permissions && permissions.view_jobcodes) ?
                                    <p style={{ ':hover': { background: localStorage.getItem('accentColor') || '#003994' } }} onClickCapture={(e) => props.history.push('/parttypes')}>Part Types</p> : <></>}
                                {isAdmin ? <p style={{ ':hover': { background: localStorage.getItem('accentColor') || '#003994' } }} onClickCapture={(e) => props.history.push('/admin')}>Admin</p> : <></>}
                                {isAdmin ? <p style={{ ':hover': { background: localStorage.getItem('accentColor') || '#003994' } }} onClickCapture={(e) => props.history.push('/adas')}>Asset Info</p> : <></>}
                            </div>
                        </div>
                    </li> : <></>}
                </ul>
                <div className='AccountButton'>
                    <button style={{ backgroundColor: localStorage.getItem('accentColor') || '#003994' }}>{accounts[0] ? accounts[0].name : ''}</button>
                    <div className='AccountDropDown'>
                        <button style={{ backgroundColor: localStorage.getItem('accentColor') || '#003994' }} onClick={() => LogoutHandler()}>Logout</button>
                    </div>
                </div>
            </div>
            {
                props.disableSearch ? <></> :
                    <div className="searchBox">
                        <input className="searchInput" type="text" id='search' placeholder="Search" onKeyDown={handleKeyDown} />
                        <button className="searchButton" onClick={clickHandler}>
                            <i className="material-icons">search</i>
                        </button>
                    </div>
            }
        </div >
    )
}

export default PageTemplate