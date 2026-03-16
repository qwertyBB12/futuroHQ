import {useEffect, useRef, useState} from 'react'
import {Stack, Heading, Grid, Text, Flex} from '@sanity/ui'
import EcosystemHealthWidget from './EcosystemHealthWidget'
import RecentActivityWidget from './RecentActivityWidget'
import QuickActionsWidget from './QuickActionsWidget'
import EcosystemSitesWidget from './EcosystemSitesWidget'
import MyDraftsWidget from './MyDraftsWidget'
import PendingTasksWidget from './PendingTasksWidget'
import SeoHealthWidget from './SeoHealthWidget'
import EnrichmentProgressWidget from './EnrichmentProgressWidget'

// ─── Copper / Vermillion palette ───
const COPPER = '#B17E68'
const VERMILLION = '#C84841'
const SANDSTONE = '#F2E5D5'
const SLATE = '#8B8985'

// ─── Session gate: full boot sequence once per day ───
const BOOT_KEY = 'am-boot-ts'
const ONE_DAY = 24 * 60 * 60 * 1000

function shouldRunBoot(): boolean {
  try {
    const last = localStorage.getItem(BOOT_KEY)
    if (last && Date.now() - Number(last) < ONE_DAY) return false
    localStorage.setItem(BOOT_KEY, String(Date.now()))
    return true
  } catch {
    return true
  }
}

// ─── CSS Keyframes (injected once) ───
const STYLE_ID = 'am-dashboard-anims'
const KEYFRAMES = `
@keyframes am-radar-sweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes am-signal-acquire {
  0%    { opacity: 0; transform: translate(0,0); }
  4%    { opacity: 0.8; transform: translate(3px,-2px); }
  8%    { opacity: 0; transform: translate(-2px,1px); }
  14%   { opacity: 0.6; transform: translate(1px,2px); }
  20%   { opacity: 0; }
  26%   { opacity: 0.9; transform: translate(-3px,-1px); }
  32%   { opacity: 0.1; transform: translate(2px,0); }
  38%   { opacity: 0; }
  44%   { opacity: 1; transform: translate(1px,-1px); }
  50%   { opacity: 0; }
  56%   { opacity: 0.85; transform: translate(-1px,0); }
  62%   { opacity: 0.9; }
  68%   { opacity: 0.1; transform: translate(1px,0); }
  74%   { opacity: 1; transform: translate(0,0); }
  80%   { opacity: 0.05; }
  86%   { opacity: 0.95; }
  92%   { opacity: 1; }
  100%  { opacity: 1; transform: translate(0,0); }
}
@keyframes am-phosphor-breathe {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.08; }
}
@keyframes am-arrow-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
@keyframes am-eyebrow-blink {
  0%, 49% { border-right-color: ${COPPER}; }
  50%, 100% { border-right-color: transparent; }
}
`

