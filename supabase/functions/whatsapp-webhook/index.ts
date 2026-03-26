import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function validateTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string): Promise<boolean> {
  try {
    const sortedKeys = Object.keys(params).sort()
    const data = url + sortedKeys.map(key => key + params[key]).join('')
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    if (expectedSignature.length !== signature.length) return false
    let result = 0
    for (let i = 0; i < expectedSignature.length; i++) result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i)
    return result === 0
  } catch { return false }
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length <= 4 ? '****' : '***' + digits.slice(-4)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioSignature = req.headers.get('X-Twilio-Signature')
    const formData = await req.formData()
    const paramsForSig: Record<string, string> = {}
    formData.forEach((value, key) => { paramsForSig[key] = value.toString() })

    if (twilioAuthToken) {
      if (!twilioSignature) {
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 403 })
      }
      const isValid = await validateTwilioSignature(req.url, paramsForSig, twilioSignature, twilioAuthToken)
      if (!isValid) {
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { ...corsHeaders, 'Content-Type': 'text/xml' }, status: 403 })
      }
    }

    const payload = {
      MessageSid: formData.get('MessageSid')?.toString() || '',
      AccountSid: formData.get('AccountSid')?.toString() || '',
      From: formData.get('From')?.toString() || '',
      To: formData.get('To')?.toString() || '',
      Body: formData.get('Body')?.toString() || '',
      NumMedia: formData.get('NumMedia')?.toString(),
      MediaUrl0: formData.get('MediaUrl0')?.toString(),
      MediaContentType0: formData.get('MediaContentType0')?.toString(),
    }

    if (!payload.From) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
    }

    const phoneNumber = payload.From.replace('whatsapp:', '').replace(/\D/g, '')
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    let teamId = null
    let managerName: string | null = null

    const phoneVariants = [phoneNumber, `+${phoneNumber}`, phoneNumber.startsWith('52') ? phoneNumber.slice(2) : phoneNumber]
    let profile = null
    for (const variant of phoneVariants) {
      const { data } = await supabase.from('profiles').select('id, full_name, phone')
        .or(`phone.eq.${variant},phone.ilike.%${variant.slice(-10)}`).limit(1).maybeSingle()
      if (data) { profile = data; break }
    }

    if (profile) {
      managerName = profile.full_name
      const { data: teams } = await supabase.from('teams').select('id').eq('user_id', profile.id).limit(1)
      if (teams?.length) teamId = teams[0].id
    }

    const messageContent = payload.Body || '📎 Archivo adjunto'

    console.log('Incoming WhatsApp:', { phone: maskPhone(phoneNumber), foundProfile: !!profile })

    await supabase.from('whatsapp_message_log').insert({
      recipient_phone: phoneNumber, recipient_name: managerName,
      message_type: 'incoming', message_content: messageContent,
      message_sid: payload.MessageSid, status: 'received',
      team_id: teamId, direction: 'incoming', is_read: false,
    })

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error instanceof Error ? error.message : 'Unknown')
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
  }
})
