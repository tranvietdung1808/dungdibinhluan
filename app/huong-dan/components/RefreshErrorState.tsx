"use client"

import { useRouter } from "next/navigation"
import { ErrorState } from "@/app/components/ui"

// ErrorState cho server component: retry = re-fetch dữ liệu route
export default function RefreshErrorState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  const router = useRouter()
  return (
    <ErrorState
      title={title}
      description={description}
      onRetry={() => router.refresh()}
      retryLabel="Thử lại"
    />
  )
}