function CommandMark({boot}: {boot: boolean}) {
  const [phase, setPhase] = useState<'acquire' | 'locked'>(boot ? 'acquire' : 'locked')
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Inject keyframes once
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style')
      style.id = STYLE_ID
      style.textContent = KEYFRAMES
      document.head.appendChild(style)
    }

    if (!boot) return
    // Phase 1: signal acquisition (2.4s), then lock on
    const timer = setTimeout(() => setPhase('locked'), 2400)
    return () => clearTimeout(timer)
  }, [boot])

  return (
    <div
      style={{
        position: 'relative',
        width: 64,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {/* Radar sweep ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1px solid ${phase === 'acquire' ? `${VERMILLION}33` : `${COPPER}22`}`,
          overflow: 'hidden',
          transition: 'border-color 0.6s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent 0deg, transparent 330deg, ${COPPER}40 345deg, ${COPPER}66 355deg, ${COPPER}80 360deg)`,
            animation: phase === 'acquire' ? 'am-radar-sweep 2s linear infinite' : 'am-radar-sweep 8s linear infinite',
            transition: 'animation-duration 1s',
          }}
        />
      </div>

      {/* Inner ring */}
      <div
        style={{
          position: 'absolute',
          inset: 8,
          borderRadius: '50%',
          border: `1px solid ${COPPER}18`,
        }}
      />

      {/* Phosphor glow */}
      <div
        style={{
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COPPER}33 0%, transparent 70%)`,
          filter: 'blur(16px)',
          pointerEvents: 'none',
          animation: phase === 'locked' ? 'am-phosphor-breathe 4s ease-in-out infinite' : 'none',
          opacity: phase === 'acquire' ? 0.3 : undefined,
        }}
      />

      {/* Arrow mark */}
      <img
        ref={imgRef}
        src="/static/logo-benext.png"
        alt=""
        width={36}
        height={36}
        style={{
          position: 'relative',
          zIndex: 1,
          objectFit: 'contain',
          filter: `drop-shadow(0 0 12px ${COPPER}40)`,
          animation:
            phase === 'acquire'
              ? 'am-signal-acquire 2.4s step-end forwards'
              : 'am-arrow-breathe 5s ease-in-out infinite',
        }}
      />
    </div>
  )
}

function SecureEyebrow({boot}: {boot: boolean}) {
  const full = 'SECURE CHANNEL ESTABLISHED'
  const [text, setText] = useState(boot ? '' : full)
  const [typing, setTyping] = useState(false)
  const [done, setDone] = useState(!boot)

  useEffect(() => {
    if (!boot) return
    // Start typing after signal locks (3s total: 2.4s acquire + 0.6s pause)
    const startTimer = setTimeout(() => {
      setTyping(true)
      let i = 0
      const interval = setInterval(() => {
        i++
        setText(full.slice(0, i))
        if (i >= full.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, 50)
      return () => clearInterval(interval)
    }, 3000)
    return () => clearTimeout(startTimer)
  }, [boot])

  if (!typing && !done) {
    return <div style={{height: 14}} />
  }

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        fontSize: 10,
        letterSpacing: '0.18em',
        color: done ? `${COPPER}88` : `${VERMILLION}88`,
        borderRight:
          !done ? `2px solid ${COPPER}` : '2px solid transparent',
        animation: !done ? 'am-eyebrow-blink 0.6s step-end infinite' : 'none',
        display: 'inline-block',
        paddingRight: 2,
        marginTop: 2,
      }}
    >
      {text}
    </div>
  )
}

export default function DashboardLayout() {
  const [boot] = useState(() => shouldRunBoot())

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2.5rem',
        background: 'transparent',
      }}
    >
      <Stack space={5} style={{maxWidth: 1200, margin: '0 auto'}}>
        {/* Header — Command Center */}
        <Flex align="center" gap={4}>
          <CommandMark boot={boot} />
          <Stack space={2}>
            <Heading
              size={3}
              style={{
                fontFamily: "'Oswald', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Autori Mandatum
            </Heading>
            <Flex align="center" gap={3}>
              <Text
                size={1}
                muted
                style={{
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontSize: 11,
                }}
              >
                Ecosystem Command Center
              </Text>
              <SecureEyebrow boot={boot} />
            </Flex>
          </Stack>
        </Flex>

        {/* Top row — Writer's focus */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <MyDraftsWidget />
          <QuickActionsWidget />
        </Grid>

        {/* Middle row — Activity & Tasks */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <RecentActivityWidget />
          <PendingTasksWidget />
        </Grid>

        {/* Bottom row — Ecosystem overview */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <EcosystemHealthWidget />
          <SeoHealthWidget />
        </Grid>

        {/* Enrichment row — content production tracking */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <EnrichmentProgressWidget />
        </Grid>

        {/* Sites row */}
        <Grid columns={[1, 1, 2]} gap={4}>
          <EcosystemSitesWidget />
        </Grid>
      </Stack>
    </div>
  )
}
