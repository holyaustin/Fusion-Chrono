// components/Logo.tsx
import Image from 'next/image'

export function Logo() {
  return (
    <Image
      src="https://images.unsplash.com/photo-1639322537504-6427a16b0a28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8YmxvY2tjaGFpbnwxfHx8fDE3NTIwMDAwMDAw&ixlib=rb-4.0.3&q=80&w=100"
      alt="Fusion Chrono Logo"
      width={40}
      height={40}
      priority
      className="rounded-full border-2 border-secondary shadow-lg"
    />
  )
}