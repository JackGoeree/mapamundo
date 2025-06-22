'use client'

import dynamic from 'next/dynamic'

const MapWithNoSSR = dynamic(() => import('../components/MapWithHighlight'), {
  ssr: false,
})

export default function Page() {
  return <MapWithNoSSR />
}
