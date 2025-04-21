import { Suspense } from 'react'
import ExitPayment from './exitPayment'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExitPayment />
    </Suspense>
  )
}
