import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const OAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const userDataStr = searchParams.get('user')
    const mode = searchParams.get('mode') || 'login'

    if (success === 'true' && userDataStr) {
      try {
        // Parse user data from query string
        const userData = JSON.parse(decodeURIComponent(userDataStr))
        
        // Login the user
        login(userData)
        
        // Redirect based on mode
        if (mode === 'signup') {
          // Show success message for signup
          navigate('/', { replace: true, state: { oauthSignup: true } })
        } else {
          // Regular login
          navigate('/', { replace: true })
        }
      } catch (err) {
        console.error('Failed to parse user data:', err)
        navigate('/login?error=oauth_parse_error', { replace: true })
      }
    } else if (error) {
      // Redirect to appropriate page with error
      const redirectPage = mode === 'signup' ? '/register' : '/login'
      navigate(`${redirectPage}?error=${encodeURIComponent(error)}`, { replace: true })
    } else {
      // No data, redirect to login
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate, login])

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-card card">
            <div className="loading">
              <div className="spinner"></div>
              <p style={{ marginTop: '16px' }}>Completing login...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OAuthCallback

