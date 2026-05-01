import { useEffect, useState, useCallback, memo, useMemo } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  Trophy,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Search,
  X,
  CircleDot,
  Star,
  Zap,
  CalendarClock,
  Goal,
  Square,
  ArrowLeftRight,
  AlertCircle,
  Pin,
  BarChart3,
  Settings,
  TrendingUp,
  ListFilter,
} from 'lucide-react'
import { sportService } from '../services/sportService'
import { useCouponStore } from '../store/couponStore'
import { useTapHold } from '../hooks/useTapHold'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ==================== HELPERS ====================
const TeamLogo = memo(({ src, name, size = 'sm' }) => {
  const [error, setError] = useState(false)
  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-10 h-10' : 'w-7 h-7'

  if (!src || error) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-gray-400 font-bold border border-gray-600`}>
        <span className={size === 'lg' ? 'text-lg' : size === 'md' ? 'text-sm' : 'text-[10px]'}>
          {name?.substring(0, 2).toUpperCase()}
        </span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} object-contain rounded-full bg-white/90 p-0.5 border border-gray-600`}
      onError={() => setError(true)}
    />
  )
})
TeamLogo.displayName = 'TeamLogo'

const StatusBadge = ({ status, elapsed }) => {
  if (status === 'live') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[11px] font-bold uppercase">
        <CircleDot className="w-3 h-3 animate-pulse" />
        {elapsed ? `${elapsed}'` : 'Live'}
      </span>
    )
  }
  if (status === 'finished') {
    return <span className="px-2 py-0.5 bg-gray-600/30 text-gray-400 rounded text-[11px] font-semibold">Termine</span>
  }
  return null
}

// ==================== ODD BUTTON (tap=pari direct, hold=coupon) ====================
const OddButton = ({ selection, selected, disabled, variant = 'inline', flash, children }) => {
  const navigate = useNavigate()
  const toggleOdd = useCouponStore((s) => s.toggleOdd)
  const placeSingle = useCouponStore((s) => s.placeSingle)

  const onTap = () => {
    if (disabled) return
    const entry = placeSingle(selection)
    toast.success(`Pari direct place ! Gain potentiel: ${Math.round(entry.gain)} FCFA`)
  }
  const onHold = () => {
    if (disabled) return
    toggleOdd(selection)
    toast.success('Ajoute au coupon', { icon: '🎫', duration: 1500 })
  }
  const handlers = useTapHold(onTap, onHold)

  const flashRing =
    flash === 'up'   ? 'ring-2 ring-emerald-400/80 shadow-emerald-400/40 shadow-lg' :
    flash === 'down' ? 'ring-2 ring-red-400/80 shadow-red-400/40 shadow-lg' : ''

  return (
    <button
      {...handlers}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      className={
        (variant === 'inline'
          ? `w-12 py-1.5 border rounded text-center transition-all active:scale-95 disabled:opacity-40 select-none ${
              selected ? 'bg-casino-gold/20 border-casino-gold' : 'bg-dark-300/60 border-gray-700/50 hover:border-casino-purple/50 hover:bg-dark-200'
            }`
          : `flex flex-col items-center py-2 px-1 rounded-lg border transition-all active:scale-95 disabled:opacity-40 select-none ${
              selected ? 'bg-casino-gold/20 border-casino-gold shadow-lg shadow-casino-gold/10' : 'bg-dark-300/50 border-gray-700/30 hover:border-casino-purple/50 hover:bg-dark-200/50'
            }`) + ' ' + flashRing
      }
    >
      {children}
    </button>
  )
}

