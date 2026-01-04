import { Link } from 'react-router-dom'

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/games?category=${category.id}`}
      className="relative overflow-hidden rounded-2xl aspect-square group cursor-pointer"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 text-center">
        <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
          {category.icon}
        </div>
        <h3 className="text-white font-bold text-lg mb-1">{category.name}</h3>
        <p className="text-white/80 text-sm">{category.count} jeux</p>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
    </Link>
  )
}
