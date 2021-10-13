/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    add: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/new`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e.response } })
        console.log(res)
        return res
    },
    edit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e.response } })
        return res
    },
    delete: async (id, date, token) => {
        let res = await axios.delete(`${BaseApiUrl}/asset/user/del/${id}/${date}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e.response } })
        return res
    },
    fetch: async (id, token) => {
        let res = await axios.get(`${BaseApiUrl}/asset/fetch/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e.response } })
        return res
    },
    singleEdit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e.response } })
        return res
    },
    /**
     * 
     * @param {Object} FormData 
     * @param {String} FormData.asset_id
     * @param {String} FormData.model_id
     * @param {*} token 
     * @returns 
     */
    create: async (FormData, token) => {
        let res = await axios.put(`${BaseApiUrl}/asset/create`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { return { isErrored: true, error: e.response.data.message } })
        return res
    }
}