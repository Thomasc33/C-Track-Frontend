/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    add: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/job/new`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': 'ignore' } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    edit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/job/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    }
}