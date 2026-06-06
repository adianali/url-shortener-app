import api from './api'

export const getAnalytics = async (urlId, { period = '7d' } = {}) => {
  const { data } = await api.get(`/api/urls/${urlId}/analytics`, { params: { period } })
  return data.data
}

export const getClicks = async (urlId, { page = 1, limit = 50 } = {}) => {
  const { data } = await api.get(`/api/urls/${urlId}/analytics/clicks`, { params: { page, limit } })
  return data  // { success, data: [...], meta: { ... } }
}

export const getSummary = async (urlId) => {
  const { data } = await api.get(`/api/urls/${urlId}/analytics/summary`)
  return data.data
}
