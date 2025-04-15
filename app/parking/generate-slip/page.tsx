import { Suspense } from 'react'
import GenerateSlipClient from './generateSlip'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GenerateSlipClient />
    </Suspense>
  )
}
