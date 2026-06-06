import api from './api'

export const register = async ({ email, password }) => {
  const { data } = await api.post('/api/auth/register', { email, password })
  return data.data  // { user, accessToken, refreshToken }
}

export const login = async ({ email, password }) => {
  const { data } = await api.post('/api/auth/login', { email, password })
  return data.data  // { user, accessToken, refreshToken }
}

export const logout = async (refreshToken) => {
  try {
    await api.post('/api/auth/logout', { refreshToken })
  } catch {
    // ignore errors on logout
  }
}

export const refresh = async (refreshToken) => {
  const { data } = await api.post('/api/auth/refresh', { refreshToken })
  return data.data  // { accessToken, refreshToken }
}
