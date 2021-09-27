/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    add: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/new`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e } })
        console.log(res)
        return res
    },
    edit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e } })
        return res
    },
    delete: async (id, token) => {
        let res = await axios.delete(`${BaseApiUrl}/asset/user/del/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e } })
        return res
    }
}