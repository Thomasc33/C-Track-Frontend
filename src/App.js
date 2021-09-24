/* eslint-disable no-unreachable */
import React from 'react';
import {
  Switch,
  Route,
  BrowserRouter
} from "react-router-dom";
import HomePage from './Pages/Home';
import AssetPage from './Pages/Asset';
import LoginPage from './Pages/Login';
import HourlyPage from './Pages/Hourly';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-common';
import UserService from './Services/User'
import './App.css';

function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal()
  async function validateUser() {
    //Get token
    const SilentRequest = { scopes: ['User.Read'], account: instance.getAccountByLocalId(accounts[0].localAccountId), forceRefresh: true }
    let res = await instance.acquireTokenSilent(SilentRequest)
      .catch(async er => {
        if (er instanceof InteractionRequiredAuthError) {
          return await instance.acquireTokenPopup(SilentRequest)
        } else {
          console.log('Unable to get token')
          return { isErrored: true, err: er }
        }
      })
    if (res.isErrored) return console.log(res.err)

    //Check to see if user exists
    res = await UserService.verify(res.accessToken)
    if (res.isErrored) return console.log(res.err)
    else localStorage.setItem('isVerified', "yes")
  }
  if (isAuthenticated && !localStorage.getItem('isVerified')) validateUser()

  if (isAuthenticated) return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/asset" render={props => <AssetPage {...props} />} />
        <Route exact path="/hourly" render={props => <HourlyPage {...props} />} />
        <Route exact path="/login" render={props => <HomePage {...props} />} />
        <Route exact path="/logout" render={props => <HomePage {...props} />} />
        <Route exact path="/admin" render={props => <HomePage {...props} />} />
        <Route exact path="/importer" render={props => <HomePage {...props} />} />
        <Route exact path="/tools" render={props => <HomePage {...props} />} />
        <Route exact path="/reports" render={props => <HomePage {...props} />} />
        <Route exact path="/daily" render={props => <HomePage {...props} />} />
        <Route exact path="/" render={props => <HomePage {...props} />} />
      </Switch>
    </BrowserRouter>
  )
  else return (
    <LoginPage />
  )
}

export default App;
