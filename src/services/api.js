import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Attach JWT to every request
api.interceptors.request.use(config => {
  try {
    const stored = localStorage.getItem('megaseller_auth')
    if (stored) {
      const { token } = JSON.parse(stored)
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data)

export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password }).then(r => r.data)

// Movies
export const getMovies = () =>
  api.get('/movies').then(r => r.data)

export const getShowtimes = (movieId) =>
  api.get(`/movies/${movieId}/showtimes`).then(r => r.data)

export const getShowtime = (showtimeId) =>
  api.get(`/movies/showtimes/${showtimeId}`).then(r => r.data)

// Tickets
export const buyTicket = (showtimeId, preferredSeatRow, preferredSeatNumber) =>
  api.post('/tickets/buy', { showtimeId, preferredSeatRow, preferredSeatNumber })
    .then(r => r.data)

// Orders
export const getMyOrders = () =>
  api.get('/users/orders').then(r => r.data)

// Admin
export const getAdminMetrics = () =>
  api.get('/admin/metrics').then(r => r.data)

export const getAdminInventory = () =>
  api.get('/admin/inventory').then(r => r.data)

export default api
