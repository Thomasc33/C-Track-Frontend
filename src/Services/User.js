/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    verify: async token => {
        let res = await axios.get(`${BaseApiUrl}/user/verify`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    updatePermissions: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/perm/edit`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    setAdmin: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/perm/edit/admin`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    setArchived: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/management/edit/archive`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    setTitle: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/management/edit/title`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    updateFavorites: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/pref/jobs/favorites`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    getNotifications: async token => {
        let res = await axios.get(`${BaseApiUrl}/user/notifications`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    closeNotification: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/notification/archive`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    flagNotificationImportant: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/notification/important`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
    readNotifications: async (FormData, token) => {
        let res = await axios.post(`${BaseApiUrl}/user/notification/read`, FormData, { headers: { 'Authorization': `Bearer ${token}`, 'X-Version': require('../backendVersion.json').version } })
            .catch(e => { console.warn(e.response.data); return { isErrored: true, error: e.response.data } })
        return res
    },
}