/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    add: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/job/new`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e } })
        return res
    },
    edit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/job/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e } })
        return res
    }
}