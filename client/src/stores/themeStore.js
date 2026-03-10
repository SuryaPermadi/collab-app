import { create } from 'zustand'

const DARK = {
    bg: '#080A0F',
    bgCard: '#111520',
    bgPanel: '#0F1420',
    bgInput: '#080A0F',
    border: '#1E2433',
    borderHover: '#2E3550',
    text: '#E8EBF2',
    textMuted: '#5A6380',
    textDim: '#3A4255',
    accent: '#00E5C3',
    accentPurple: '#7B61FF',
    danger: '#FF4D6D',
    warning: '#FFB347',
}

const LIGHT = {
    bg: '#F4F6FB',
    bgCard: '#FFFFFF',
    bgPanel: '#ECEEF5',
    bgInput: '#FFFFFF',
    border: '#D8DCE8',
    borderHover: '#B8BCCC',
    text: '#1A1D2E',
    textMuted: '#6B7280',
    textDim: '#9CA3AF',
    accent: '#00B89C',
    accentPurple: '#6B4FE0',
    danger: '#E53E5E',
    warning: '#D97706',
}

export const useThemeStore = create((set, get) => ({
    mode: localStorage.getItem('theme') || 'dark',
    colors: localStorage.getItem('theme') === 'light' ? LIGHT : DARK,

    toggle: () => {
        const next = get().mode === 'dark' ? 'light' : 'dark'
        localStorage.setItem('theme', next)
        set({ mode: next, colors: next === 'dark' ? DARK : LIGHT })
    },
}))