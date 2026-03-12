import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'

// Simpan Clerk token ke window supaya api.js bisa akses
export default function ClerkTokenProvider({ children }) {
    const { getToken, isSignedIn } = useAuth()

    useEffect(() => {
        if (!isSignedIn) return

        const refresh = async () => {
            const token = await getToken()
            window.__clerk_token = token
        }

        refresh()
        // Refresh token setiap 50 detik (token Clerk expire tiap 60 detik)
        const interval = setInterval(refresh, 50_000)
        return () => clearInterval(interval)
    }, [isSignedIn])

    return children
}