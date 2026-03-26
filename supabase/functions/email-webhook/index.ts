import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeHtmlForStorage(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const webhookSecret = Deno.env.get('EMAIL_WEBHOOK_SECRET');
    if (webhookSecret) {
      const url = new URL(req.url);
      const providedToken = url.searchParams.get('token') || req.headers.get('x-webhook-secret');
      if (!providedToken || providedToken !== webhookSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const contentType = req.headers.get('content-type') || '';
    let emailData: { from: string; to: string; subject: string; text: string; html: string; attachments?: string };

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      emailData = {
        from: formData.get('from') as string || '', to: formData.get('to') as string || '',
        subject: formData.get('subject') as string || '', text: formData.get('text') as string || '',
        html: formData.get('html') as string || '', attachments: formData.get('attachments') as string || '[]',
      };
    } else {
      emailData = await req.json();
    }

    let fromEmail = emailData.from || '';
    let fromName = '';
    const emailMatch = fromEmail.match(/^(.+?)\s*<(.+)>$/);
    if (emailMatch) { fromName = emailMatch[1].replace(/"/g, '').trim(); fromEmail = emailMatch[2].trim() }

    if (!validateEmail(fromEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid from email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const toEmail = (emailData.to || '').trim();
    const subject = (emailData.subject || '(Sin asunto)').substring(0, 998);
    const textContent = emailData.text ? emailData.text.substring(0, 100000) : null;
    const htmlContent = emailData.html ? sanitizeHtmlForStorage(emailData.html.substring(0, 500000)) : null;

    let attachments: unknown[] = [];
    try { if (emailData.attachments) { const parsed = JSON.parse(emailData.attachments); if (Array.isArray(parsed)) attachments = parsed.slice(0, 20) } } catch { attachments = [] }

    const { data, error } = await supabase.from('email_inbox').insert({
      from_email: fromEmail, from_name: fromName || null, to_email: toEmail,
      subject, text_content: textContent, html_content: htmlContent, attachments, is_read: false,
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to save email' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error instanceof Error ? error.message : 'Unknown');
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
