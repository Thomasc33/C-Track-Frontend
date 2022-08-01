/* eslint-disable no-unused-vars */
import React from 'react';
import { loginRequest } from "../authConfig";
import { useMsal } from '@azure/msal-react';
import ParticlesElement from '../Components/Particles'
import CookieConsent from 'react-cookie-consent-notification';
import '../css/Login.css'

function LoginPage(props) {
    // Hook
    const { instance } = useMsal()

    // Login Handler
    const handleLogin = () => {
        instance.loginPopup(loginRequest).catch(e => {
            console.log(e);
        });
    }

    // Render
    return (
        <div className="App">
            <ParticlesElement color={localStorage.getItem('accentColor') || '#00c6fc'} />
            <CookieConsent background={'#000'} color={'#fff'}>Like every other website, this site uses cookies :)</CookieConsent>
            <div className='login'>
                <img src='https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWEJ0w?ver=a65e' alt='microsoft logo' />
                <button onClick={() => handleLogin()}>Login with Microsoft</button>
                <br />
                <br />
                <br />
            </div>
        </div>
    )
}

export default LoginPage