// ==================== MATCH ROW ====================
const MatchRow = memo(({ match, onShowDetail }) => {
  const items = useCouponStore((s) => s.items)
  const matchTime = match.date ? new Date(match.date) : null
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const hasScore = match.home_score !== null && match.away_score !== null
  const odds = match.odds || {}

  const isSel = (type, choice) => items.some((c) => c.matchId === match.id && c.type === type && c.choice === choice)
  const matchLocked = isFinished

  const buildSel = (label, choice, value) => ({
    matchId: match.id,
    matchLabel: `${match.home_team} vs ${match.away_team}`,
    league: match.league?.name,
    sport: match.sport,
    type: 'result',
    choice,
    label,
    odd: value,
  })

  const oddItems = [
    { label: '1', choice: 'home_win', value: odds['1'] },
    { label: 'X', choice: 'draw', value: odds['X'] },
    { label: '2', choice: 'away_win', value: odds['2'] },
  ]

  return (
    <div
      onClick={() => onShowDetail(match)}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all border-b border-gray-800/50 last:border-b-0 ${
        isLive ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-gray-800/40'
      }`}
    >
      <div className="w-14 flex-shrink-0 text-center">
        {isLive ? (
          <StatusBadge status="live" elapsed={match.elapsed} />
        ) : isFinished ? (
          <StatusBadge status="finished" />
        ) : matchTime ? (
          <div>
            <div className="text-sm font-bold text-white">{format(matchTime, 'HH:mm')}</div>
            <div className="text-[10px] text-gray-500">{format(matchTime, 'dd MMM', { locale: fr })}</div>
          </div>
        ) : (
          <span className="text-xs text-gray-500">--:--</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <TeamLogo src={match.home_logo} name={match.home_team} />
          <span className={`text-sm truncate ${isLive ? 'text-white font-semibold' : 'text-gray-200'}`}>{match.home_team}</span>
          {hasScore && (
            <span className={`ml-auto text-sm font-bold flex-shrink-0 ${match.home_score > match.away_score ? 'text-casino-gold' : 'text-gray-400'}`}>
              {match.home_score}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TeamLogo src={match.away_logo} name={match.away_team} />
          <span className={`text-sm truncate ${isLive ? 'text-white font-semibold' : 'text-gray-200'}`}>{match.away_team}</span>
          {hasScore && (
            <span className={`ml-auto text-sm font-bold flex-shrink-0 ${match.away_score > match.home_score ? 'text-casino-gold' : 'text-gray-400'}`}>
              {match.away_score}
            </span>
          )}
        </div>
      </div>

      {(odds['1'] || odds['X'] || odds['2']) && (
        <div className="flex gap-1 flex-shrink-0">
          {oddItems.map(({ label, choice, value }) => {
            const selected = isSel('result', choice)
            const sel = buildSel(`${label} - ${choice === 'home_win' ? match.home_team : choice === 'away_win' ? match.away_team : 'Nul'}`, choice, value)
            return (
              <OddButton key={label} selection={sel} selected={selected} disabled={!value || matchLocked} variant="inline">
                <div className="text-[10px] text-gray-500 leading-none">{label}</div>
                <div className={`text-xs font-bold leading-tight ${selected ? 'text-casino-gold' : 'text-white'}`}>
                  {value?.toFixed(2) || '-'}
                </div>
              </OddButton>
            )
          })}
        </div>
      )}

      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
    </div>
  )
})
MatchRow.displayName = 'MatchRow'

// ==================== MATCH DETAIL MODAL ====================
const EventIcon = ({ kind, detail }) => {
  if (kind === 'goal') return <Goal className="w-3.5 h-3.5 text-casino-gold" />
  if (kind === 'card') {
    const yellow = (detail || '').toLowerCase().includes('yellow')
    return <Square className={`w-3 h-3 ${yellow ? 'text-yellow-400' : 'text-red-500'} fill-current`} />
  }
  if (kind === 'subst') return <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
  if (kind === 'var')   return <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
  return <CircleDot className="w-3 h-3 text-gray-500" />
}

function MatchEventsTimeline({ match }) {
  const events = match?.events || []
  if (!events.length) return null
  const homeId = match.home_id

  return (
    <div className="bg-dark-300/30 rounded-xl overflow-hidden border border-gray-800/30">
      <div className="px-3 py-1.5 bg-dark-200/50 border-b border-gray-800/30">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Evenements</span>
      </div>
      <div className="p-2 space-y-1.5">
        {events.map((e, i) => {
          const isHome = homeId && e.team_id === homeId
          const minute = e.minute != null ? `${e.minute}${e.extra ? `+${e.extra}` : ''}'` : '-'
          const label = [e.player, e.assist && `(${e.assist})`].filter(Boolean).join(' ')
          return (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs ${isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}
            >
              <span className={`w-9 flex-shrink-0 text-[10px] font-bold ${isHome ? 'text-left' : 'text-right'} text-casino-gold`}>{minute}</span>
              <EventIcon kind={e.kind} detail={e.detail} />
              <div className={`flex-1 min-w-0 ${isHome ? '' : 'text-right'}`}>
                <div className="text-white truncate text-[11px]">{label || e.detail || e.kind}</div>
                {e.detail && label && <div className="text-[9px] text-gray-500 truncate">{e.detail}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==================== MARKET BUILDER (1xBet style: many markets per period) ====================
const buildMarkets = (match, period) => {
  const odds = match.odds || {}
  const h = match.home_team
  const a = match.away_team

  // Filter only markets that have at least one defined odd; preserve oddKey
  // so the live-update layer can map raw key changes onto buttons.
  const M = (def) => ({ ...def, items: def.items.filter((i) => i.odd != null) })

  if (period === 'ht') {
    return [
      M({
        id: 'ht_1x2',
        title: '1X2 - 1ere mi-temps',
        cols: 3,
        cat: 'main',
        defaultOpen: true,
        items: [
          { label: `1 - ${h}`, type: 'ht_result', choice: 'home_win', oddKey: 'ht_1', odd: odds['ht_1'] },
          { label: 'X - Nul', type: 'ht_result', choice: 'draw', oddKey: 'ht_X', odd: odds['ht_X'] },
          { label: `2 - ${a}`, type: 'ht_result', choice: 'away_win', oddKey: 'ht_2', odd: odds['ht_2'] },
        ],
      }),
      M({
        id: 'ht_total',
        title: 'Total buts - 1ere mi-temps',
        cols: 2,
        cat: 'totals',
        defaultOpen: true,
        items: [
          { label: 'Plus de 0.5', type: 'ht_over_under', choice: 'over_0_5', oddKey: 'ht_+0.5', odd: odds['ht_+0.5'] },
          { label: 'Moins de 0.5', type: 'ht_over_under', choice: 'under_0_5', oddKey: 'ht_-0.5', odd: odds['ht_-0.5'] },
          { label: 'Plus de 1.5', type: 'ht_over_under', choice: 'over_1_5', oddKey: 'ht_+1.5', odd: odds['ht_+1.5'] },
          { label: 'Moins de 1.5', type: 'ht_over_under', choice: 'under_1_5', oddKey: 'ht_-1.5', odd: odds['ht_-1.5'] },
        ],
      }),
    ].filter((m) => m.items.length)
  }

  if (period === 'st') {
    return [
      M({
        id: 'st_1x2',
        title: '1X2 - 2eme mi-temps',
        cols: 3,
        cat: 'main',
        defaultOpen: true,
        items: [
          { label: `1 - ${h}`, type: 'st_result', choice: 'home_win', oddKey: 'st_1', odd: odds['st_1'] },
          { label: 'X - Nul', type: 'st_result', choice: 'draw', oddKey: 'st_X', odd: odds['st_X'] },
          { label: `2 - ${a}`, type: 'st_result', choice: 'away_win', oddKey: 'st_2', odd: odds['st_2'] },
        ],
      }),
    ].filter((m) => m.items.length)
  }

  if (period === 'corners') {
    return [
      M({
        id: 'corners_1x2',
        title: 'Corners - 1X2',
        cols: 3,
        cat: 'main',
        defaultOpen: true,
        pinned: true,
        items: [
          { label: `1 - ${h}`, type: 'corners_1x2', choice: 'home_win', odd: odds['corners_1'] },
          { label: 'X', type: 'corners_1x2', choice: 'draw', odd: odds['corners_X'] },
          { label: `2 - ${a}`, type: 'corners_1x2', choice: 'away_win', odd: odds['corners_2'] },
        ],
      }),
      M({
        id: 'corners_ou',
        title: 'Corners - Total',
        cols: 2,
        cat: 'totals',
        defaultOpen: true,
        items: [
          { label: 'Plus de 8.5', type: 'corners_ou', choice: 'over_8_5', odd: odds['corners_+8.5'] },
          { label: 'Moins de 8.5', type: 'corners_ou', choice: 'under_8_5', odd: odds['corners_-8.5'] },
          { label: 'Plus de 9.5', type: 'corners_ou', choice: 'over_9_5', odd: odds['corners_+9.5'] },
          { label: 'Moins de 9.5', type: 'corners_ou', choice: 'under_9_5', odd: odds['corners_-9.5'] },
          { label: 'Plus de 10.5', type: 'corners_ou', choice: 'over_10_5', odd: odds['corners_+10.5'] },
          { label: 'Moins de 10.5', type: 'corners_ou', choice: 'under_10_5', odd: odds['corners_-10.5'] },
        ],
      }),
    ].filter((m) => m.items.length)
  }

  if (period === 'cards') {
    return [
      M({
        id: 'cards_ou',
        title: 'Cartons - Total',
        cols: 2,
        cat: 'main',
        defaultOpen: true,
        pinned: true,
        items: [
          { label: 'Plus de 2.5', type: 'cards_ou', choice: 'over_2_5', odd: odds['cards_+2.5'] },
          { label: 'Moins de 2.5', type: 'cards_ou', choice: 'under_2_5', odd: odds['cards_-2.5'] },
          { label: 'Plus de 3.5', type: 'cards_ou', choice: 'over_3_5', odd: odds['cards_+3.5'] },
          { label: 'Moins de 3.5', type: 'cards_ou', choice: 'under_3_5', odd: odds['cards_-3.5'] },
          { label: 'Plus de 4.5', type: 'cards_ou', choice: 'over_4_5', odd: odds['cards_+4.5'] },
          { label: 'Moins de 4.5', type: 'cards_ou', choice: 'under_4_5', odd: odds['cards_-4.5'] },
        ],
      }),
    ].filter((m) => m.items.length)
  }

  if (period === 'btts') {
    return [
      M({
        id: 'btts',
        title: 'Les deux equipes vont marquer',
        cols: 2,
        cat: 'main',
        defaultOpen: true,
        pinned: true,
        items: [
          { label: 'Oui', type: 'btts', choice: 'yes', odd: odds['btts_yes'] },
          { label: 'Non', type: 'btts', choice: 'no', odd: odds['btts_no'] },
        ],
      }),
    ].filter((m) => m.items.length)
  }

  if (period === 'htft') {
    return [
      M({
        id: 'htft',
        title: 'Mi-temps / Fin de match',
        cols: 3,
        cat: 'main',
        defaultOpen: true,
        pinned: true,
        items: [
          { label: '1 / 1', type: 'htft', choice: '11', odd: odds['htft_homehome'] },
          { label: '1 / X', type: 'htft', choice: '1X', odd: odds['htft_homedraw'] },
          { label: '1 / 2', type: 'htft', choice: '12', odd: odds['htft_homeaway'] },
          { label: 'X / 1', type: 'htft', choice: 'X1', odd: odds['htft_drawhome'] },
          { label: 'X / X', type: 'htft', choice: 'XX', odd: odds['htft_drawdraw'] },
          { label: 'X / 2', type: 'htft', choice: 'X2', odd: odds['htft_drawaway'] },
          { label: '2 / 1', type: 'htft', choice: '21', odd: odds['htft_awayhome'] },
          { label: '2 / X', type: 'htft', choice: '2X', odd: odds['htft_awaydraw'] },
          { label: '2 / 2', type: 'htft', choice: '22', odd: odds['htft_awayaway'] },
        ],
      }),
    ].filter((m) => m.items.length)
  }

  // Full time (default)
  return [
    M({
      id: '1x2',
      title: '1X2',
      cols: 3,
      cat: 'main',
      defaultOpen: true,
      pinned: true,
      items: [
        { label: 'V1', sub: h, type: 'result', choice: 'home_win', oddKey: '1', odd: odds['1'] },
        { label: 'X', sub: 'Nul', type: 'result', choice: 'draw', oddKey: 'X', odd: odds['X'] },
        { label: 'V2', sub: a, type: 'result', choice: 'away_win', oddKey: '2', odd: odds['2'] },
      ],
    }),
    M({
      id: 'double_chance',
      title: 'Double chance',
      cols: 3,
      cat: 'main',
      defaultOpen: true,
      pinned: true,
      items: [
        { label: '1X', type: 'double_chance', choice: '1X', oddKey: '1X', odd: odds['1X'] },
        { label: '12', type: 'double_chance', choice: '12', oddKey: '12', odd: odds['12'] },
        { label: '2X', type: 'double_chance', choice: 'X2', oddKey: 'X2', odd: odds['X2'] },
      ],
    }),
    M({
      id: 'btts',
      title: 'Les deux equipes vont marquer',
      cols: 2,
      cat: 'totals',
      defaultOpen: true,
      items: [
        { label: 'Oui', type: 'btts', choice: 'yes', oddKey: 'btts_yes', odd: odds['btts_yes'] },
        { label: 'Non', type: 'btts', choice: 'no', oddKey: 'btts_no', odd: odds['btts_no'] },
      ],
    }),
    M({
      id: 'total',
      title: 'Total buts',
      cols: 2,
      cat: 'totals',
      defaultOpen: true,
      pinned: true,
      items: [
        { label: 'Plus de 0.5', type: 'over_under', choice: 'over_0_5', oddKey: '+0.5', odd: odds['+0.5'] },
        { label: 'Moins de 0.5', type: 'over_under', choice: 'under_0_5', oddKey: '-0.5', odd: odds['-0.5'] },
        { label: 'Plus de 1.5', type: 'over_under', choice: 'over_1_5', oddKey: '+1.5', odd: odds['+1.5'] },
        { label: 'Moins de 1.5', type: 'over_under', choice: 'under_1_5', oddKey: '-1.5', odd: odds['-1.5'] },
        { label: 'Plus de 2.5', type: 'over_under', choice: 'over_2_5', oddKey: '+2.5', odd: odds['+2.5'] },
        { label: 'Moins de 2.5', type: 'over_under', choice: 'under_2_5', oddKey: '-2.5', odd: odds['-2.5'] },
        { label: 'Plus de 3.5', type: 'over_under', choice: 'over_3_5', oddKey: '+3.5', odd: odds['+3.5'] },
        { label: 'Moins de 3.5', type: 'over_under', choice: 'under_3_5', oddKey: '-3.5', odd: odds['-3.5'] },
        { label: 'Plus de 4.5', type: 'over_under', choice: 'over_4_5', oddKey: '+4.5', odd: odds['+4.5'] },
        { label: 'Moins de 4.5', type: 'over_under', choice: 'under_4_5', oddKey: '-4.5', odd: odds['-4.5'] },
        { label: 'Plus de 5.5', type: 'over_under', choice: 'over_5_5', oddKey: '+5.5', odd: odds['+5.5'] },
        { label: 'Moins de 5.5', type: 'over_under', choice: 'under_5_5', oddKey: '-5.5', odd: odds['-5.5'] },
      ],
    }),
    M({
      id: 'htft',
      title: 'Mi-temps / Fin de match',
      cols: 3,
      cat: 'combo',
      items: [
        { label: '1 / 1', type: 'htft', choice: '11', oddKey: 'htft_homehome', odd: odds['htft_homehome'] },
        { label: '1 / X', type: 'htft', choice: '1X', oddKey: 'htft_homedraw', odd: odds['htft_homedraw'] },
        { label: '1 / 2', type: 'htft', choice: '12', oddKey: 'htft_homeaway', odd: odds['htft_homeaway'] },
        { label: 'X / 1', type: 'htft', choice: 'X1', oddKey: 'htft_drawhome', odd: odds['htft_drawhome'] },
        { label: 'X / X', type: 'htft', choice: 'XX', oddKey: 'htft_drawdraw', odd: odds['htft_drawdraw'] },
        { label: 'X / 2', type: 'htft', choice: 'X2', oddKey: 'htft_drawaway', odd: odds['htft_drawaway'] },
        { label: '2 / 1', type: 'htft', choice: '21', oddKey: 'htft_awayhome', odd: odds['htft_awayhome'] },
        { label: '2 / X', type: 'htft', choice: '2X', oddKey: 'htft_awaydraw', odd: odds['htft_awaydraw'] },
        { label: '2 / 2', type: 'htft', choice: '22', oddKey: 'htft_awayaway', odd: odds['htft_awayaway'] },
      ],
    }),
    M({
      id: 'score_exact',
      title: 'Score exact',
      cols: 3,
      cat: 'combo',
      items: Object.keys(odds)
        .filter((k) => k.startsWith('score_'))
        .slice(0, 12)
        .map((k) => ({
          label: k.replace('score_', '').replace(':', ' - '),
          type: 'correct_score',
          choice: k.replace('score_', ''),
          oddKey: k,
          odd: odds[k],
        })),
    }),
    M({
      id: 'corners_ou',
      title: 'Corners - Total',
      cols: 2,
      cat: 'specials',
      items: [
        { label: 'Plus de 8.5', type: 'corners_ou', choice: 'over_8_5', oddKey: 'corners_+8.5', odd: odds['corners_+8.5'] },
        { label: 'Moins de 8.5', type: 'corners_ou', choice: 'under_8_5', oddKey: 'corners_-8.5', odd: odds['corners_-8.5'] },
        { label: 'Plus de 9.5', type: 'corners_ou', choice: 'over_9_5', oddKey: 'corners_+9.5', odd: odds['corners_+9.5'] },
        { label: 'Moins de 9.5', type: 'corners_ou', choice: 'under_9_5', oddKey: 'corners_-9.5', odd: odds['corners_-9.5'] },
        { label: 'Plus de 10.5', type: 'corners_ou', choice: 'over_10_5', oddKey: 'corners_+10.5', odd: odds['corners_+10.5'] },
        { label: 'Moins de 10.5', type: 'corners_ou', choice: 'under_10_5', oddKey: 'corners_-10.5', odd: odds['corners_-10.5'] },
      ],
    }),
    M({
      id: 'corners_1x2',
      title: 'Corners - 1X2',
      cols: 3,
      cat: 'specials',
      items: [
        { label: `1 - ${h}`, type: 'corners_1x2', choice: 'home_win', oddKey: 'corners_1', odd: odds['corners_1'] },
        { label: 'X', type: 'corners_1x2', choice: 'draw', oddKey: 'corners_X', odd: odds['corners_X'] },
        { label: `2 - ${a}`, type: 'corners_1x2', choice: 'away_win', oddKey: 'corners_2', odd: odds['corners_2'] },
      ],
    }),
    M({
      id: 'cards_ou',
      title: 'Cartons - Total',
      cols: 2,
      cat: 'specials',
      items: [
        { label: 'Plus de 2.5', type: 'cards_ou', choice: 'over_2_5', oddKey: 'cards_+2.5', odd: odds['cards_+2.5'] },
        { label: 'Moins de 2.5', type: 'cards_ou', choice: 'under_2_5', oddKey: 'cards_-2.5', odd: odds['cards_-2.5'] },
        { label: 'Plus de 3.5', type: 'cards_ou', choice: 'over_3_5', oddKey: 'cards_+3.5', odd: odds['cards_+3.5'] },
        { label: 'Moins de 3.5', type: 'cards_ou', choice: 'under_3_5', oddKey: 'cards_-3.5', odd: odds['cards_-3.5'] },
        { label: 'Plus de 4.5', type: 'cards_ou', choice: 'over_4_5', oddKey: 'cards_+4.5', odd: odds['cards_+4.5'] },
        { label: 'Moins de 4.5', type: 'cards_ou', choice: 'under_4_5', oddKey: 'cards_-4.5', odd: odds['cards_-4.5'] },
      ],
    }),
  ].filter((m) => m.items.length)
}

// ==================== MARKET SECTION (collapsible like 1xBet) ====================
const MarketSection = memo(({ market, isSel, buildSel, locked, defaultOpen, oddFlash }) => {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="bg-[#0f1923] rounded-lg overflow-hidden border border-gray-800/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800/30 transition-colors"
      >
        <span className="text-[13px] font-semibold text-white text-left flex-1 truncate">{market.title}</span>
        {market.items.length > 1 && (
          <span className="text-[11px] text-gray-500 font-medium">({market.items.length})</span>
        )}
        <Pin className={`w-3.5 h-3.5 ${market.pinned ? 'text-blue-400 fill-blue-400/30' : 'text-gray-600'}`} />
        {open ? (
          <ChevronUp className="w-4 h-4 text-blue-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {open && (
        <div
          className="grid gap-1.5 p-2 pt-0"
          style={{ gridTemplateColumns: `repeat(${market.cols}, 1fr)` }}
        >
          {market.items.map((item) => {
            const sel = isSel(item.type, item.choice)
            const selection = buildSel(item.label + (item.sub ? ` - ${item.sub}` : ''), item.type, item.choice, item.odd)
            return (
              <OddButton
                key={`${item.type}-${item.choice}`}
                selection={selection}
                selected={sel}
                disabled={!item.odd || locked}
                variant="grid"
                flash={item.oddKey ? oddFlash?.[item.oddKey] : undefined}
              >
                <span className="text-[10px] text-gray-400 leading-tight text-center truncate w-full">
                  {item.label}
                </span>
                {item.sub && (
                  <span className="text-[9px] text-gray-600 leading-none truncate w-full text-center">
                    {item.sub.length > 12 ? item.sub.substring(0, 11) + '.' : item.sub}
                  </span>
                )}
                <span className={`text-sm font-bold mt-0.5 ${sel ? 'text-casino-gold' : 'text-white'}`}>
                  {item.odd?.toFixed(3) || '-'}
                </span>
              </OddButton>
            )
          })}
        </div>
      )}
    </div>
  )
})
MarketSection.displayName = 'MarketSection'

// ==================== MATCH DETAIL MODAL (1xBet-like full-page detail) ====================
const PERIOD_TABS = [
  { key: 'ft', label: 'Temps reglementaire' },
  { key: 'ht', label: '1ere mi-temps' },
  { key: 'st', label: '2eme mi-temps' },
  { key: 'corners', label: 'Corners' },
  { key: 'cards', label: 'Cartons' },
  { key: 'btts', label: 'Les 2 marquent' },
  { key: 'htft', label: 'MT / Fin' },
]

const CATEGORY_CHIPS = [
  { key: 'all', label: 'Populaires', icon: Settings },
  { key: 'totals', label: 'Resultat + Total', icon: TrendingUp },
  { key: 'specials', label: 'Marches asiatiques', icon: BarChart3 },
]

const MatchDetailModal = ({ match: initialMatch, onClose }) => {
  if (!initialMatch) return null
  const items = useCouponStore((s) => s.items)
  const [now, setNow] = useState(Date.now())
  const [match, setMatch] = useState(initialMatch)
  const [detailLoading, setDetailLoading] = useState(false)
  const [period, setPeriod] = useState('ft')
  const [category, setCategory] = useState('all')
  // Map of "type:choice" -> 'up' | 'down' tracking the last odd movement.
  const [oddFlash, setOddFlash] = useState({})

  // Fetch full detail once on open if we don't already have odds/events.
  useEffect(() => {
    if (!initialMatch?.id || !initialMatch?.sport) return
    if (initialMatch.events && Object.keys(initialMatch.odds || {}).length) return
    let cancelled = false
    setDetailLoading(true)
    sportService
      .getMatchDetail(initialMatch.id, initialMatch.sport)
      .then((res) => {
        if (cancelled) return
        if (res?.data) setMatch({ ...initialMatch, ...res.data })
      })
      .catch(() => {})
      .finally(() => !cancelled && setDetailLoading(false))
    return () => {
      cancelled = true
    }
  }, [initialMatch?.id, initialMatch?.sport])

  // Live refresh: poll backend every 8s while live so score + odds update in
  // real time. We diff the new odds vs current and produce a transient flash.
  useEffect(() => {
    if (!match?.id || !match?.sport) return
    if (match.status === 'finished') return
    const isLive = match.status === 'live'
    const intervalMs = isLive ? 8000 : 45000
    let cancelled = false
    const tick = () => {
      sportService
        .getMatchDetail(match.id, match.sport)
        .then((res) => {
          if (cancelled || !res?.data) return
          const next = res.data
          const prevOdds = match.odds || {}
          const nextOdds = next.odds || {}
          const flashes = {}
          for (const k of Object.keys(nextOdds)) {
            const a = prevOdds[k]
            const b = nextOdds[k]
            if (a == null || b == null) continue
            if (Math.abs(a - b) < 0.005) continue
            flashes[k] = b > a ? 'up' : 'down'
          }
          setMatch((m) => ({ ...m, ...next }))
          if (Object.keys(flashes).length) {
            setOddFlash(flashes)
            setTimeout(() => !cancelled && setOddFlash({}), 1800)
          }
        })
        .catch(() => {})
    }
    const id = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [match?.id, match?.sport, match?.status])

  const matchTime = match.date ? new Date(match.date) : null
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const hasScore = match.home_score !== null && match.away_score !== null

  useEffect(() => {
    if (!matchTime || isLive || isFinished) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [matchTime, isLive, isFinished])

  const diff = matchTime ? matchTime.getTime() - now : 0
  const days = Math.max(0, Math.floor(diff / 86400000))
  const hours = Math.max(0, Math.floor((diff % 86400000) / 3600000))
  const mins = Math.max(0, Math.floor((diff % 3600000) / 60000))
  const secs = Math.max(0, Math.floor((diff % 60000) / 1000))

  const isSel = (type, choice) =>
    items.some((c) => c.matchId === match.id && c.type === type && c.choice === choice)

  const buildSel = (label, type, choice, odd) => ({
    matchId: match.id,
    matchLabel: `${match.home_team} vs ${match.away_team}`,
    league: match.league?.name,
    sport: match.sport,
    type,
    choice,
    label,
    odd,
  })

  const h = match.home_team
  const a = match.away_team
  const matchLocked = isFinished

  const allMarkets = useMemo(() => buildMarkets(match, period), [match, period])
  const visibleMarkets = useMemo(() => {
    if (category === 'all') return allMarkets
    return allMarkets.filter((m) => m.cat === category || m.cat === 'main')
  }, [allMarkets, category])

  // Period counts (for badges in tabs)
  const periodCounts = useMemo(() => {
    const counts = {}
    PERIOD_TABS.forEach((t) => {
      counts[t.key] = buildMarkets(match, t.key).reduce((acc, m) => acc + m.items.length, 0)
    })
    return counts
  }, [match])

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-stretch sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="bg-gradient-to-b from-[#0a141d] to-[#070d14] w-full sm:max-w-2xl sm:rounded-2xl sm:max-h-[95vh] h-screen sm:h-auto overflow-hidden border-0 sm:border sm:border-gray-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============== TOP BAR ============== */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-3 bg-[#162232] border-b border-gray-800/50">
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div className="flex-1 text-center min-w-0">
            <div className="text-sm font-bold text-white truncate leading-tight">
              {match.sport === 'football' ? 'Football' : match.sport || 'Sport'}{match.league?.name ? `. ${match.league.name}` : ''}
            </div>
          </div>
          <button className="p-1 hover:bg-white/10 rounded-lg" title="Eclair">
            <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* ============== TEAMS HEADER ============== */}
        <div className="flex-shrink-0 px-4 py-4 bg-gradient-to-b from-[#1a2942] to-[#0d1a2b]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center flex-1 text-center min-w-0">
              <TeamLogo src={match.home_logo} name={h} size="lg" />
              <span className="text-[11px] font-bold text-white mt-1.5 leading-tight line-clamp-2">{h}</span>
            </div>
            <div className="flex flex-col items-center px-2 flex-shrink-0">
              {hasScore ? (
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${match.home_score > match.away_score ? 'text-casino-gold' : 'text-white'}`}>
                    {match.home_score}
                  </span>
                  <span className="text-lg text-gray-600">:</span>
                  <span className={`text-3xl font-bold ${match.away_score > match.home_score ? 'text-casino-gold' : 'text-white'}`}>
                    {match.away_score}
                  </span>
                </div>
              ) : (
                <span className="text-base font-bold text-gray-400 tracking-wider">VS</span>
              )}
              {isLive && (
                <span className="mt-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">
                  {match.elapsed ? `${match.elapsed}'` : 'EN DIRECT'}
                </span>
              )}
              {isFinished && (
                <span className="mt-1 text-[10px] text-gray-500 font-semibold">TERMINE</span>
              )}
            </div>
            <div className="flex flex-col items-center flex-1 text-center min-w-0">
              <TeamLogo src={match.away_logo} name={a} size="lg" />
              <span className="text-[11px] font-bold text-white mt-1.5 leading-tight line-clamp-2">{a}</span>
            </div>
          </div>

          {matchTime && !isLive && !isFinished && diff > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-300">
              <span className="text-gray-500">Jours jusqu'au debut :</span>
              <span className="font-mono font-bold text-white">
                {days} {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            </div>
          )}
          {matchTime && (
            <div className="text-center text-[10px] text-gray-500 mt-1">
              {format(matchTime, 'dd.MM.yyyy (HH:mm)', { locale: fr })}
            </div>
          )}
        </div>

        {/* ============== CATEGORY CHIPS ============== */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 overflow-x-auto scrollbar-hide bg-[#0a141d] border-b border-gray-800/40">
          {CATEGORY_CHIPS.map((c) => {
            const Icon = c.icon
            const active = category === c.key
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#172633] text-gray-400 border border-gray-700/50 hover:border-gray-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>

        {/* ============== PERIOD TABS (scrollable horizontalement) ============== */}
        <div className="flex-shrink-0 flex items-stretch bg-[#0a141d] border-b border-gray-800/50">
          <button className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-300 border-r border-gray-800/50">
            <ListFilter className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center overflow-x-auto scrollbar-hide">
            {PERIOD_TABS.map((t) => {
              const active = period === t.key
              const cnt = periodCounts[t.key]
              if (cnt === 0 && !active) return null
              return (
                <button
                  key={t.key}
                  onClick={() => setPeriod(t.key)}
                  className={`flex-shrink-0 relative px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    active ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span>{t.label}</span>
                  {cnt > 0 && !active && (
                    <span className="ml-1 text-[10px] text-gray-600">({cnt})</span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="periodIndicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-400 rounded-full"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ============== SCROLLABLE CONTENT ============== */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#070d14]">
          {!matchLocked && (
            <div className="px-2 py-1.5 bg-casino-gold/5 border border-casino-gold/20 rounded-lg">
              <p className="text-[10px] text-casino-gold text-center">
                <span className="font-bold">Tape</span> sur une cote pour parier directement,{' '}
                <span className="font-bold">maintien</span> pour ajouter au coupon
              </p>
            </div>
          )}
          {matchLocked && (
            <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <p className="text-xs text-red-400 font-bold">Match termine - paris fermes</p>
            </div>
          )}

          {detailLoading && (
            <div className="flex items-center justify-center py-2 text-[11px] text-gray-500 gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Chargement des details...
            </div>
          )}

          <MatchEventsTimeline match={match} />

          {visibleMarkets.length === 0 ? (
            <div className="text-center py-12 bg-[#0f1923] rounded-lg border border-gray-800/40">
              <BarChart3 className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Aucun marche disponible pour cette periode</p>
              {period !== 'ft' && (
                <button
                  onClick={() => setPeriod('ft')}
                  className="mt-2 text-xs text-blue-400 hover:underline"
                >
                  Voir Temps reglementaire
                </button>
              )}
            </div>
          ) : (
            visibleMarkets.map((market) => (
              <MarketSection
                key={market.id}
                market={market}
                isSel={isSel}
                buildSel={buildSel}
                locked={matchLocked}
                defaultOpen={market.defaultOpen}
                oddFlash={oddFlash}
              />
            ))
          )}

          <div className="h-2" />
        </div>
      </motion.div>
    </div>
  )
}

// ==================== SPORTS GRID ====================
function SportsGrid() {
  const [sports, setSports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sportService
      .getSports()
      .then((res) => setSports(res?.data || []))
      .catch(() => setSports([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-4">Choisis un sport</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {sports.map((s) => (
          <Link
            key={s.slug}
            to={`/sports?sport=${s.slug}`}
            className="bg-gradient-to-br from-dark-200 to-dark-300 border border-gray-800/50 rounded-xl p-4 hover:border-casino-gold/50 transition-all hover:-translate-y-1"
          >
            <div className="text-4xl mb-2">{s.icon}</div>
            <div className="text-sm font-bold text-white mb-1">{s.name}</div>
            <div className="text-[10px] text-gray-500">{s.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ==================== LEAGUES + LIVE (1xBet style: EN DIRECT / AVANT-MATCH tabs) ====================
const TIME_WINDOWS = [
  { key: 'all', label: 'Tout', ms: null },
  { key: '30m', label: '30 minutes', ms: 30 * 60 * 1000 },
  { key: '1h', label: '1 heure', ms: 60 * 60 * 1000 },
  { key: '2h', label: '2 heures', ms: 2 * 60 * 60 * 1000 },
]

function LeaguesAndLive({ sportSlug, onShowDetail }) {
  const [leagues, setLeagues] = useState([])
  const [live, setLive] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('live')
  const [timeFilter, setTimeFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, liveRes, upRes] = await Promise.all([
        sportService.getLeagues(sportSlug).catch(() => ({ data: [] })),
        sportService.getLiveFixtures(sportSlug).catch(() => ({ data: [] })),
        sportService.getMatches(sportSlug).catch(() => ({ data: [] })),
      ])
      setLeagues(lRes?.data || [])
      setLive(liveRes?.data || [])
      setUpcoming(upRes?.data || [])
    } finally {
      setLoading(false)
    }
  }, [sportSlug])

  useEffect(() => {
    load()
    const interval = setInterval(() => {
      sportService
        .getLiveFixtures(sportSlug)
        .then((r) => setLive(r?.data || []))
        .catch(() => {})
    }, 12000)
    return () => clearInterval(interval)
  }, [load, sportSlug])

  // count of live matches per league id
  const liveCountByLeague = useMemo(() => {
    const map = {}
    live.forEach((m) => {
      const id = m.league?.id
      if (id) map[id] = (map[id] || 0) + 1
    })
    return map
  }, [live])

  // count of upcoming matches per league id, optionally filtered by start-time window
  const upcomingCountByLeague = useMemo(() => {
    const map = {}
    const win = TIME_WINDOWS.find((w) => w.key === timeFilter)
    const now = Date.now()
    upcoming.forEach((m) => {
      if (m.status === 'live' || m.status === 'finished') return
      const id = m.league?.id
      if (!id) return
      if (win?.ms) {
        const t = m.date ? new Date(m.date).getTime() : 0
        if (!t || t < now || t - now > win.ms) return
      }
      map[id] = (map[id] || 0) + 1
    })
    return map
  }, [upcoming, timeFilter])

  // Country list filtered by tab (live vs prematch) and search
  const countries = useMemo(() => {
    const q = search.trim().toLowerCase()
    const countMap = tab === 'live' ? liveCountByLeague : upcomingCountByLeague
    const onlyWithCount = tab === 'live' || timeFilter !== 'all'

    return leagues
      .map((c) => ({
        ...c,
        leagues: c.leagues
          .map((l) => ({ ...l, count: countMap[l.id] || 0 }))
          .filter((l) => {
            if (onlyWithCount && l.count === 0) return false
            if (!q) return true
            return l.name?.toLowerCase().includes(q) || c.country?.toLowerCase().includes(q)
          }),
      }))
      .filter((c) => c.leagues.length > 0)
  }, [leagues, tab, timeFilter, liveCountByLeague, upcomingCountByLeague, search])

  const totalLeagues = countries.reduce((acc, c) => acc + c.leagues.length, 0)
  const liveTotal = live.length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {/* Tabs EN DIRECT / AVANT-MATCH */}
      <div className="flex bg-[#0f1923] rounded-full p-1 border border-gray-800/50">
        <button
          onClick={() => setTab('live')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-bold transition-all ${
            tab === 'live' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>EN DIRECT</span>
          {liveTotal > 0 && (
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${tab === 'live' ? 'bg-white/20' : 'bg-red-500/20 text-red-400'}`}>
              {liveTotal}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('prematch')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-bold transition-all ${
            tab === 'prematch' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Avant-match</span>
        </button>
      </div>

      {/* Time-window chips - only on Avant-match */}
      {tab === 'prematch' && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.key}
              onClick={() => setTimeFilter(w.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                timeFilter === w.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#0f1923] text-gray-400 border border-gray-800/50 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un championnat..."
          className="w-full pl-10 pr-3 py-2 bg-[#172633] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
        />
      </div>

      {/* Header bar */}
      <div className="flex items-center gap-2 px-1">
        {tab === 'live' ? (
          <CircleDot className={`w-4 h-4 ${liveTotal > 0 ? 'text-red-400 animate-pulse' : 'text-gray-600'}`} />
        ) : (
          <Trophy className="w-4 h-4 text-casino-gold" />
        )}
        <h2 className="text-base font-bold text-white">
          {tab === 'live' ? 'Championnats avec matchs en direct' : 'Championnats'}
        </h2>
        <span className="ml-auto text-xs text-gray-500">{totalLeagues}</span>
      </div>

      {/* Countries / leagues list */}
      <div className="bg-[#0f1923] rounded-lg border border-gray-800/50 overflow-hidden">
        {countries.length === 0 ? (
          <div className="text-center py-12">
            {tab === 'live' ? (
              <>
                <CircleDot className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucun championnat en direct</p>
              </>
            ) : (
              <>
                <Trophy className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Aucun championnat</p>
              </>
            )}
          </div>
        ) : (
          countries.map((country) => (
            <CountryGroup key={country.country} country={country} sportSlug={sportSlug} mode={tab} />
          ))
        )}
      </div>

      {/* Inline live matches preview when on EN DIRECT */}
      {tab === 'live' && live.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 px-1">
            <CircleDot className="w-4 h-4 text-red-400 animate-pulse" />
            <h2 className="text-base font-bold text-white">Matchs en cours</h2>
            <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">{liveTotal}</span>
          </div>
          <div className="bg-[#0f1923] rounded-lg overflow-hidden border border-gray-800/50">
            {live.map((m) => (
              <MatchRow key={m.id} match={m} onShowDetail={onShowDetail} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const CountryGroup = memo(({ country, sportSlug, mode }) => {
  const [open, setOpen] = useState(country.country === 'World' || country.leagues.some((l) => l.is_popular || l.count > 0))
  const totalCount = country.leagues.reduce((acc, l) => acc + (l.count || 0), 0)
  return (
    <div className="border-b border-gray-800/40 last:border-b-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-800/40 transition-colors">
        {country.country_flag && <img src={country.country_flag} alt="" className="w-5 h-3 object-cover rounded" onError={(e) => (e.target.style.display = 'none')} />}
        <span className="text-sm font-semibold text-white flex-1 text-left">{country.country || 'World'}</span>
        {mode === 'live' && totalCount > 0 ? (
          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full">{totalCount}</span>
        ) : (
          <span className="text-[10px] text-gray-500">{country.leagues.length}</span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && (
        <div className="bg-dark-300/20">
          {country.leagues.map((l) => (
            <Link
              key={l.id}
              to={`/sports?sport=${sportSlug}&league=${l.id}`}
              className="flex items-center gap-2 px-3 py-2 pl-8 hover:bg-casino-gold/5 transition-colors border-l-2 border-transparent hover:border-casino-gold"
            >
              {l.logo ? (
                <img src={l.logo} alt="" className="w-5 h-5 object-contain" onError={(e) => (e.target.style.display = 'none')} />
              ) : (
                <Trophy className="w-4 h-4 text-gray-600" />
              )}
              <span className="text-xs text-gray-300 flex-1 truncate">{l.name}</span>
              {l.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                    mode === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {l.count}
                </span>
              )}
              {l.is_popular && <Star className="w-3 h-3 text-casino-gold fill-casino-gold" />}
              <ChevronRight className="w-3 h-3 text-gray-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
})
CountryGroup.displayName = 'CountryGroup'

// ==================== LEAGUE FIXTURES ====================
function LeagueFixtures({ sportSlug, leagueId, onShowDetail }) {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('next')

  const load = useCallback(
    async (which) => {
      setLoading(true)
      try {
        const params = which === 'last' ? { last: 30 } : { next: 30 }
        const res = await sportService.getLeagueFixtures(sportSlug, leagueId, params)
        setFixtures(res?.data || [])
      } finally {
        setLoading(false)
      }
    },
    [sportSlug, leagueId],
  )

  useEffect(() => {
    load(tab)
  }, [load, tab])

  const liveCount = fixtures.filter((f) => f.status === 'live').length
  const leagueInfo = fixtures[0]?.league

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <button onClick={() => window.history.back()} className="p-1.5 hover:bg-white/10 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        {leagueInfo?.logo && <img src={leagueInfo.logo} alt="" className="w-8 h-8 object-contain" />}
        <div>
          <h1 className="text-lg font-bold text-white">{leagueInfo?.name || `Championnat #${leagueId}`}</h1>
          <p className="text-[10px] text-gray-500">
            {leagueInfo?.country} {leagueInfo?.season ? `• ${leagueInfo.season}` : ''}
          </p>
        </div>
      </div>

      <div className="flex bg-[#0f1923] rounded-lg p-1 border border-gray-800/50">
        {[
          { key: 'next', label: 'A venir', icon: Clock },
          { key: 'last', label: 'Resultats', icon: Trophy },
        ].map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition-all ${
                active ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {liveCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <CircleDot className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="text-sm text-red-400 font-semibold">{liveCount} match{liveCount > 1 ? 's' : ''} en direct</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : fixtures.length === 0 ? (
        <div className="text-center py-12 bg-[#0f1923] rounded-lg border border-gray-800/50">
          <Trophy className="w-12 h-12 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Aucun match disponible</p>
        </div>
      ) : (
        <div className="bg-[#0f1923] rounded-lg overflow-hidden border border-gray-800/50">
          {fixtures.map((m) => (
            <MatchRow key={m.id} match={m} onShowDetail={onShowDetail} />
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== MAIN PAGE ====================
export default function Sport() {
  const [searchParams] = useSearchParams()
  const sportSlug = searchParams.get('sport')
  const leagueId = searchParams.get('league')
  const fixtureId = searchParams.get('fixture')

  const [selectedMatch, setSelectedMatch] = useState(null)

  // Auto-open match detail if URL contains ?fixture=ID (from Home or share link)
  useEffect(() => {
    if (!fixtureId || !sportSlug) return
    sportService
      .getMatchDetail(fixtureId, sportSlug)
      .then((res) => {
        if (res?.data) setSelectedMatch(res.data)
      })
      .catch(() => {})
  }, [fixtureId, sportSlug])

  return (
    <div className="pb-4">
      <div className="mb-3 px-3 py-2 bg-casino-gold/5 border border-casino-gold/20 rounded-lg">
        <p className="text-[11px] text-casino-gold text-center">
          <span className="font-bold">Tape</span> = pari direct - <span className="font-bold">Maintien</span> = ajoute au coupon (onglet Paris)
        </p>
      </div>

      {!sportSlug && <SportsGrid />}

      {sportSlug && !leagueId && <LeaguesAndLive sportSlug={sportSlug} onShowDetail={setSelectedMatch} />}

      {sportSlug && leagueId && (
        <LeagueFixtures sportSlug={sportSlug} leagueId={Number(leagueId)} onShowDetail={setSelectedMatch} />
      )}

      <AnimatePresence>
        {selectedMatch && <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}
      </AnimatePresence>
    </div>
  )
}
