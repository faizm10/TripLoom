import { notFound } from "next/navigation"

import { getPublicTripSharePayload } from "@/lib/public-trip-share"
import { ShareTripView } from "./share-trip-view"

export default async function PublicTripSharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const decoded = decodeURIComponent(token)
  const data = await getPublicTripSharePayload(decoded)
  if (!data) notFound()

  return <ShareTripView initialData={data} shareToken={decoded} />
}
