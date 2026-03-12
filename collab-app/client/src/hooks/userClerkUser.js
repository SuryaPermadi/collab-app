// Adapter hook — konversi Clerk user ke format yang dipakai seluruh app
import { useUser } from '@clerk/clerk-react'

export function useClerkUser() {
    const { user, isLoaded } = useUser()

    if (!user) return { user: null, isLoaded }

    const name = user.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'

    return {
        isLoaded,
        user: {
            id: user.id,
            name,
            email: user.emailAddresses?.[0]?.emailAddress,
            imageUrl: user.imageUrl,
            avatarColor: '#00E5C3',
        }
    }
}