/* eslint-disable import/no-anonymous-default-export */
import axios from 'axios'
const BaseApiUrl = require('../settings.json').APIBase

export default {
    verify: async FormData => {
        let res = await axios.post(`${BaseApiUrl}/user/verify`, FormData)
            .catch(e => { return { isErrored: true, error: e } })
        return res
    },
}