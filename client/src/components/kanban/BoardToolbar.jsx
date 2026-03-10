import { useState } from 'react'

const PRIORITIES = ['low', 'medium', 'high']
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' }
const PRIORITY_COLORS = { low: '#00E5C3', medium: '#FFB347', high: '#FF4D6D' }

export default function BoardToolbar({ members, filters, onFilterChange, onExport, exporting }) {
    const [showFilter, setShowFilter] = useState(false)

    const hasActiveFilter = filters.search || filters.assignee || filters.priority || filters.dueSoon

    const clearAll = () => onFilterChange({ search: '', assignee: '', priority: '', dueSoon: false })

    return (
        <div style={styles.wrap}>
            {/* Search */}
            <div style={styles.searchWrap}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                    style={styles.searchInput}
                    placeholder="Cari task..."
                    value={filters.search}
                    onChange={e => onFilterChange({ ...filters, search: e.target.value })}
                />
                {filters.search && (
                    <button style={styles.clearBtn} onClick={() => onFilterChange({ ...filters, search: '' })}>✕</button>
                )}
            </div>

            {/* Filter Button */}
            <div style={{ position: 'relative' }}>
                <button
                    style={{
                        ...styles.btn,
                        borderColor: hasActiveFilter ? '#7B61FF' : '#1E2433',
                        color: hasActiveFilter ? '#7B61FF' : '#5A6380',
                        background: hasActiveFilter ? 'rgba(123,97,255,0.1)' : 'none',
                    }}
                    onClick={() => setShowFilter(v => !v)}
                >
                    ⚙ Filter {hasActiveFilter && <span style={styles.activeDot} />}
                </button>

                {/* Filter Dropdown */}
                {showFilter && (
                    <div style={styles.filterDropdown}>
                        {/* Assignee */}
                        <div style={styles.filterSection}>
                            <div style={styles.filterLabel}>ASSIGNEE</div>
                            <select
                                style={styles.select}
                                value={filters.assignee}
                                onChange={e => onFilterChange({ ...filters, assignee: e.target.value })}
                            >
                                <option value="">Semua</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                                <option value="unassigned">Belum diassign</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div style={styles.filterSection}>
                            <div style={styles.filterLabel}>PRIORITAS</div>
                            <div style={styles.priorityGroup}>
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p}
                                        style={{
                                            ...styles.priorityChip,
                                            borderColor: filters.priority === p ? PRIORITY_COLORS[p] : '#1E2433',
                                            color: filters.priority === p ? PRIORITY_COLORS[p] : '#5A6380',
                                            background: filters.priority === p ? `${PRIORITY_COLORS[p]}15` : 'none',
                                        }}
                                        onClick={() => onFilterChange({
                                            ...filters,
                                            priority: filters.priority === p ? '' : p
                                        })}
                                    >
                                        {PRIORITY_LABELS[p]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Due Soon */}
                        <div style={styles.filterSection}>
                            <div style={styles.filterLabel}>DUE DATE</div>
                            <button
                                style={{
                                    ...styles.dueSoonBtn,
                                    borderColor: filters.dueSoon ? '#FFB347' : '#1E2433',
                                    color: filters.dueSoon ? '#FFB347' : '#5A6380',
                                    background: filters.dueSoon ? 'rgba(255,179,71,0.1)' : 'none',
                                }}
                                onClick={() => onFilterChange({ ...filters, dueSoon: !filters.dueSoon })}
                            >
                                📅 Due dalam 3 hari
                            </button>
                        </div>

                        {/* Clear */}
                        {hasActiveFilter && (
                            <button style={styles.clearAllBtn} onClick={clearAll}>
                                Reset semua filter
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Active filter chips */}
            {hasActiveFilter && (
                <div style={styles.chips}>
                    {filters.assignee && (
                        <span style={styles.chip}>
                            👤 {filters.assignee === 'unassigned' ? 'Unassigned' : members.find(m => m.id === filters.assignee)?.name}
                            <button style={styles.chipRemove} onClick={() => onFilterChange({ ...filters, assignee: '' })}>×</button>
                        </span>
                    )}
                    {filters.priority && (
                        <span style={{ ...styles.chip, color: PRIORITY_COLORS[filters.priority] }}>
                            {PRIORITY_LABELS[filters.priority]}
                            <button style={styles.chipRemove} onClick={() => onFilterChange({ ...filters, priority: '' })}>×</button>
                        </span>
                    )}
                    {filters.dueSoon && (
                        <span style={{ ...styles.chip, color: '#FFB347' }}>
                            Due ≤3 hari
                            <button style={styles.chipRemove} onClick={() => onFilterChange({ ...filters, dueSoon: false })}>×</button>
                        </span>
                    )}
                </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Export PDF */}
            <button
                style={{ ...styles.btn, ...styles.exportBtn }}
                onClick={onExport}
                disabled={exporting}
            >
                {exporting ? '⏳ Exporting...' : '📄 Export PDF'}
            </button>
        </div>
    )
}

const styles = {
    wrap: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 24px', borderBottom: '1px solid #1E2433',
        background: '#080A0F', flexShrink: 0, flexWrap: 'wrap',
    },
    searchWrap: {
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#0F1420', border: '1px solid #1E2433',
        padding: '6px 12px', width: 220,
    },
    searchIcon: { fontSize: 13, opacity: 0.5 },
    searchInput: {
        background: 'none', border: 'none', color: '#E8EBF2',
        fontSize: 12, fontFamily: 'inherit', outline: 'none', flex: 1,
    },
    clearBtn: {
        background: 'none', border: 'none', color: '#5A6380',
        cursor: 'pointer', fontSize: 12, padding: 0,
    },
    btn: {
        background: 'none', border: '1px solid #1E2433',
        color: '#5A6380', padding: '6px 14px', cursor: 'pointer',
        fontSize: 12, fontFamily: 'inherit', display: 'flex',
        alignItems: 'center', gap: 6, transition: 'all 0.15s',
        position: 'relative',
    },
    activeDot: {
        width: 6, height: 6, borderRadius: '50%',
        background: '#7B61FF', display: 'inline-block',
    },
    exportBtn: {
        borderColor: '#00E5C3', color: '#00E5C3',
    },
    filterDropdown: {
        position: 'absolute', top: 'calc(100% + 6px)', left: 0,
        background: '#0F1420', border: '1px solid #1E2433',
        padding: 16, zIndex: 100, width: 220,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    },
    filterSection: { marginBottom: 16 },
    filterLabel: {
        fontSize: 10, color: '#3A4255', fontFamily: 'monospace',
        letterSpacing: '0.1em', marginBottom: 8,
    },
    select: {
        width: '100%', background: '#080A0F', border: '1px solid #1E2433',
        color: '#E8EBF2', padding: '7px 10px', fontSize: 12,
        fontFamily: 'inherit', outline: 'none',
    },
    priorityGroup: { display: 'flex', gap: 6 },
    priorityChip: {
        flex: 1, background: 'none', border: '1px solid',
        padding: '5px 0', cursor: 'pointer', fontSize: 11,
        fontFamily: 'inherit', transition: 'all 0.15s',
    },
    dueSoonBtn: {
        width: '100%', background: 'none', border: '1px solid',
        padding: '7px 10px', cursor: 'pointer', fontSize: 12,
        fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
    },
    clearAllBtn: {
        width: '100%', background: 'none', border: 'none',
        color: '#5A6380', cursor: 'pointer', fontSize: 11,
        fontFamily: 'inherit', textAlign: 'center', marginTop: 4,
        padding: '6px 0', borderTop: '1px solid #1E2433',
    },
    chips: { display: 'flex', gap: 6, flexWrap: 'wrap' },
    chip: {
        background: '#1E2433', color: '#E8EBF2',
        fontSize: 11, padding: '3px 8px',
        display: 'flex', alignItems: 'center', gap: 4,
    },
    chipRemove: {
        background: 'none', border: 'none', color: '#5A6380',
        cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1,
    },
}