/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    verify: async token => {
        let res = await axios.get(`${BaseApiUrl}/user/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .catch(e => { return { isErrored: true, error: e.response } })
        return res
    },
    updatePermissions: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/perm/edit`, FormData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .catch(e => { return { isErrored: true, error: e.response } })
        return res
    },
    setAdmin: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/perm/edit/admin`, FormData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .catch(e => { return { isErrored: true, error: e.response } })
        return res
    },
}