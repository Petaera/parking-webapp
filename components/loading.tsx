import React from "react"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading, please wait...</p>
        </CardContent>
      </Card>
    </div>
  )
}