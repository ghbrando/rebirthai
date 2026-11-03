import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, List, Section } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy policy — RebirthAI",
  description: "What RebirthAI collects, who can see it, and how to delete it.",
};

/**
 * Privacy policy (#25). Public, no sign-in. Every statement must match what the code does:
 * POLICY §7, §9, §11; OPERATIONS retention; lib/ai/usage.ts; app/api/coach/**; app/api/report.
 * If you change data handling, update this page in the same PR.
 */
export default function Page() {
  return (
    <LegalPage title="Privacy policy">
      <Section title="The short version">
        <List>
          <li>Your coach conversation and your drafts are private. Only what you publish can be seen by others.</li>
          <li>New pages are Unlisted unless you choose Public: only people with your link or QR code can read them.</li>
          <li>Your phone number and email are shown only if you turn that on.</li>
          <li>The AI coach sends your messages to Anthropic, the company that makes the AI, so it can reply.</li>
          <li>You can delete your account and everything in it from Settings at any time.</li>
          <li>We do not show ads and we do not use tracking or analytics tools.</li>
        </List>
      </Section>

      <Section title="Who we are">
        <p>
          RebirthAI helps you write your testimony, the story of how your life changed, and share it from your
          contact card. It is run by {LEGAL.operator} (&ldquo;we&rdquo;). RebirthAI is in a small private beta.
        </p>
        <p>RebirthAI is for adults. You must be 18 or older to use it.</p>
      </Section>

      <Section title="What we collect">
        <List>
          <li>
            <b>Your account.</b> Your email address, so you can sign in with an email link. If you choose
            &ldquo;Continue with Google&rdquo;, Google tells us your email address and may also share your name and
            profile picture.
          </li>
          <li>
            <b>Your profile.</b> Your name, your handle (the name in your link, like /@maria_g), and anything else you
            add: a short bio, a photo, and your church.
          </li>
          <li>
            <b>Your testimony.</b> The title and story you write, both your private draft and the version you publish.
          </li>
          <li>
            <b>Your coach conversation.</b> The messages you write to the AI coach and its replies.
          </li>
          <li>
            <b>Photos and videos</b> you upload. Before a photo is uploaded, your phone or browser removes its hidden
            details, including the location (GPS) where it was taken.
          </li>
          <li>
            <b>Contact details.</b> If you add a phone number or email for your contact card, we store them. Others see
            them only if you turn sharing on. It is off until you turn it on.
          </li>
          <li>
            <b>Reports.</b> Anyone can report a published page. We keep what they wrote, which page it was about, and
            when. We do not ask for the reporter&apos;s name or email. Their internet (IP) address is used for a short
            time to stop spam and is not saved with the report.
          </li>
          <li>
            <b>Coach cost records.</b> Each time the coach runs, our server notes how much AI work it took (a count of
            &ldquo;tokens&rdquo;), which AI model ran, the estimated cost, and an ID number for your testimony. These
            records never include your words or your name. The ID number can be matched to you in our database, so
            only the operator can see these records.
          </li>
          <li>
            <b>Basic technical logs.</b> Like most websites, our hosting company keeps short logs of requests (such as
            the time, the page asked for, and the internet address). We keep these for {LEGAL.logRetention}.
          </li>
          <li>
            <b>Cookies.</b> We use only the cookies needed to keep you signed in. No ad or tracking cookies.
          </li>
        </List>
      </Section>

      <Section title="Why we use it">
        <p>
          We use your information only to run RebirthAI: to sign you in, help you write with the coach, show your page
          to the people you choose, make your contact card and QR code, handle reports, keep the service safe from
          abuse, and keep its costs low so it can stay free. We do not sell your information and we do not show ads.
        </p>
      </Section>

      <Section title="What others can see">
        <p>
          <b>Always private:</b> your drafts, your coach conversation, photos and videos you have not published, your
          sign-in email, and your contact details unless you turn sharing on.
        </p>
        <p>
          <b>Seen by others once you publish:</b> your published title and story, the photos and videos in it, your
          name, handle, bio, photo and church. If you turned on contact sharing, anyone who opens your link can see and
          save your phone number and email.
        </p>
        <p>You choose who can find your published page:</p>
        <List>
          <li>
            <b>Unlisted</b> (the starting choice): only people you give your link or QR code to can read it. We ask
            search engines like Google not to list it. Anyone who has the link can still open it and pass it on.
          </li>
          <li>
            <b>Public:</b> anyone can find it, including through Google.
          </li>
        </List>
        <p>
          When your link is shared in a text or chat app, the app may show a preview with your name and your
          story&apos;s title. Changes you make after publishing are not seen by others until you publish again.
        </p>
      </Section>

      <Section title="The AI coach">
        <p>
          When you use the coach, we send your messages and your earlier conversation with the coach to Anthropic, the
          company that makes the Claude AI, so it can write replies, build your draft, and suggest edits. When you ask
          for help with edits, your draft is sent too.
        </p>
        <p>{LEGAL.anthropicDataUse}</p>
        <p>
          The coach uses only what you tell it. It does not make up people, events, quotes or Bible verses. Its edits
          are suggestions you can accept or reject. You are always the final editor.
        </p>
      </Section>

      <Section title="Companies that help us run RebirthAI">
        <List>
          <li>
            <b>Supabase</b> stores our database and your photos and videos, and handles sign-in, including sending
            sign-in emails.
          </li>
          <li>
            <b>Vercel</b> hosts the website.
          </li>
          <li>
            <b>Anthropic</b> runs the AI coach.
          </li>
          <li>
            <b>Google</b> handles sign-in only if you choose &ldquo;Continue with Google&rdquo;.
          </li>
          <li>
            <b>A phone alert service (ntfy)</b>, if we turn it on, tells the operator a page was reported. The alert
            holds only the page link and the time, never the report text or the story.
          </li>
        </List>
      </Section>

      <Section title="How long we keep it, and how to delete it">
        <p>We keep your information while you have an account. You can delete it yourself at any time:</p>
        <List>
          <li>
            <b>Delete my testimony</b> (on the Publish screen) removes your story, your coach conversation, and your
            photos and videos.
          </li>
          <li>
            <b>Delete my account</b> (in Settings) removes everything: your profile, testimony, coach conversation,
            photos and videos, and your sign-in account. This is permanent.
          </li>
        </List>
        <p>Some limits we want you to know about:</p>
        <List>
          <li>
            Copies can stay for a short time in browser caches, link previews in other apps, and our backups before they
            expire.
          </li>
          <li>What the coach has already read to help you write cannot be called back.</li>
          <li>
            Reports and our records of pages taken down are kept for about 90 days after a page or account is deleted.
            By then they are no longer linked to your account; they keep only the handle.
          </li>
          <li>
            Your handle is never given to anyone else, so a saved link can never show a stranger&apos;s story. We keep
            only the handle text for this, with nothing that links it to you. Your old link will say the testimony is
            no longer available.
          </li>
        </List>
        <p>
          If you cannot sign in and want your information deleted, write to {LEGAL.contactEmail}.
        </p>
      </Section>

      <Section title="Keeping it safe">
        <p>
          Our database is set up so only you can open your drafts, conversation and private photos. Unpublished photos
          and videos are shown only through links that expire after a short time. No system is perfectly safe, but we
          work to protect your story.
        </p>
      </Section>

      <Section title="What RebirthAI does not do">
        <p>
          RebirthAI is a writing helper. It is not counseling, and it is not a church or ministry. It does not speak for
          or endorse any church or ministry. If you are in crisis or thinking about suicide, call or text <b>988</b>{" "}
          (Suicide &amp; Crisis Lifeline, U.S.). In an emergency, call 911.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If we change this policy, we will post the new version here and update the date at the top. If a change is
          important, we will tell you in the app.
        </p>
      </Section>

      <Section title="Contact">
        <ContactLine />
        <p>
          See also our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            terms of use
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
