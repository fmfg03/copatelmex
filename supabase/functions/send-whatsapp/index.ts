import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppRequest {
  to: string
  message?: string
  templateType?: string
  templateData?: Record<string, string>
  useTwilioTemplate?: boolean
}

const fallbackTemplates: Record<string, string> = {
  registration_confirmation: 
    "⚽ *¡Registro Exitoso - Copa Telmex Telcel 2026!*\n\n" +
    "Hola {{managerName}},\n\n" +
    "Tu equipo *{{teamName}}* ha sido registrado exitosamente en la categoría {{category}}.\n\n" +
    "📋 *Referencia de pago:* {{paymentReference}}\n" +
    "💰 *Monto:* ${{amount}} MXN\n\n" +
    "Una vez realizado el pago, envía tu comprobante a este mismo número.\n\n" +
    "¡Gracias por participar! 🏆",

  payment_reminder: 
    "⚽ *Recordatorio de Pago - Copa Telmex Telcel 2026*\n\n" +
    "Hola {{managerName}},\n\n" +
    "Te recordamos que el pago para el equipo *{{teamName}}* está pendiente.\n\n" +
    "📋 *Referencia:* {{paymentReference}}\n" +
    "💰 *Monto:* ${{amount}} MXN\n\n" +
    "Realiza tu pago lo antes posible para confirmar tu participación.\n\n" +
    "¿Tienes dudas? Responde a este mensaje. 📩",

  documents_reminder: 
    "⚽ *Recordatorio de Documentos - Copa Telmex Telcel 2026*\n\n" +
    "Hola {{managerName}},\n\n" +
    "Te recordamos que faltan documentos por subir para el equipo *{{teamName}}*.\n\n" +
    "📄 *Documentos pendientes:* {{pendingDocs}}\n\n" +
    "Ingresa al portal de documentos para completar el registro de tus jugadores.\n\n" +
    "¡El tiempo se agota! ⏰",
}

function replaceVariables(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value || '')
  }
  result = result.replace(/\{\{[^}]+\}\}/g, '')
  return result
}

function normalizeE164(raw: string): string {
  const trimmed = (raw || '').trim().replace(/^whatsapp:/i, '')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return `+${digits}`
}

async function sendWithContentTemplate(
  accountSid: string, authToken: string, fromNumber: string,
  toNumber: string, contentSid: string, variables: Record<string, string>
): Promise<{ success: boolean; sid?: string; status?: string; error?: string }> {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const variableKeys = Object.keys(variables)
  const contentVariables: Record<string, string> = {}
  variableKeys.forEach((key, index) => { contentVariables[String(index + 1)] = variables[key] || '' })

  const formData = new URLSearchParams()
  formData.append('From', `whatsapp:${fromNumber}`)
  formData.append('To', toNumber)
  formData.append('ContentSid', contentSid)
  if (Object.keys(contentVariables).length > 0) {
    formData.append('ContentVariables', JSON.stringify(contentVariables))
  }

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const result = await response.json()
  if (!response.ok) {
    console.error('Twilio Content API error:', result)
    return { success: false, error: result.message || 'Failed to send template message' }
  }
  return { success: true, sid: result.sid, status: result.status }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!)
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)

    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', user.id)
      .in('role', ['admin', 'moderator']).maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin or moderator role required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 })
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured')
    }

    const requestBody = await req.json() as WhatsAppRequest & { testMode?: boolean }
    const { to, message, templateType, templateData, useTwilioTemplate, testMode } = requestBody

    if (testMode) {
      const testUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`) },
      })
      if (!testResponse.ok) {
        const testError = await testResponse.json()
        throw new Error(testError.message || 'Invalid Twilio credentials')
      }
      const normalizedFrom = normalizeE164(fromNumber)
      if (!normalizedFrom) throw new Error('TWILIO_WHATSAPP_NUMBER is empty/invalid.')

      return new Response(JSON.stringify({ success: true, message: 'Twilio connection verified', testMode: true, from: `whatsapp:${normalizedFrom}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (!to) throw new Error('Recipient phone number is required')

    let formattedTo = to.replace(/\D/g, '')
    if (!formattedTo.startsWith('52') && formattedTo.length === 10) {
      formattedTo = '52' + formattedTo
    }
    formattedTo = `whatsapp:+${formattedTo}`

    const normalizedFrom = normalizeE164(fromNumber)
    if (!normalizedFrom) throw new Error('Invalid TWILIO_WHATSAPP_NUMBER.')

    let messageBody = ''
    let messageSid: string | undefined
    let messageStatus: string | undefined
    let usedTwilioTemplate = false

    if (templateType && templateType !== 'custom' && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: templateRecord, error: templateError } = await supabase
        .from('whatsapp_templates').select('content, twilio_content_sid, approval_status, variables')
        .eq('slug', templateType).eq('is_active', true).single()

      if (!templateError && templateRecord) {
        if (templateRecord.approval_status === 'approved' && templateRecord.twilio_content_sid && useTwilioTemplate !== false) {
          const result = await sendWithContentTemplate(accountSid, authToken, normalizedFrom, formattedTo, templateRecord.twilio_content_sid, templateData || {})
          if (result.success) {
            messageSid = result.sid; messageStatus = result.status; usedTwilioTemplate = true
            messageBody = replaceVariables(templateRecord.content, templateData || {})
          }
        }
        if (!usedTwilioTemplate) {
          messageBody = replaceVariables(templateRecord.content, templateData || {})
        }
      } else {
        const fallbackContent = fallbackTemplates[templateType]
        if (fallbackContent) messageBody = replaceVariables(fallbackContent, templateData || {})
        else throw new Error(`Template '${templateType}' not found`)
      }
    } else if (message) {
      messageBody = message
    } else if (!usedTwilioTemplate) {
      throw new Error('Message content is required')
    }

    if (!usedTwilioTemplate) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
      const formData = new URLSearchParams()
      formData.append('From', `whatsapp:${normalizedFrom}`)
      formData.append('To', formattedTo)
      formData.append('Body', messageBody)

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      const result = await response.json()
      if (!response.ok) {
        console.error('Twilio API error:', result)
        throw new Error(result.message || 'Failed to send WhatsApp message')
      }
      messageSid = result.sid; messageStatus = result.status
    }

    if (supabaseUrl && supabaseServiceKey && messageSid) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const phoneForStorage = formattedTo.replace('whatsapp:', '').replace('+', '')
        await supabase.from('whatsapp_message_log').insert({
          recipient_phone: phoneForStorage, message_content: messageBody,
          message_type: templateType || 'custom', direction: 'outgoing',
          status: messageStatus || 'sent', message_sid: messageSid,
          sent_at: new Date().toISOString(), is_read: true
        })
      } catch (dbError) {
        console.error('Error saving message to database:', dbError)
      }
    }

    return new Response(JSON.stringify({ success: true, messageSid, status: messageStatus, usedTwilioTemplate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending WhatsApp message:', error)
    return new Response(JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
