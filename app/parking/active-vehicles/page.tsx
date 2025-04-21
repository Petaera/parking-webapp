import { Suspense } from 'react'
import ActiveVehicles from './activeVehicle'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActiveVehicles />
    </Suspense>
  )
}
