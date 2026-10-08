import { Navigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'

const LoginLanding = () => {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (user) return <Navigate to="/dashboard" replace />

  return <LoginForm role="admin" />
}

export default LoginLanding