import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  text: string
  width?: number
}

export default function Tip({ text, width = 220 }: Props) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const iconRef = useRef<HTMLSpanElement>(null)

  const show = useCallback(() => {
    if (!iconRef.current) return
    setRect(iconRef.current.getBoundingClientRect())
  }, [])

  const hide = useCallback(() => setRect(null), [])

  const renderTooltip = () => {
    if (!rect) return null
    const below = rect.top < 100
    const top = below ? rect.bottom + 6 : rect.top - 6

    let left = rect.left + rect.width / 2
    const half = width / 2
    if (left - half < 8) left = half + 8
    if (left + half > window.innerWidth - 8) left = window.innerWidth - half - 8

    return createPortal(
      <div style={{
        position: 'fixed',
        top: below ? top : undefined,
        bottom: below ? undefined : window.innerHeight - top,
        left,
        transform: 'translateX(-50%)',
        padding: '8px 12px', borderRadius: 8,
        background: '#1e293b', border: '1px solid rgba(51,65,85,0.8)',
        color: '#cbd5e1', fontSize: 11, lineHeight: 1.5,
        whiteSpace: 'pre-line', width, zIndex: 99999,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}>
        {text}
      </div>,
      document.body,
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={show}
      onMouseLeave={hide}>
      <span ref={iconRef} style={{
        width: 14, height: 14, borderRadius: '50%',
        border: '1px solid rgba(100,116,139,0.4)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: '#64748b', cursor: 'help',
        marginLeft: 4, flexShrink: 0, lineHeight: 1,
      }}>
        ?
      </span>
      {renderTooltip()}
    </span>
  )
}
