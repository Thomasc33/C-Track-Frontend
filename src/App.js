import React, { useState, useEffect } from 'react';
import {
  Switch,
  Route,
  Redirect,
  BrowserRouter
} from "react-router-dom";
import HomePage from './Pages/Home';
import AssetPage from './Pages/Asset';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/asset" render={props => <AssetPage {...props} />} />
        <Route exact path="/hourly" render={props => <HomePage {...props} />} />
        <Route exact path="/login" render={props => <HomePage {...props} />} />
        <Route exact path="/logout" render={props => <HomePage {...props} />} />
        <Route exact path="/admin" render={props => <HomePage {...props} />} />
        <Route exact path="/importer" render={props => <HomePage {...props} />} />
        <Route exact path="/tools" render={props => <HomePage {...props} />} />
        <Route exact path="/reports" render={props => <HomePage {...props} />} />
        <Route exact path="/daily" render={props => <HomePage {...props} />} />
        <Route exact path="/" /*render={props => AuthModule.checkAuth() ? <HomePage {...props} /> : <Redirect to='/' />} />*/ render={props => <HomePage {...props} />} />
      </Switch>
    </BrowserRouter>
  );
}

const AuthModule = {
  checkAuth(cb) {
    return true
    if (localStorage.length === 0) return false
    const access_token = localStorage.getItem('access_token')
    const refresh_token = localStorage.getItem('refresh_token')
    const expires_in = localStorage.getItem('expires_in')
    const token_type = localStorage.getItem('token_type')
    if (!access_token || !refresh_token) return false;
    if (expires_in < Date.now()) {
      //revalidate token
    }
    const id = localStorage.getItem('id')
    const username = localStorage.getItem('username')
    const discriminator = localStorage.getItem('discriminator')
    const avatar = localStorage.getItem('avatar')
    if (id && username && discriminator && avatar) return true
    //validate access_token
    fetch('https://discord.com/api/users/@me', {
      headers: {
        authorization: `${token_type} ${access_token}`
      }
    })
      .then(res => res.json())
      .then(res => {
        localStorage.setItem('id', res.id)
        localStorage.setItem('username', res.username)
        localStorage.setItem('discriminator', res.discriminator)
        localStorage.setItem('avatar', res.avatar)
      })
    return true
  },
  async asyncCheckAuth(cb) {
    if (localStorage.length === 0) return false
    const access_token = localStorage.getItem('access_token')
    const refresh_token = localStorage.getItem('refresh_token')
    const expires_in = localStorage.getItem('expires_in')
    const token_type = localStorage.getItem('token_type')
    if (!access_token || !refresh_token) return false;
    if (expires_in < Date.now()) {
      //revalidate token
    }
    const id = localStorage.getItem('id')
    const username = localStorage.getItem('username')
    const discriminator = localStorage.getItem('discriminator')
    const avatar = localStorage.getItem('avatar')
    if (id && username && discriminator && avatar) return true
    //validate access_token
    let resp = await fetch('https://discord.com/api/users/@me', {
      headers: {
        authorization: `${token_type} ${access_token}`
      }
    })
    let res = await resp.json()
    localStorage.setItem('id', res.id)
    localStorage.setItem('username', res.username)
    localStorage.setItem('discriminator', res.discriminator)
    localStorage.setItem('avatar', res.avatar)
    return true
  }
}

export default App;
