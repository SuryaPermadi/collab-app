import { useThemeStore } from '../../stores/themeStore.js'

export default function ThemeToggle() {
    const { mode, toggle } = useThemeStore()

    return (
        <button
            onClick={toggle}
            title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
                background: 'none',
                border: '1px solid',
                borderColor: mode === 'dark' ? '#1E2433' : '#D8DCE8',
                color: mode === 'dark' ? '#5A6380' : '#6B7280',
                width: 34, height: 34,
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
            }}
        >
            {mode === 'dark' ? '☀️' : '🌙'}
        </button>
    )
}