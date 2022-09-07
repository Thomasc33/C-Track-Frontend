/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    submitInventoryScan: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/misc/inventory`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': 'ignore' } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
}