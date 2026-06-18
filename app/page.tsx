import CompanionCard from '@/components/CompanionCard';
import CompanionsList from '@/components/CompanionsList';
import CTA from '@/components/CTA';
import { recentSessions } from '@/constants';
import { getSessions } from '@/lib/actions/companion.actions';
import { getSubjectColor } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import Image from 'next/image';

const Page = async () => {
  const { userId } = await auth();
  let userSessions = null;
  let showEmptyState = false;

  if (userId) {
    userSessions = await getSessions();
    if (!userSessions || userSessions.length === 0) {
      showEmptyState = true;
    }
  }

  const mappedSessions = userSessions && userSessions.length > 0
    ? userSessions.slice(0, 5).map((s) => ({
        id: s.id,
        subject: s.subject,
        name: s.name,
        topic: s.topic,
        duration: s.duration,
        color: getSubjectColor(s.subject),
      }))
    : recentSessions;

  return (
    <main>
      <h1>Popular Companions</h1>
      <section className="home-section">
        <CompanionCard
          id="123"
          name="Neura the Brainy Explorer"
          subject="science"
          topic="Neural Network of the Brain"
          duration={45}
          color="#ffda62"
        />
        <CompanionCard
          id="456"
          name="Countsy the Number Wizard"
          subject="maths"
          topic="Derivatives & Integrals"
          duration={30}
          color="#e5d0ff"
        />
        <CompanionCard
          id="789"
          name="Verba the Vocabulary Builder"
          subject="language"
          topic="English Literature"
          duration={30}
          color="#bde7ff"
        />
      </section>

      <section className="home-section">
        {showEmptyState ? (
          <article className="companion-list w-2/3 max-lg:w-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
            <div className="size-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 border border-black/10">
              <Image
                src="/icons/bookmark.svg"
                alt="Empty"
                width={20}
                height={20}
                className="opacity-40"
              />
            </div>
            <h3 className="font-bold text-2xl text-black">Create Your First Companion</h3>
            <p className="text-neutral-500 max-w-sm mt-2">
              You haven&apos;t started any learning sessions yet. Build a custom companion to begin voice-based practice!
            </p>
            <Link href="/companions/new" className="mt-6">
              <button className="btn-primary">
                Build a Companion
              </button>
            </Link>
          </article>
        ) : (
          <CompanionsList
            title="Recently Completed Sessions"
            companions={mappedSessions}
            classNames="w-2/3 max-lg:w-full"
          />
        )}
        <CTA />
      </section>
    </main>
  );
};

export default Page;
