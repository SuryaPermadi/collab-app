import { useThemeStore } from '../../stores/themeStore.js'

export default function BoardStats({ columns, tasks }) {
    const { colors: c } = useThemeStore()

    const total = tasks.length
    if (total === 0) return null

    // Hitung % tasks per kolom
    const stats = columns.map(col => {
        const count = tasks.filter(t => t.column_id === col.id).length
        const pct = Math.round((count / total) * 100)
        return { ...col, count, pct }
    })

    // Kolom "Done" = kolom terakhir atau yang ada kata "done/selesai"
    const doneCol = columns.find(c =>
        c.title.toLowerCase().includes('done') ||
        c.title.toLowerCase().includes('selesai') ||
        c.title.includes('✅')
    )
    const doneCount = doneCol ? tasks.filter(t => t.column_id === doneCol.id).length : 0
    const donePct = Math.round((doneCount / total) * 100)

    return (
        <div style={{ ...styles.wrap, background: c.bgPanel, borderBottom: `1px solid ${c.border}` }}>
            {/* Overall progress */}
            <div style={styles.overall}>
                <span style={{ fontSize: 11, color: c.textMuted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    SELESAI {doneCount}/{total}
                </span>
                <div style={{ ...styles.overallBar, background: c.border }}>
                    <div style={{
                        height: '100%', width: `${donePct}%`,
                        background: c.accent, transition: 'width 0.4s ease',
                    }} />
                </div>
                <span style={{ fontSize: 11, color: c.accent, fontFamily: 'monospace', fontWeight: 700 }}>
                    {donePct}%
                </span>
            </div>

            {/* Per-column breakdown */}
            <div style={styles.cols}>
                {stats.map(col => (
                    <div key={col.id} style={styles.colStat}>
                        <div style={styles.colDot(col.color)} />
                        <div style={styles.colInfo}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontSize: 10, color: c.textMuted, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {col.title.replace(/^[^\w\s]+\s/, '')}
                                </span>
                                <span style={{ fontSize: 10, color: c.textDim, fontFamily: 'monospace' }}>
                                    {col.count}
                                </span>
                            </div>
                            <div style={{ background: c.border, height: 3 }}>
                                <div style={{
                                    height: '100%', width: `${col.pct}%`,
                                    background: col.color, transition: 'width 0.4s ease',
                                    opacity: 0.8,
                                }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const styles = {
    wrap: {
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '8px 24px', flexShrink: 0, flexWrap: 'wrap',
    },
    overall: {
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    },
    overallBar: {
        width: 120, height: 6, overflow: 'hidden',
    },
    cols: {
        display: 'flex', gap: 16, flex: 1, flexWrap: 'wrap',
    },
    colStat: {
        display: 'flex', alignItems: 'center', gap: 6, minWidth: 100,
    },
    colDot: (color) => ({
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
    }),
    colInfo: { flex: 1 },
}