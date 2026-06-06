import api from './api'

export const createUrl = async (payload) => {
  const { data } = await api.post('/api/urls', payload)
  return data.data  // { slug, originalUrl, shortUrl, ... }
}

export const listUrls = async ({ page = 1, limit = 10, search = '', status = '' } = {}) => {
  const params = { page, limit }
  if (search) params.search = search
  if (status) params.status = status
  const { data } = await api.get('/api/urls', { params })
  return data  // { success, data: [...], meta: { ... } } — meta dibutuhkan untuk pagination
}

export const getUrl = async (id) => {
  const { data } = await api.get(`/api/urls/${id}`)
  return data.data
}

export const updateUrl = async (id, payload) => {
  const { data } = await api.patch(`/api/urls/${id}`, payload)
  return data.data
}

export const deleteUrl = async (id) => {
  const { data } = await api.delete(`/api/urls/${id}`)
  return data.data
}

export const getDashboard = async () => {
  const { data } = await api.get('/api/dashboard')
  return data.data
}
