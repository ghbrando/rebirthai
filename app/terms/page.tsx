import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, LegalPage, List, Section } from "@/components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of use — RebirthAI",
  description: "The rules for using RebirthAI during the private beta.",
};

/** Terms of use (#25). Public, no sign-in. Takedown behavior matches docs/OPERATIONS.md and POLICY §9. */
export default function Page() {
  return (
    <LegalPage title="Terms of use">
      <Section title="Agreeing to these terms">
        <p>
          RebirthAI is run by {LEGAL.operator} (&ldquo;we&rdquo;). By using RebirthAI, you agree to these terms and to
          our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>
          . If you do not agree, please do not use RebirthAI.
        </p>
      </Section>

      <Section title="Who can use RebirthAI">
        <List>
          <li>You must be 18 or older.</li>
          <li>RebirthAI is in a small private beta. It is free to use.</li>
          <li>Each person has one account and one testimony. Keep your sign-in to yourself.</li>
        </List>
      </Section>

      <Section title="Your story belongs to you">
        <p>
          You own what you write and upload: your story, photos and videos. We do not own it and we do not edit it.
        </p>
        <p>
          You give us permission to store, copy and show your content only to run RebirthAI for you. That means keeping
          your drafts, sending your messages to the AI coach, showing your published page to the people your settings
          allow, and making link previews and your contact card. This permission ends when you delete your content or
          your account, except for short-lived copies described in our privacy policy.
        </p>
        <p>
          Only post things you have the right to share. If you upload a photo, video or words made by someone else, make
          sure you are allowed to.
        </p>
      </Section>

      <Section title="The AI coach">
        <p>
          The coach asks questions and helps you put your story into words, using only what you tell it. It can still
          make mistakes. Its edits are suggestions, and you decide what to keep. You are responsible for what you
          publish, so read it carefully and make sure it is true and fair.
        </p>
      </Section>

      <Section title="Other people in your story">
        <p>
          Before you publish, think about anyone you name. Ask yourself whether they have agreed to be named. You can
          change or remove names, publish as Unlisted, or unpublish at any time.
        </p>
      </Section>

      <Section title="What is not allowed">
        <p>Do not use RebirthAI to post or do any of these:</p>
        <List>
          <li>Private details about another person (like their phone number, address or health) without their OK.</li>
          <li>Threats, bullying, harassment, or hate against people for who they are.</li>
          <li>Anything sexual involving a child, or sexual content of anyone without their consent.</li>
          <li>Content that encourages violence, self-harm or crime.</li>
          <li>Things that break the law, or photos, videos or writing you do not have the right to share.</li>
          <li>Pretending to be someone else, or telling someone else&apos;s story as your own.</li>
          <li>Ads, spam, or fundraising.</li>
          <li>
            Trying to get into other people&apos;s accounts or private content, overload the service, or get around its
            limits.
          </li>
        </List>
      </Section>

      <Section title="Reports and taking pages down">
        <p>
          Every published page has a &ldquo;Report this testimony&rdquo; link. A person reviews each report.
        </p>
        <p>
          We can take a page down if it breaks these terms, to keep someone safe, or if the law requires it. Taking a
          page down hides it from visitors and removes its public photos and videos. It does not change your story.
          When you next open the app, you will see why and how to reach us. You cannot publish the page again while it
          is taken down. If we decide to restore it, you can publish it again.
        </p>
        <p>
          If someone seriously or repeatedly breaks these terms, we may end their use of RebirthAI.
        </p>
      </Section>

      <Section title="What RebirthAI does not do">
        <p>
          RebirthAI is a writing helper. It is not counseling (pastoral, medical, legal or crisis), and it is not a
          church or ministry. It does not speak for or endorse any church or ministry. If you are in crisis or thinking
          about suicide, call or text <b>988</b> (Suicide &amp; Crisis Lifeline, U.S.). In an emergency, call 911.
        </p>
      </Section>

      <Section title="A beta, provided as is">
        <p>
          RebirthAI is an early test version. Features may change, break or stop working, and we may end the beta. Keep
          your own copy of anything important to you. To the fullest extent the law allows, RebirthAI is provided
          &ldquo;as is&rdquo;, without promises of any kind, and {LEGAL.operator} is not responsible for losses that
          come from using it.
        </p>
      </Section>

      <Section title="Ending your use">
        <p>
          You can stop at any time. To remove everything, use <b>Delete my account</b> in Settings.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          If we change these terms, we will post the new version here and update the date at the top. If a change is
          important, we will tell you in the app. Using RebirthAI after a change means you accept the new terms.
        </p>
      </Section>

      <Section title="Law that applies">
        <p>These terms are governed by the laws of {LEGAL.governingLaw}.</p>
      </Section>

      <Section title="Contact">
        <ContactLine />
      </Section>
    </LegalPage>
  );
}
