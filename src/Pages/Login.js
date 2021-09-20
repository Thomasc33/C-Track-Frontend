/* eslint-disable no-unused-vars */
import React from 'react';
import ParticlesElement from '../Components/Particles'
import { loginRequest } from "../authConfig";
import { useMsal } from '@azure/msal-react';

function LoginPage() {
    const { instance } = useMsal()

    const handleLogin = () => {
        instance.loginPopup(loginRequest).catch(e => {
            console.log(e);
        });
    }

    return (
        <div className="App">
            <button onClick={() => handleLogin()}>Login</button>
        </div>
    )
}

export default LoginPage