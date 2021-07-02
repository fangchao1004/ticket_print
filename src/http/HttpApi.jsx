import axois from 'axios'
const Testuri = 'http://ixiaomu.cn:3010/'
// const Testuri = 'http://60.174.196.158:3008/'
const HttpApi = {
    obs: (params) => {
        return axois.post(Testuri + 'obs', params)
    },
    getAllUserlist: async () => {
        let sql = `select id,name,username from users where effective = 1`
        let result = await HttpApi.obs({ sql })
        if (result.data.code === 0) {
            return result.data.data
        }
        return []
    },
    getJBTRecord: async ({ id }) => {
        let sql = `select * from job_tickets_records where id = ${id}`
        let result = await HttpApi.obs({ sql })
        if (result.data.code === 0) {
            return result.data.data[0]
        }
        return null
    },
    getJBTApplyRecord: async ({ id }) => {
        let sql = `select * from job_tickets_apply_records where job_t_r_id = ${id}`
        let result = await HttpApi.obs({ sql })
        if (result.data.code === 0) {
            return result.data.data[0]
        }
        return null
    }
}
export default HttpApi