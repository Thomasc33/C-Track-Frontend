/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    add: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/new`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    edit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/user/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    delete: async (id, date, token) => {
        let res = await axios.delete(`${BaseApiUrl}/asset/user/del/${id}/${date}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    fetch: async (id, token) => {
        let res = await axios.get(`${BaseApiUrl}/asset/fetch/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    singleEdit: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
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
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    rename: async (FormData, token) => {
        let res = await axios.patch(`${BaseApiUrl}/asset/rename`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    watch: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/watch`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    unwatch: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/unwatch`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    lock: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/lock`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    unlock: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/asset/unlock`, FormData, { headers: { 'Authorization': `Bearer ${token}` } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    }
}