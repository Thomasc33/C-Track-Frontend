import React from 'react';
import App from './App';
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root')
const root = createRoot(container)

const msalInstance = new PublicClientApplication(msalConfig);

root.render(<React.StrictMode>
  <MsalProvider instance={msalInstance}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MsalProvider>
</React.StrictMode>)
