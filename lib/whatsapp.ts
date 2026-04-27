export function normalizeWhatsAppPhone(phoneRaw: string | null | undefined): string | null {
  if (!phoneRaw) return null
  let digits = phoneRaw.replace(/\D/g, '')
  if (!digits) return null

  // Normalize common Pakistan formats: 03XXXXXXXXX -> 92XXXXXXXXXX
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`
  if (!digits.startsWith('92') && digits.length === 10) digits = `92${digits}`
  if (digits.length < 11) return null

  return digits
}

export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0'

  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: 'WhatsApp Cloud API env vars missing' }
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body },
        }),
      }
    )

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      const errorMsg =
        errJson?.error?.message || `WhatsApp API failed with status ${res.status}`
      return { ok: false, error: errorMsg }
    }
    await res.json().catch(() => ({}))

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown WhatsApp send error',
    }
  }
}
