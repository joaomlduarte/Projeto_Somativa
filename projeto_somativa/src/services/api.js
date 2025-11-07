// src/services/api.js
import axios from 'axios'

// Usa VITE_API_URL se existir; caso contrário usa '/api' (proxied via Vite em dev)
const baseURL = 'http://localhost:4000/api' 

const api = axios.create({
  baseURL,
  timeout: 10000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)

export default api
