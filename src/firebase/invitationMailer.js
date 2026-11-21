/**
 * Sends a family invitation email via the Google Apps Script Web App.
 *
 * The script URL is set in VITE_INVITATION_SCRIPT_URL.
 * Falls back to Firebase sendSignInLinkToEmail if the env var is not set.
 */

import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from './config'

const SCRIPT_URL = import.meta.env.VITE_INVITATION_SCRIPT_URL

/**
 * @param {object} options
 * @param {string} options.email          - Recipient email address
 * @param {string} options.inviteUrl      - The magic-link URL the recipient clicks
 * @param {string} options.familyName     - Display name of the family group
 * @param {string} options.inviterName    - Display name of the person sending the invite
 */
export async function sendInvitationEmail({ email, inviteUrl, familyName, inviterName }) {
  if (SCRIPT_URL) {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      // Google Apps Script requires text/plain for simple CORS-free POST
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ email, inviteUrl, familyName, inviterName }),
    })

    // Apps Script always returns 200 even for errors; check the JSON body.
    const result = await response.json().catch(() => ({ ok: false, error: 'Invalid response from mailer.' }))
    if (!result.ok) {
      throw new Error(result.error || 'The invitation mailer returned an error.')
    }
    return
  }

  // Fallback: Firebase Auth email link (requires Email Link sign-in enabled in Firebase Console)
  const actionCodeSettings = {
    url: inviteUrl,
    handleCodeInApp: true,
  }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
}
