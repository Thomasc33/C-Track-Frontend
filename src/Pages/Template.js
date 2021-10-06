import React from 'react'
import { useMsal } from "@azure/msal-react";
import CookieConsent from 'react-cookie-consent-notification';
import ParticlesElement from '../Components/Particles'
import '../css/Page-Template.css';

function PageTemplate(props) {
    const { instance, accounts } = useMsal()
    const permissions = props.permissions
    const isAdmin = props.isAdmin

    const clickHandler = async () => {
        let search = document.getElementById('search')
        if (!search) return
        console.log('searched for:', search)
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
            <ParticlesElement />
            <CookieConsent background={'#000'} color={'#fff'}>Like every other website, this site uses cookies :)</CookieConsent>
            <div className='SideBar'>
                <ul>
                    <li>
                        <p className={props.highLight === "0" ? "active" : ""} onClickCapture={(e) => props.history.push('/')}>Home</p>
                    </li>
                    <li>
                        <p className={props.highLight === "1" ? "active" : ""} onClickCapture={(e) => props.history.push('/asset')}>Asset Tracking</p>
                    </li>
                    <li>
                        <p className={props.highLight === "2" ? "active" : ""} onClickCapture={(e) => props.history.push('/hourly')}>Hourly Tracking</p>
                    </li>
                    {isAdmin || (permissions && permissions.view_reports) ?
                        <li>
                            <p className={props.highLight === "3" ? "active" : ""} onClickCapture={(e) => props.history.push('/reports')}>Reports</p>
                        </li> : <></>}
                    <li>
                        <p className={props.highLight === "4" ? "active" : ""} onClickCapture={(e) => props.history.push('/assets')}>Assets</p>
                    </li>
                    <li>
                        <p className={props.highLight === "5" ? "active" : ""} onClickCapture={(e) => props.history.push('/models')}>Models</p>
                    </li>
                    <li>
                        <div className='dropDownHeader'>
                            <p className={props.highLight === "7" ? "active" : ""} onClickCapture={(e) => props.history.push('/tools')}>Tools</p>
                            <div className='dropdown-content'>
                                <p onClickCapture={(e) => props.history.push('/importer')}>Importer</p>
                                {isAdmin || (permissions && permissions.view_jobcodes) ?
                                    <p onClickCapture={(e) => props.history.push('/jobs')}>Job Codes</p> : <></>}
                                {isAdmin || (permissions && permissions.view_user) ?
                                    <p onClickCapture={(e) => props.history.push('/users')}>Users</p> : <></>}
                                <p onClickCapture={(e) => props.history.push('/admin')}>Admin</p>
                            </div>
                        </div>
                    </li>
                </ul>
                <div className='AccountButton'>
                    <button>{accounts[0] ? accounts[0].name : ''}</button>
                    <div className='AccountDropDown'>
                        <button onClick={() => LogoutHandler()}>Logout</button>
                    </div>
                </div>
            </div>
            {props.disableSearch ? <></> :
                <div className="searchBox">
                    <input className="searchInput" type="text" id='search' placeholder="Search" onKeyDown={handleKeyDown} />
                    <button className="searchButton" onClick={clickHandler}>
                        <i className="material-icons">search</i>
                    </button>
                </div>
            }
        </div>
    )
}

export default PageTemplate