/* eslint-disable no-unused-vars */
import React from 'react';
import ParticlesElement from '../Components/Particles'
import CookieConsent from 'react-cookie-consent-notification';
import { loginRequest } from "../authConfig";
import { useMsal } from '@azure/msal-react';
import '../css/Login.css'

function LoginPage(props) {
    const { instance } = useMsal()

    const handleLogin = () => {
        instance.loginPopup(loginRequest).catch(e => {
            console.log(e);
        });
    }

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