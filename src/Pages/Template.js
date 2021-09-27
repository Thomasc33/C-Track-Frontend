import React from 'react'
import { useMsal } from "@azure/msal-react";
import CookieConsent from 'react-cookie-consent-notification';
import ParticlesElement from '../Components/Particles'
import '../css/Page-Template.css';
import { InteractionRequiredAuthError } from '@azure/msal-common';

function PageTemplate(props) {
    const { instance, accounts } = useMsal()
    async function getTokenSilently() {
        if (!accounts[0]) return
        const SilentRequest = { scopes: ['User.Read'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true }
        await instance.acquireTokenSilent(SilentRequest)
            .catch(async er => {
                if (er instanceof InteractionRequiredAuthError) {
                    return await instance.acquireTokenPopup(SilentRequest)
                } else {
                    console.log('Unable to get token')
                }
            })
    }
    getTokenSilently()



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
                        <a className={props.highLight === "0" ? "active" : ""} href='/'>Home</a>
                    </li>
                    <li>
                        <a className={props.highLight === "1" ? "active" : ""} href='asset'>Asset Tracking</a>
                    </li>
                    <li>
                        <a className={props.highLight === "2" ? "active" : ""} href="hourly">Hourly Tracking</a>
                    </li>
                    <li>
                        <a className={props.highLight === "3" ? "active" : ""} href="reports">Reports</a>
                    </li>
                    <li>
                        <div className='dropDownHeader'>
                            <a className={props.highLight === "4" ? "active" : ""} href='tools'>Tools</a>
                            <div className='dropdown-content'>
                                <a href='importer'>Importer</a>
                                <a href='jobs'>Job Codes</a>
                                <a href='users'>Users</a>
                                <a href='admin'>Admin</a>
                            </div>
                        </div>
                    </li>
                </ul>
                <div className='AccountButton'>
                    <button>Thomas</button>
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