/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = `${require('../settings.json').APIBase}/parts`

export default {
    newPartType: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/common/new`, FormData, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    editPartType: async (FormData, token) => {
        let res = await axios.put(`${BaseApiUrl}/common/edit`, FormData, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    addModelList: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/mgmt/models/create`, FormData, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    editPart: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/mgmt/part/edit`, FormData, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    newPart: async (FormData, token) => {
        let res = await axios.put(`${BaseApiUrl}/mgmt/part/create`, FormData, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    getCommonParts: async (asset, token) => {
        let res = await axios.get(`${BaseApiUrl}/log/asset/${asset}`, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    attemptSubmitLog: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/log`, FormData, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    submitLog: async (FormData, token) => {
        let res = await axios.put(`${BaseApiUrl}/log`, FormData, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    deleteLog: async (id, token) => {
        let res = await axios.delete(`${BaseApiUrl}/log/${id}`, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    deletePart: async (id, token) => {
        let res = await axios.delete(`${BaseApiUrl}/mgmt/part/${id}`, { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '*', 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    }
}