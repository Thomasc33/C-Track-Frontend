/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    loginValidation: async (token, accessToken) => {
        let res = await axios.post(`${BaseApiUrl}/oauth/ts/login`, { accessToken }, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .then(d => d.data)
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    getToken: async (token) => {
        let res = await axios.get(`${BaseApiUrl}/oauth/ts/verify`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .then(d => d.data)
            .catch(e => { console.log(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    }
}