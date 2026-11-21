/**
 * Family Bible — Invitation Email Sender
 * Google Apps Script Web App
 *
 * Deploy as:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * The deployed Web App URL goes into your Vue app's
 * VITE_INVITATION_SCRIPT_URL environment variable.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

var CONFIG = {
  // Shown as the sender name in the recipient's inbox.
  senderName: 'Family Bible',

  // Subject line of the invitation email.
  subject: '✝ You\'ve been invited to join Family Bible',

  // Origins allowed to call this script (your Firebase Hosting domain).
  // Set to '*' during development, then lock it down to your real domain.
  allowedOrigin: '*',
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Handles POST requests from the Vue app.
 *
 * Expected JSON body:
 *   { email: string, inviteUrl: string, familyName: string, inviterName: string }
 *
 * Returns JSON:
 *   { ok: true }  or  { ok: false, error: string }
 */
function doPost(e) {
  var output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)

  try {
    var body = JSON.parse(e.postData.contents)
    var email      = String(body.email      || '').trim().toLowerCase()
    var inviteUrl  = String(body.inviteUrl  || '').trim()
    var familyName = String(body.familyName || 'Family Bible').trim()
    var inviterName = String(body.inviterName || 'Your family admin').trim()

    if (!email || !inviteUrl) {
      output.setContent(JSON.stringify({ ok: false, error: 'Missing email or inviteUrl.' }))
      return output
    }

    // Basic email format guard.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      output.setContent(JSON.stringify({ ok: false, error: 'Invalid email address.' }))
      return output
    }

    var html = buildEmailHtml(email, inviteUrl, familyName, inviterName)
    var plain = buildEmailPlain(email, inviteUrl, familyName, inviterName)

    GmailApp.sendEmail(email, CONFIG.subject, plain, {
      name:     CONFIG.senderName,
      htmlBody: html,
    })

    output.setContent(JSON.stringify({ ok: true }))
  } catch (err) {
    output.setContent(JSON.stringify({ ok: false, error: err.message }))
  }

  return output
}

/**
 * Handles GET requests — health check so you can verify the script is live.
 */
function doGet() {
  var output = ContentService.createTextOutput()
  output.setMimeType(ContentService.MimeType.JSON)
  output.setContent(JSON.stringify({ ok: true, service: 'Family Bible Invitation Mailer' }))
  return output
}

// ─── Email templates ──────────────────────────────────────────────────────────

function buildEmailHtml(email, inviteUrl, familyName, inviterName) {
  return '<!DOCTYPE html>' +
  '<html lang="en">' +
  '<head>' +
  '<meta charset="UTF-8"/>' +
  '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
  '<title>You\'re invited to ' + escHtml(familyName) + '</title>' +
  '</head>' +
  '<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;">' +

  // Wrapper
  '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">' +
  '<tr><td align="center">' +

  // Card
  '<table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;' +
  'box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">' +

  // Header
  '<tr><td style="background:linear-gradient(135deg,#8faa7c 0%,#c9a84c 100%);' +
  'padding:40px 32px;text-align:center;">' +
  '<div style="display:inline-block;width:56px;height:56px;border-radius:14px;' +
  'background:rgba(255,255,255,.25);line-height:56px;font-size:28px;margin-bottom:16px;">✝</div>' +
  '<h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:bold;letter-spacing:-.5px;">' +
  'Family Bible</h1>' +
  '<p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px;font-style:italic;">' +
  'Together in the Word</p>' +
  '</td></tr>' +

  // Body
  '<tr><td style="padding:36px 32px;">' +

  '<p style="margin:0 0 8px;font-size:13px;font-weight:bold;text-transform:uppercase;' +
  'letter-spacing:.12em;color:#c9a84c;">You\'re invited</p>' +

  '<h2 style="margin:0 0 20px;font-size:22px;color:#2c2c2c;line-height:1.3;">' +
  escHtml(inviterName) + ' has invited you<br/>to join <em>' + escHtml(familyName) + '</em></h2>' +

  '<p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">' +
  'Click the button below to accept the invitation and start reading Scripture, ' +
  'sharing reflections, and praying together as a family.</p>' +

  // CTA button
  '<table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">' +
  '<tr><td style="background:linear-gradient(135deg,#8faa7c,#c9a84c);border-radius:10px;">' +
  '<a href="' + escHtml(inviteUrl) + '" ' +
  'style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;' +
  'font-weight:bold;text-decoration:none;letter-spacing:.02em;">Accept Invitation →</a>' +
  '</td></tr></table>' +

  // Fallback link
  '<p style="margin:0 0 24px;font-size:12px;color:#999;line-height:1.6;">' +
  'Button not working? Copy and paste this link into your browser:<br/>' +
  '<a href="' + escHtml(inviteUrl) + '" style="color:#8faa7c;word-break:break-all;">' +
  escHtml(inviteUrl) + '</a></p>' +

  // Divider
  '<hr style="border:none;border-top:1px solid #ede8df;margin:24px 0"/>' +

  // Scripture quote
  '<blockquote style="margin:0 0 24px;padding:0 0 0 16px;' +
  'border-left:3px solid #c9a84c;font-style:italic;color:#777;font-size:14px;line-height:1.7;">' +
  '"Where you go I will go, and where you stay I will stay."' +
  '<br/><span style="font-size:12px;font-style:normal;color:#aaa;">— Ruth 1:16</span>' +
  '</blockquote>' +

  '<p style="margin:0;font-size:12px;color:#bbb;line-height:1.6;">' +
  'This invitation was sent to ' + escHtml(email) + '. ' +
  'If you weren\'t expecting this, you can safely ignore it — ' +
  'no account will be created unless you click the button above.</p>' +

  '</td></tr>' +

  // Footer
  '<tr><td style="background:#f9f6f0;padding:20px 32px;text-align:center;">' +
  '<p style="margin:0;font-size:12px;color:#aaa;">© ' + new Date().getFullYear() +
  ' Family Bible · Secure sign-in powered by Firebase</p>' +
  '</td></tr>' +

  '</table>' + // end card
  '</td></tr></table>' + // end wrapper
  '</body></html>'
}

function buildEmailPlain(email, inviteUrl, familyName, inviterName) {
  return [
    'You\'ve been invited to join ' + familyName + ' on Family Bible!',
    '',
    inviterName + ' has invited you to join their family group where you can read',
    'Scripture, share reflections, and pray together.',
    '',
    'Accept your invitation here:',
    inviteUrl,
    '',
    '"Where you go I will go, and where you stay I will stay." — Ruth 1:16',
    '',
    '---',
    'This invitation was sent to ' + email + '.',
    'If you weren\'t expecting this, you can safely ignore this email.',
  ].join('\n')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
