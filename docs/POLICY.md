# RebirthAI — Policy

Enduring domain, privacy, safety and conduct rules that are not about code structure.
Source: the SDD (`docs/sdd/RebirthAI_SDD.html`). When a feature seems to need an exception,
stop and ask the owner; do not decide it in code.

## 1. Purpose and spirit

RebirthAI helps a person tell their own life-change story well and keeps it reachable after
an in-person conversation ends. It extends real relationships and church community; it does
not replace them, and it does not speak for the author.

## 2. Roles

| Role | Can | Cannot |
|---|---|---|
| Author (signed in) | Create one profile and one testimony; use the coach; upload media; publish, unpublish, delete; choose which contact details to share | See or change anyone else's drafts, conversations or media |
| Recipient (no account) | Open a published testimony from a link or saved contact; save the author's contact if allowed; report a page | Sign in, comment, or see unpublished content |
| Platform operator | Review reports; run hosting, AI budget and data protection | Edit an author's story |
| AI coach | Ask questions, organize, draft from the author's answers, suggest edits | Invent details, overwrite text, counsel, or decide for the author |

## 3. Terminology (use these words in the product)

| Term | Meaning |
|---|---|
| Testimony | The author's story of how their life changed: life before, the turning point, life after |
| Author | The person telling their story |
| Coach | The AI interviewer that helps the author write |
| Draft / published | Private working copy / the version recipients see |
| Public / Unlisted | Visible and findable by search engines / reachable only by link (not indexed) |
| Handle | The author's unique name in their link, e.g. `/@maria_g` |
| Contact card | The `.vcf` file and QR code that carry the testimony link |
| Report | A recipient's flag on a public page for operator review |

Never show developer terms (draft_content, status, RLS, bucket, record, entity) to users.

## 4. Truthfulness and the author's voice (RC-04, DD-04)

- The coach may use **only** details the author gave. No invented people, places, events, quotes, scripture or outcomes.
- AI edits are always suggestions the author accepts or rejects. The author is the final editor.
- The coach never writes a testimony "from nothing."
- Any found fabrication is a release blocker until the prompt is fixed and re-reviewed (I-03).

## 5. Sensitive disclosures and safety (RC-05)

- Testimonies often involve addiction, abuse, grief, self-harm or crime. The coach responds with care, never pressures for details, and lets the author skip any question.
- If the author indicates current danger or thoughts of suicide, the coach pauses the writing flow and shows crisis resources (988 Suicide & Crisis Lifeline in the U.S.) before continuing.
- The coach does not give pastoral, theological, medical, legal or crisis counseling.

## 6. Faith framing (OQ-03, assumption pending owner confirmation)

The MVP assumes Christian testimonies. The coach may ask about scripture or faith moments only
if the author wants to include them, and never preaches or corrects the author's beliefs.

## 7. Privacy (RC-06, RC-12)

- Conversations and drafts are always private. Only the published testimony is public.
- Draft media is private and served by short-lived signed links until published.
- Location (GPS) data is removed from uploaded images.
- Phone and email appear on the contact card or public page **only** if the author turns them on. Nothing is shared by default.
- Unlisted testimonies are marked so search engines skip them.
- Deleting a testimony removes the story, the conversation and the stored media. It is permanent.
- Never log coach messages, story text or contact details.

## 8. Third parties and consent (RISK-03)

Before publishing, the preview reminds authors to consider whether they have named people who
have not agreed to be named. Authors can publish as Unlisted and can unpublish or delete in one
step.

## 9. Content and abuse (RC-13, RISK-04)

- Every public page has a Report link; reports are stored for operator review.
- Only allow-listed media types and sizes are accepted (images ≤10 MB; video ≤100 MB, about 3 minutes).
- Moderation tooling and takedown workflow are post-MVP; until then, the operator reviews reports manually.

## 10. Accessibility (RC-11)

Every page meets WCAG 2.1 AA contrast, works from the keyboard, requires alt text for images,
and never autoplays video with sound.

## 11. Permanence of links (RC-03)

A link saved in someone's contacts can never be updated. Therefore: the domain and URL format
must be final before real contact cards are handed out (D-04), old handles redirect forever,
and a released handle is never given to another user.

## 12. Out of bounds (SDD §2.3)

No social features, recipient accounts, AI-generated media or narration, translation, org
accounts, analytics, or payments without an owner decision that updates the SDD.
