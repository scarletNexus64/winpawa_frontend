import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Gift, TrendingUp, AlertCircle, CheckCircle, X } from 'lucide-react'

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'bonus',
      icon: Gift,
      title: 'Bonus quotidien disponible',
      message: 'Réclamez votre bonus de 500 FCFA maintenant!',
      time: 'Il y a 5 min',
      read: false,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 2,
      type: 'win',
      icon: TrendingUp,
      title: 'Félicitations!',
      message: 'Vous avez gagné 5,000 FCFA sur Apple of Fortune',
      time: 'Il y a 1h',
      read: false,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      type: 'info',
      icon: Bell,
      title: 'Nouveau jeu disponible',
      message: 'Découvrez "Jackpot Deluxe" et tentez de gagner gros!',
      time: 'Il y a 2h',
      read: false,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 4,
      type: 'success',
      icon: CheckCircle,
      title: 'Dépôt confirmé',
      message: 'Votre dépôt de 10,000 FCFA a été crédité',
      time: 'Hier',
      read: true,
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 5,
      type: 'alert',
      icon: AlertCircle,
      title: 'Match virtuel imminent',
      message: 'Le prochain match commence dans 5 minutes',
      time: 'Hier',
      read: true,
      color: 'from-orange-500 to-red-500'
    },
  ])

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ))
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-gaming font-bold text-white mb-2">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-dark-200 hover:bg-dark-300 text-casino-gold text-sm font-semibold rounded-xl transition-all"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            Aucune notification
          </h3>
          <p className="text-gray-500">
            Vous n'avez pas encore de notifications
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, index) => {
            const Icon = notif.icon
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`relative group ${
                  notif.read ? 'opacity-60' : ''
                }`}
              >
                <div
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`card p-4 cursor-pointer hover:border-casino-gold/30 transition-all ${
                    !notif.read ? 'border-l-4 border-l-casino-gold' : ''
                  }`}
                >
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notif.id)
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-dark-300 hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${notif.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white mb-1 text-sm">
                        {notif.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {notif.time}
                        </span>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-casino-gold rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
