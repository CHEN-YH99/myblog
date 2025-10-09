import api from '@/utils/http'

// 导出默认的 request 对象，提供常用的 HTTP 方法
const request = {
  get: (url: string, params?: any, config?: any) => {
    return api.get({ url, params, ...config })
  },
  
  post: (url: string, data?: any, config?: any) => {
    return api.post({ url, data, ...config })
  },
  
  put: (url: string, data?: any, config?: any) => {
    return api.put({ url, data, ...config })
  },
  
  delete: (url: string, params?: any, config?: any) => {
    return api.del({ url, params, ...config })
  },
  
  // 通用请求方法
  request: (config: any) => {
    return api.request(config)
  }
}

export default request