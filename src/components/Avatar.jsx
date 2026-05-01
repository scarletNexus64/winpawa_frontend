import { useState } from 'react';

/**
 * Couleurs pour les avatars générés
 */
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-rose-500',
];

/**
 * Extrait les initiales d'un nom
 */
const getInitials = (name) => {
  if (!name) return '??';

  // Nettoyer le nom
  name = name.trim();

  // Si le nom contient des espaces, prendre la première lettre de chaque mot
  if (name.includes(' ')) {
    const parts = name.split(' ');
    return parts
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }

  // Sinon, prendre les 2 premières lettres
  return name.substring(0, 2).toUpperCase();
};

/**
 * Retourne une couleur basée sur le nom (déterministe)
 */
const getColorForName = (name) => {
  if (!name) return COLORS[0];

  // Simple hash du nom
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

/**
 * Composant Avatar
 * Affiche une image de profil ou génère un avatar avec initiales
 */
export default function Avatar({
  src,
  name = '',
  size = 'md',
  className = '',
  alt = 'Avatar',
  onClick = null,
}) {
  const [imageError, setImageError] = useState(false);

  // Tailles disponibles
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl',
  };

  const sizeClasses = sizes[size] || sizes.md;

  // Si on a une image valide et pas d'erreur
  if (src && !imageError) {
    return (
      <div
        className={`${sizeClasses} rounded-full overflow-hidden flex-shrink-0 ${className} ${
          onClick ? 'cursor-pointer' : ''
        }`}
        onClick={onClick}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Sinon, générer un avatar avec initiales
  const initials = getInitials(name);
  const bgColor = getColorForName(name);

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center ${bgColor} text-white font-bold flex-shrink-0 ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      title={name}
    >
      {initials}
    </div>
  );
}

/**
 * Composant AvatarGroup
 * Affiche un groupe d'avatars avec overlap
 */
export function AvatarGroup({ users = [], max = 3, size = 'md', className = '' }) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayUsers.map((user, index) => (
        <div key={user.id || index} className="ring-2 ring-gray-900 rounded-full">
          <Avatar src={user.avatar} name={user.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`${
            size === 'xs' ? 'w-6 h-6 text-xs' :
            size === 'sm' ? 'w-8 h-8 text-sm' :
            size === 'md' ? 'w-10 h-10 text-base' :
            size === 'lg' ? 'w-12 h-12 text-lg' :
            'w-16 h-16 text-xl'
          } rounded-full bg-gray-700 text-white flex items-center justify-center font-semibold ring-2 ring-gray-900`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
