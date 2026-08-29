import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

/**
 * Envía el correo de invitación a corredora vía Resend.
 * El token lo crea el RPC create_org_invite; esta ruta solo manda el mail.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL
  if (!apiKey || !from) {
    return NextResponse.json({ error: 'Resend no está configurado' }, { status: 500 })
  }

  let to: string
  let orgName: string
  let token: string
  try {
    const body = await req.json()
    to = body?.to
    orgName = body?.orgName
    token = body?.token
    if (!to || !token) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const origin = req.headers.get('origin') ?? 'https://mapu-web.mapu-app-admin.workers.dev'
  const link = `${origin}/register?invite=${token}`

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Te invitaron a ${orgName || 'una corredora'} en MapU`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Te invitaron a ${orgName || 'una corredora'}</h2>
        <p style="color:#444">Regístrate en MapU para unirte a tu equipo y empezar a publicar propiedades.</p>
        <p style="text-align:center;margin:24px 0">
          <a href="${link}" style="background:#FF4D1C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
            Unirme a la corredora
          </a>
        </p>
        <p style="color:#888;font-size:12px">Si no esperabas esta invitación, ignora este correo.</p>
      </div>
    `,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
