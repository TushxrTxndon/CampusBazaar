import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Users API
export const registerUser = async (userData) => {
  const response = await api.post('/users/register', userData)
  return response.data
}

export const loginUser = async (credentials) => {
  const response = await api.post('/users/login', credentials)
  return response.data
}

export const getUserInfo = async (emailId) => {
  const response = await api.get(`/users/${emailId}`)
  return response.data
}

// Student API
export const registerStudent = async (studentData) => {
  const response = await api.post('/students/register', studentData)
  return response.data
}

// Faculty API
export const registerFaculty = async (facultyData) => {
  const response = await api.post('/faculty/register', facultyData)
  return response.data
}

// Products API
export const getAllProducts = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.category_id) params.append('category_id', filters.category_id)
  if (filters.min_price) params.append('min_price', filters.min_price)
  if (filters.max_price) params.append('max_price', filters.max_price)
  if (filters.sort_by) params.append('sort_by', filters.sort_by)
  if (filters.search) params.append('search', filters.search)
  
  const queryString = params.toString()
  const url = queryString ? `/products/?${queryString}` : '/products/'
  const response = await api.get(url)
  return response.data
}

export const getAllCategories = async () => {
  const response = await api.get('/category/')
  return response.data
}

export const getProductFeedbacks = async (pid) => {
  const response = await api.get(`/feedback/product/${pid}`)
  return response.data
}

export const getProduct = async (pid) => {
  const response = await api.get(`/products/${pid}`)
  return response.data
}

export const addProduct = async (productData) => {
  const response = await api.post('/products/add', productData)
  return response.data
}

export const uploadProductImage = async (imageFile) => {
  const formData = new FormData()
  formData.append('file', imageFile)
  const response = await api.post('/product-images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const addProductImage = async (imageData) => {
  const response = await api.post('/product-images/add', imageData)
  return response.data
}

export const getProductImages = async (pid) => {
  const response = await api.get(`/product-images/product/${pid}`)
  return response.data
}

export const deleteProductImage = async (imageId) => {
  const response = await api.delete(`/product-images/${imageId}`)
  return response.data
}

// Payments API
export const initiatePayment = async (paymentData) => {
  const response = await api.post('/payments/initiate', paymentData)
  return response.data
}

export const verifyPayment = async (otpData) => {
  const response = await api.post('/payments/verify', otpData)
  return response.data
}

export const resendOTP = async (emailId, orderId) => {
  const response = await api.post('/payments/resend-otp', {
    email_id: emailId,
    order_id: orderId
  })
  return response.data
}

// Stock API
export const checkStock = async (pid, quantity) => {
  const response = await api.post('/stock/check', {
    PID: pid,
    Quantity: quantity
  })
  return response.data
}

export const checkStockMultiple = async (items) => {
  const response = await api.post('/stock/check-multiple', { items })
  return response.data
}

// OAuth API
export const getOAuthProviders = async () => {
  const response = await api.get('/oauth/providers')
  return response.data
}

export const initiateGoogleLogin = (mode = 'login') => {
  // Redirect to backend OAuth endpoint
  // mode can be 'login' or 'signup'
  window.location.href = `${API_BASE_URL}/oauth/login/google?mode=${mode}`
}

// Categories API
export const addCategory = async (categoryData) => {
  const response = await api.post('/category/add', categoryData)
  return response.data
}

export const assignCategoryToProduct = async (productCategoryData) => {
  const response = await api.post('/product-category/assign', productCategoryData)
  return response.data
}

// Orders API
export const createOrder = async (orderData) => {
  const response = await api.post('/orders/create', orderData)
  return response.data
}

export const getUserOrders = async (emailId) => {
  const response = await api.get(`/orders/user/${emailId}`)
  return response.data
}

export const getOrder = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`)
  return response.data
}

// Order Details API
export const addOrderDetail = async (orderDetailData) => {
  const response = await api.post('/order-details/add', orderDetailData)
  return response.data
}

// Feedback API
export const addFeedback = async (feedbackData) => {
  const response = await api.post('/feedback/add', feedbackData)
  return response.data
}

// Lists API (Product listings by sellers)
export const addToList = async (listData) => {
  const response = await api.post('/lists/add', listData)
  return response.data
}

export const getUserListings = async (emailId) => {
  const response = await api.get(`/lists/user/${emailId}`)
  return response.data
}

export const getProductSellers = async (pid) => {
  const response = await api.get(`/lists/product/${pid}`)
  return response.data
}

export const updateListing = async (listData) => {
  const response = await api.put('/lists/update', listData)
  return response.data
}

export const removeListing = async (emailId, pid) => {
  const response = await api.delete(`/lists/remove?email_id=${emailId}&pid=${pid}`)
  return response.data
}

export default api

