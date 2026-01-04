const ShimmerLoading = ({ className = '', variant = 'default' }) => {
  const shimmerAnimation = 'animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]'

  if (variant === 'game-card') {
    return (
      <div className={`bg-gray-900/50 rounded-xl overflow-hidden ${className}`}>
        <div className={`${shimmerAnimation} h-48 w-full`} />
        <div className="p-4 space-y-3">
          <div className={`${shimmerAnimation} h-5 w-3/4 rounded`} />
          <div className={`${shimmerAnimation} h-4 w-1/2 rounded`} />
        </div>
      </div>
    )
  }

  if (variant === 'category-card') {
    return (
      <div className={`bg-gray-900/50 rounded-xl overflow-hidden ${className}`}>
        <div className={`${shimmerAnimation} h-32 w-full`} />
        <div className="p-3 space-y-2">
          <div className={`${shimmerAnimation} h-5 w-2/3 rounded`} />
          <div className={`${shimmerAnimation} h-3 w-1/2 rounded`} />
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`${shimmerAnimation} rounded-2xl h-48 w-full ${className}`} />
    )
  }

  // Default shimmer (rectangle)
  return (
    <div className={`${shimmerAnimation} rounded ${className}`} />
  )
}

export default ShimmerLoading
