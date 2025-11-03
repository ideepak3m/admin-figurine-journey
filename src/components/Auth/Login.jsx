import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.jpg'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const { signIn, resetPassword } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await signIn(email, password)
        } catch (err) {
            setError(err.message || 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!email) {
            setError('Please enter your email address first')
            return
        }
        setError(null)
        try {
            await resetPassword(email)
            alert('Password reset email sent! Check your inbox.')
        } catch (err) {
            setError(err.message || 'Failed to send reset email')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <img
                        src={logo}
                        alt="FigureIt Admin Logo"
                        className="mx-auto h-16 w-auto"
                    />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        FigureIt Admin
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to your account
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt mr-2"></i>
                                    Sign In
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-right">
                        <button
                            type="button"
                            onClick={handleResetPassword}
                            className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}
                </form>
            </div>
        </div>
    )
}

export default Login