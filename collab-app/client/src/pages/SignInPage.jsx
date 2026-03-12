import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
    return (
        <div style={styles.page}>
            <div style={styles.left}>
                <div style={styles.brand}>
                    <div style={styles.logo}>⊕</div>
                    <h1 style={styles.title}>CollabSpace</h1>
                    <p style={styles.tagline}>Real-time collaboration untuk tim modern</p>
                </div>

                <div style={styles.features}>
                    {[
                        { icon: '🗂️', label: 'Kanban Board real-time' },
                        { icon: '📝', label: 'Dokumen kolaboratif' },
                        { icon: '🎨', label: 'Whiteboard bersama' },
                        { icon: '💬', label: 'Chat & reaksi' },
                    ].map(f => (
                        <div key={f.label} style={styles.featureItem}>
                            <span style={styles.featureIcon}>{f.icon}</span>
                            <span style={styles.featureLabel}>{f.label}</span>
                        </div>
                    ))}
                </div>

                <div style={styles.dots}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                            ...styles.dot,
                            opacity: 0.1 + (i * 0.1),
                            width: 6 + i * 2,
                            height: 6 + i * 2,
                        }} />
                    ))}
                </div>
            </div>

            <div style={styles.right}>
                <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    afterSignInUrl="/"
                    appearance={{
                        variables: {
                            colorPrimary: '#00E5C3',
                            colorBackground: '#0D1117',
                            colorInputBackground: '#161B22',
                            colorInputText: '#E6EDF3',
                            colorText: '#E6EDF3',
                            colorTextSecondary: '#8B949E',
                            borderRadius: '4px',
                            fontFamily: 'DM Sans, sans-serif',
                        },
                        elements: {
                            card: {
                                background: '#0D1117',
                                border: '1px solid #21262D',
                                boxShadow: 'none',
                                borderRadius: '8px',
                            },
                            headerTitle: { color: '#E6EDF3', fontSize: '20px' },
                            headerSubtitle: { color: '#8B949E' },
                            socialButtonsBlockButton: {
                                background: '#161B22',
                                border: '1px solid #21262D',
                                color: '#E6EDF3',
                            },
                            dividerLine: { background: '#21262D' },
                            dividerText: { color: '#8B949E' },
                            formFieldInput: {
                                background: '#161B22',
                                border: '1px solid #21262D',
                                color: '#E6EDF3',
                            },
                            formButtonPrimary: {
                                background: '#00E5C3',
                                color: '#080A0F',
                                fontWeight: '700',
                            },
                            footerActionLink: { color: '#00E5C3' },
                            identityPreviewText: { color: '#E6EDF3' },
                            identityPreviewEditButton: { color: '#00E5C3' },
                        },
                    }}
                />
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        background: '#080A0F',
        fontFamily: "'DM Sans', sans-serif",
    },
    left: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        background: 'linear-gradient(135deg, #080A0F 0%, #0D1117 100%)',
        borderRight: '1px solid #21262D',
        position: 'relative',
        overflow: 'hidden',
    },
    brand: { marginBottom: 60 },
    logo: {
        fontSize: 48,
        color: '#00E5C3',
        marginBottom: 16,
        lineHeight: 1,
    },
    title: {
        fontSize: 36,
        fontWeight: 800,
        color: '#E6EDF3',
        margin: '0 0 8px',
        letterSpacing: '-0.5px',
    },
    tagline: {
        fontSize: 16,
        color: '#8B949E',
        margin: 0,
        lineHeight: 1.5,
    },
    features: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
    },
    featureIcon: {
        fontSize: 22,
        width: 44,
        height: 44,
        background: '#161B22',
        border: '1px solid #21262D',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    featureLabel: {
        fontSize: 15,
        color: '#C9D1D9',
        fontWeight: 500,
    },
    dots: {
        position: 'absolute',
        bottom: 40,
        right: 40,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
    },
    dot: {
        background: '#00E5C3',
        borderRadius: '50%',
    },
    right: {
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: '#080A0F',
    },
}