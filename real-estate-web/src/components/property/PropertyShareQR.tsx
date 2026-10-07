'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Download, QrCode, X } from 'lucide-react'
import { Property } from '@/types/property'

interface Props {
  property: Property
}

/**
 * Genera el QR (con el código público) y un sticker PNG descargable para
 * imprimir en pendones. El QR apunta a /propiedad/{code}.
 */
export function PropertyShareQR({ property }: Props) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) setUrl(`${window.location.origin}/propiedad/${property.code}`)
  }, [open, property.code])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard no disponible */
    }
  }

  function downloadSticker() {
    const qr = qrRef.current
    if (!qr) return
    const W = 1080
    const H = 1350
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 12
    ctx.strokeRect(24, 24, W - 48, H - 48)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 62px system-ui, sans-serif'
    ctx.fillText('LUKY PROPIEDADES', W / 2, 180)
    ctx.fillStyle = '#6b7280'
    ctx.font = '40px system-ui, sans-serif'
    ctx.fillText('Tu próxima propiedad, a un escaneo', W / 2, 245)

    ctx.fillStyle = '#111827'
    ctx.font = 'bold 210px system-ui, sans-serif'
    ctx.fillText(property.code, W / 2, 520)

    const qrSize = 560
    ctx.drawImage(qr, (W - qrSize) / 2, 610, qrSize, qrSize)

    ctx.fillStyle = '#6b7280'
    ctx.font = '36px system-ui, sans-serif'
    ctx.fillText('Escanea el QR o busca este código', W / 2, 1260)

    const link = document.createElement('a')
    link.download = `sticker-${property.code}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Generar QR y sticker"
        className="p-2 rounded-lg border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary transition-all"
      >
        <QrCode size={18} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
            >
              <X size={18} />
            </button>

            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              LUKY PROPIEDADES
            </p>
            <p className="mt-4 text-6xl font-black tracking-tight text-gray-900">{property.code}</p>

            <div className="mx-auto mt-4 flex justify-center">
              {url && (
                <QRCodeCanvas
                  ref={qrRef}
                  value={url}
                  size={512}
                  level="M"
                  marginSize={2}
                  style={{ width: 200, height: 200 }}
                />
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Escanea el QR o ingresa el código en el buscador
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={downloadSticker}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-on-primary hover:brightness-110"
              >
                <Download size={15} /> Sticker
              </button>
              <button
                onClick={copyLink}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Copy size={15} /> {copied ? 'Copiado' : 'Enlace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
