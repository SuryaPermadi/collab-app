import { useState } from 'react'

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function DatePicker({ value, onChange, onClose }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const selected = value ? new Date(value + 'T00:00:00') : null

    const [viewDate, setViewDate] = useState(selected || new Date())

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

    const handleSelect = (day) => {
        const d = new Date(year, month, day)
        // Format YYYY-MM-DD manual agar tidak timezone issue
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        onChange(`${yyyy}-${mm}-${dd}`)
        onClose?.()
    }

    const isSameDay = (day) => {
        if (!selected) return false
        return selected.getFullYear() === year &&
            selected.getMonth() === month &&
            selected.getDate() === day
    }

    const isToday = (day) => {
        const t = new Date()
        return t.getFullYear() === year &&
            t.getMonth() === month &&
            t.getDate() === day
    }

    // Hanya disable tanggal yang SEBELUM hari ini (kemarin ke belakang)
    const isPast = (day) => {
        const d = new Date(year, month, day)
        d.setHours(0, 0, 0, 0)
        return d < today
    }

    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    return (
        <div style={styles.wrap}>
            <div style={styles.header}>
                <button style={styles.navBtn} onClick={prevMonth}>‹</button>
                <span style={styles.monthLabel}>{MONTHS[month]} {year}</span>
                <button style={styles.navBtn} onClick={nextMonth}>›</button>
            </div>

            <div style={styles.grid}>
                {DAYS.map(d => (
                    <div key={d} style={styles.dayName}>{d}</div>
                ))}
                {cells.map((day, i) => {
                    const past = day ? isPast(day) : false
                    const selected_ = day ? isSameDay(day) : false
                    const today_ = day ? isToday(day) : false
                    return (
                        <div key={i} style={styles.cell}>
                            {day && (
                                <button
                                    style={{
                                        ...styles.dayBtn,
                                        ...(selected_ ? styles.selected : {}),
                                        ...(today_ && !selected_ ? styles.today : {}),
                                        ...(past ? styles.past : {}),
                                    }}
                                    onClick={() => !past && handleSelect(day)}
                                >
                                    {day}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            {value && (
                <div style={styles.footer}>
                    <button style={styles.clearBtn} onClick={() => { onChange(null); onClose?.() }}>
                        Hapus tanggal
                    </button>
                </div>
            )}
        </div>
    )
}

const styles = {
    wrap: {
        background: '#0F1420', border: '1px solid #1E2433',
        padding: 12, width: '100%', boxSizing: 'border-box',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
    },
    navBtn: {
        background: 'none', border: 'none', color: '#5A6380',
        cursor: 'pointer', fontSize: 18, padding: '2px 8px',
    },
    monthLabel: {
        fontSize: 13, fontWeight: 700, color: '#E8EBF2', fontFamily: 'monospace',
    },
    grid: {
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2,
    },
    dayName: {
        fontSize: 9, color: '#3A4255', textAlign: 'center',
        fontFamily: 'monospace', padding: '4px 0', letterSpacing: '0.05em',
    },
    cell: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    dayBtn: {
        width: 30, height: 30, borderRadius: 2,
        background: 'none', border: 'none',
        color: '#C8CBD6', cursor: 'pointer', fontSize: 12,
        fontFamily: 'monospace', transition: 'all 0.15s',
        padding: 0,
    },
    selected: {
        background: '#00E5C3', color: '#080A0F', fontWeight: 700,
    },
    today: {
        border: '1px solid #00E5C3', color: '#00E5C3',
    },
    past: {
        color: '#2A3045', cursor: 'not-allowed',
    },
    footer: {
        marginTop: 12, borderTop: '1px solid #1E2433', paddingTop: 10,
        textAlign: 'center',
    },
    clearBtn: {
        background: 'none', border: 'none', color: '#5A6380',
        cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
    },
}