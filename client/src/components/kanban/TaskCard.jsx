import { useState } from 'react'

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: '#00E5C3', bg: 'rgba(0,229,195,0.1)' },
    medium: { label: 'Medium', color: '#FFB347', bg: 'rgba(255,179,71,0.1)' },
    high: { label: 'High', color: '#FF4D6D', bg: 'rgba(255,77,109,0.1)' },
}

export default function TaskCard({ task, onClick }) {
    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

    const isOverdue = task.due_date && new Date(task.due_date) < new Date()

    return (
        <div style={styles.card} onClick={onClick}>
            {/* Priority badge */}
            <div style={styles.topRow}>
                <span style={{ ...styles.priority, color: priority.color, background: priority.bg }}>
                    {priority.label}
                </span>
                {task.due_date && (
                    <span style={{ ...styles.dueDate, color: isOverdue ? '#FF4D6D' : '#5A6380' }}>
                        📅 {new Date(task.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>

            {/* Title */}
            <div style={styles.title}>{task.title}</div>

            {/* Description preview */}
            {task.description && (
                <div style={styles.desc}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</div>
            )}

            {/* Footer */}
            <div style={styles.footer}>
                {/* Labels */}
                <div style={styles.labels}>
                    {(task.labels || []).slice(0, 2).map(label => (
                        <span key={label} style={styles.label}>{label}</span>
                    ))}
                </div>

                {/* Assignee */}
                {task.assignee_name && (
                    <div
                        style={{ ...styles.assignee, background: task.assignee_color || '#7B61FF' }}
                        title={task.assignee_name}
                    >
                        {task.assignee_name[0].toUpperCase()}
                    </div>
                )}
            </div>
        </div>
    )
}

const styles = {
    card: {
        background: '#111520', border: '1px solid #1E2433',
        padding: '12px 14px', cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
        userSelect: 'none',
    },
    topRow: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
    },
    priority: {
        fontSize: 10, fontFamily: 'monospace',
        padding: '2px 6px', letterSpacing: '0.05em',
        fontWeight: 700,
    },
    dueDate: { fontSize: 10, fontFamily: 'monospace' },
    title: {
        fontSize: 13, fontWeight: 600, color: '#E8EBF2',
        lineHeight: 1.4, marginBottom: 6,
    },
    desc: {
        fontSize: 11, color: '#5A6380', lineHeight: 1.5, marginBottom: 8,
    },
    footer: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginTop: 8,
    },
    labels: { display: 'flex', gap: 4, flexWrap: 'wrap' },
    label: {
        fontSize: 10, background: '#1E2433', color: '#5A6380',
        padding: '2px 6px', borderRadius: 2,
    },
    assignee: {
        width: 22, height: 22, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#080A0F',
    },
}