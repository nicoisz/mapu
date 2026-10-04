import { MessageInbox } from '@/components/messages/MessageInbox'
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ propiedad?: string }>
}) {
  const { propiedad } = await searchParams
  return <MessageInbox initialPropertyId={propiedad} />
}
