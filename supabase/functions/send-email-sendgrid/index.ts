import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRecipient { email: string; name?: string }
interface SendEmailRequest {
  to: EmailRecipient | EmailRecipient[]
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: string
  dynamicTemplateData?: Record<string, unknown>
  from?: { email: string; name?: string }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sendgridApiKey) throw new Error('SendGrid API key not configured')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { data: userRole } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'moderator')) throw new Error('Insufficient permissions')

    const { to, subject, htmlContent, textContent, templateId, dynamicTemplateData, from }: SendEmailRequest = await req.json()
    if (!to) throw new Error('Recipient(s) required')
    if (!subject && !templateId) throw new Error('Subject or template ID required')
    if (!htmlContent && !textContent && !templateId) throw new Error('Email content or template ID required')

    const recipients = Array.isArray(to) ? to : [to]
    const personalizations = recipients.map(r => ({
      to: [{ email: r.email, name: r.name }],
      ...(dynamicTemplateData && { dynamic_template_data: dynamicTemplateData })
    }))

    const emailPayload: Record<string, unknown> = {
      personalizations,
      from: { email: from?.email || 'noreply@copatelmex.com', name: from?.name || 'Copa Telmex Telcel' },
    }

    if (templateId) {
      emailPayload.template_id = templateId
    } else {
      emailPayload.subject = subject
      emailPayload.content = []
      if (textContent) (emailPayload.content as unknown[]).push({ type: 'text/plain', value: textContent })
      if (htmlContent) (emailPayload.content as unknown[]).push({ type: 'text/html', value: htmlContent })
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sendgridApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`SendGrid error: ${response.status} - ${errorBody}`)
    }

    try {
      await supabase.from('email_send_log').insert({
        sent_by: user.id, recipient_count: recipients.length,
        subject: subject || `Template: ${templateId}`, status: 'sent',
      })
    } catch (logError) { console.warn('Could not log email send:', logError) }

    return new Response(JSON.stringify({ success: true, recipientCount: recipients.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})
