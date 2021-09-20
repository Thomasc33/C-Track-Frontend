import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { CookiesProvider } from 'react-cookie';

const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.render(
  <React.StrictMode>
    <CookiesProvider>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
    </CookiesProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
