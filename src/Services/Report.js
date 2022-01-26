/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    generateReport: async (token, date, range = null) => {
        let res = await axios.post(`${BaseApiUrl}/reports/generate`, { date: date, range: range || 0, }, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(d => d.data)
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    generateAssetSummary: async (token, date, range = null) => {
        let res = await axios.post(`${BaseApiUrl}/reports/assetsummary`, { date: date, range: range || 0, }, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(d => d.data)
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    }
}