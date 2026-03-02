import type { LaunchStage, CloseoutResult } from '../../types'

interface Props {
  launchStages: LaunchStage[]
  launchError: string | null
  launchResult: { signature: string; mint: string } | null
  actionResult: CloseoutResult | null
  onDismissLaunch: () => void
  onDismissResult: () => void
}

export default function StatusBar({
  launchStages, launchError, launchResult,
  actionResult,
  onDismissLaunch, onDismissResult,
}: Props) {
  const hasLaunch = launchStages.length > 0 || launchError || launchResult
  const hasResult = !!actionResult

  if (!hasLaunch && !hasResult) return null

  let bg = 'rgba(15,23,42,0.4)'
  let border = 'rgba(37,51,70,0.4)'
  if (hasLaunch) {
    if (launchError) { bg = 'rgba(244,63,94,0.06)'; border = 'rgba(244,63,94,0.15)' }
    else if (launchResult) { bg = 'rgba(52,211,153,0.06)'; border = 'rgba(52,211,153,0.15)' }
    else { bg = 'rgba(99,102,241,0.06)'; border = 'rgba(99,102,241,0.15)' }
  } else if (hasResult) {
    const ok = actionResult!.recovered > 0 || actionResult!.fees > 0
    bg = ok ? 'rgba(16,185,129,0.06)' : 'rgba(100,116,139,0.06)'
    border = ok ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'
  }

  const activeStage = launchStages.find(s => s.status === 'active')
  const lastDone = [...launchStages].reverse().find(s => s.status === 'done')
  const doneCount = launchStages.filter(s => s.status === 'done').length

  return (
    <div style={{
      marginBottom: 10, padding: '0 12px', height: 36, borderRadius: 8,
      background: bg, border: `1px solid ${border}`,
      display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, overflow: 'hidden',
    }}>
      {hasLaunch ? (
        <>
          {launchError ? (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fb7185', flexShrink: 0 }} />
          ) : launchResult ? (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 10, height: 10, border: '2px solid #818cf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          )}

          <span style={{ fontWeight: 700, color: launchError ? '#fb7185' : launchResult ? '#34d399' : '#818cf8', flexShrink: 0 }}>
            {launchResult ? 'Launched' : launchError ? 'Failed' : 'Launching'}
          </span>

          <span style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {launchError
              ? launchError
              : launchResult
                ? <><span className="font-mono">{launchResult.mint.slice(0, 8)}...{launchResult.mint.slice(-4)}</span>
                    <a href={`https://pump.fun/coin/${launchResult.mint}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#14b8a6', textDecoration: 'underline', marginLeft: 8 }}>Pump.fun</a></>
                : activeStage
                  ? <>{doneCount > 0 && <span style={{ color: '#475569', marginRight: 6 }}>{doneCount} done</span>}{activeStage.message}</>
                  : lastDone?.message || '...'
            }
          </span>

          {(launchResult || launchError) && (
            <button className="btn-ghost" style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}
              onClick={onDismissLaunch}>
              Dismiss
            </button>
          )}
        </>
      ) : hasResult && actionResult ? (
        <>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: actionResult.recovered > 0 || actionResult.fees > 0 ? '#34d399' : '#94a3b8', flexShrink: 0 }} />
          <span style={{ color: '#94a3b8', flex: 1 }}>
            {actionResult.fees > 0 && `Fees: ${actionResult.fees.toFixed(6)} SOL · `}
            {actionResult.recovered > 0 && `Recovered: ${actionResult.recovered.toFixed(6)} SOL`}
            {actionResult.fees === 0 && actionResult.recovered === 0 && 'No fees or SOL to recover'}
            {actionResult.errors > 0 && ` (${actionResult.errors} failed)`}
          </span>
          <button className="btn-ghost" style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}
            onClick={onDismissResult}>Dismiss</button>
        </>
      ) : null}
    </div>
  )
}
