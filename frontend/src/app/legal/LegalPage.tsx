import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const effectiveDate = 'May 7, 2026';

type LegalSection = {
  title: string;
  body: string;
};

const termsSections: LegalSection[] = [
  {
    title: 'Project Scope',
    body: 'Gallery Book is an open source hobby project for creating, organizing, and sharing gallery content. It is provided for personal and community use, not as a commercial or mission-critical service.',
  },
  {
    title: 'Accounts',
    body: 'You are responsible for the account you create and for keeping your login method secure. If you use Google or GitHub login, those providers also control parts of your authentication experience.',
  },
  {
    title: 'User Content',
    body: 'You keep ownership of content you upload or create. By adding content to Gallery Book, you allow the project to store, process, display, and transmit that content as needed to operate the app.',
  },
  {
    title: 'Acceptable Use',
    body: 'Do not upload content you do not have rights to use, content that violates the law, malware, spam, harassment, or private information about others without permission.',
  },
  {
    title: 'Availability',
    body: 'The project may change, break, go offline, or stop being maintained at any time. Features and data storage are offered without any promise of uninterrupted availability.',
  },
  {
    title: 'No Warranties',
    body: 'Gallery Book is provided as is and as available, without warranties of any kind. Use it at your own risk.',
  },
  {
    title: 'Limitation of Liability',
    body: 'To the fullest extent allowed by law, the project maintainers are not responsible for indirect, incidental, special, consequential, or punitive damages, or for lost data, profits, or goodwill.',
  },
  {
    title: 'Changes',
    body: 'These terms may be updated as the project evolves. Continued use of the app after changes means you accept the updated terms.',
  },
];

const privacySections: LegalSection[] = [
  {
    title: 'Information Collected',
    body: 'Gallery Book may collect account information such as email address, username, display name, avatar, OAuth provider identifiers, and content you create or upload.',
  },
  {
    title: 'Authentication Data',
    body: 'If you sign in with Google or GitHub, Gallery Book receives basic profile information and a verified email address from that provider. Passwords for provider accounts are never received by Gallery Book.',
  },
  {
    title: 'Content and Usage Data',
    body: 'Gallery content, comments, reactions, profile settings, and similar app activity may be stored so the app can provide its core features. Basic technical logs may also be kept for debugging and security.',
  },
  {
    title: 'Cookies and Local Storage',
    body: 'The app uses authentication tokens to keep you signed in. A refresh token may be stored in an HTTP-only cookie, and an access token may be stored in browser local storage.',
  },
  {
    title: 'How Information Is Used',
    body: 'Information is used to operate the app, authenticate users, display galleries, protect accounts, debug issues, and improve the project.',
  },
  {
    title: 'Sharing',
    body: 'Gallery Book does not sell personal information. Information may be shared with infrastructure providers, OAuth providers, or when required for security, legal compliance, or abuse prevention.',
  },
  {
    title: 'Public Content',
    body: 'Content you publish or make visible in the app may be seen by other users or visitors depending on the visibility settings available in the project.',
  },
  {
    title: 'Retention and Deletion',
    body: 'Information may be kept while your account exists or while needed for backups, security, legal, or maintenance reasons. Because this is a hobby project, deletion processes may be manual.',
  },
  {
    title: 'Children',
    body: 'Gallery Book is not intended for children under 13. Do not use the app if you are under 13.',
  },
  {
    title: 'United States',
    body: 'This project is based in the United States. By using it, you understand that information may be processed and stored in the United States.',
  },
];

type LegalPageProps = {
  type: 'terms' | 'privacy';
};

export function LegalPage({ type }: LegalPageProps) {
  const navigate = useNavigate();
  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const sections = isTerms ? termsSections : privacySections;

  return (
    <Dialog open onOpenChange={(open) => !open && navigate('/login')}>
      <DialogContent className="max-h-[86svh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>
            Effective date: {effectiveDate}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5">
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            This is a simple, generic policy for an open source hobby project.
            It is not legal advice.
          </p>

          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold tracking-normal">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
