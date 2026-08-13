# Meta App Review notes

You only need App Review if you want people who are not testers on your app to connect their own Instagram accounts. If you run Ongevia for your own accounts, skip this. See the "Letting other people use your instance" section of [docs/setup.md](docs/setup.md).

Ongevia uses the official Instagram API to send a private reply to someone who comments on a connected professional account's post or reel.

## Permissions to request

- `instagram_business_basic`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`

## Permission justifications

Paste these into the App Review request, adjusted to your wording.

`instagram_business_basic`. We use this to identify the connected Instagram professional account after the user authorizes through Instagram business login, so we can associate the account with their workspace and show which account each automation belongs to.

`instagram_business_manage_comments`. When a follower comments a keyword the account owner configured on the owner's own post or reel, we receive the comment through the comments webhook and, if the owner enabled it, post a public reply under that comment. We only act on comments on the connecting account's own media.

`instagram_business_manage_messages`. After a follower comments a configured keyword, we send that follower a one-time private reply with content the account owner set up, typically a link or answer the follower asked for by commenting. This is the standard Instagram comment-to-DM flow. We send one reply per matching comment and respect Meta's rate limits.

## Screencast script

Record on your published app, real accounts, one take, about two to three minutes. Narrate each step.

1. Sign in with phone OTP (SMS).
2. Go to Settings and click Connect Instagram. Show the consent screen with the permissions being granted.
3. Create a campaign on a recent post with keyword `LINK`, a DM message, and save.
4. On a second phone or account, comment `LINK` on that post.
5. Show the second account receiving the DM, and the public reply appearing under the comment.
6. Back in the app, show the DM Logs page with the SENT row.

Reviewers want to see the permission produce a real result for a real user. This flow does that directly.

## Compliance positioning

- The app never scrapes Instagram and never asks for a password.
- It only sends a reply when someone comments on the connected account's own content.
- Tokens are encrypted at rest with AES-256-GCM.
- Users can disconnect Instagram from Settings.
- Per-account rate limiting and deduplication prevent spammy behavior.

## Submit checklist (App Review)

1. App is **Live**; privacy policy + data deletion URLs point at `https://ongevia.com/privacy` (and deletion if separate).
2. **Connect Instagram** works end-to-end for a tester account (OAuth → webhooks → comment → DM).
3. Request Advanced Access for the three permissions above; paste the justifications.
4. Upload the screencast following the script.
5. Complete **Business verification** when Meta asks for it.

Until Advanced Access is approved, only Meta app roles (Admin / Developer / Tester) can complete Connect Instagram. Add public users as Testers temporarily if you need them before approval.

## Business verification

Meta usually requires business verification before granting Advanced Access. It asks for a document proving a legal entity: a business registration or license, articles of incorporation, a business tax document, or a business bank statement. If you do not have a registered business, you cannot complete this step, and the practical path is to run Ongevia for your own accounts (add them as Testers) instead.
