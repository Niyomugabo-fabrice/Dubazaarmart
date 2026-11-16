import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const auth = await payload.auth({ headers: request.headers })
  if (!auth.user || auth.user.collection !== 'admins') {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  let timer: ReturnType<typeof setInterval> | undefined
  let lastSignature = ''
  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const [orders, shipments, notifications] = await Promise.all([
            payload.count({
              collection: 'customer-orders',
              overrideAccess: false,
              user: auth.user,
            }),
            payload.count({
              collection: 'shipments',
              overrideAccess: false,
              user: auth.user,
            }),
            payload.count({
              collection: 'shipment-notifications',
              where: { read: { equals: false } },
              overrideAccess: false,
              user: auth.user,
            }),
          ])
          const signature = JSON.stringify({
            orders: orders.totalDocs,
            shipments: shipments.totalDocs,
            notifications: notifications.totalDocs,
          })
          if (signature !== lastSignature) {
            lastSignature = signature
            controller.enqueue(encoder.encode(`event: operations\ndata: ${signature}\n\n`))
          } else {
            controller.enqueue(encoder.encode(': keep-alive\n\n'))
          }
        } catch {
          controller.enqueue(encoder.encode('event: error\ndata: {}\n\n'))
        }
      }
      await send()
      timer = setInterval(send, 15000)
    },
    cancel() {
      if (timer) clearInterval(timer)
    },
  })

  request.signal.addEventListener('abort', () => {
    if (timer) clearInterval(timer)
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    },
  })
}
