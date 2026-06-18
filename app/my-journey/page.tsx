import { getSessions } from '@/lib/actions/companion.actions';
import CompanionsList from '@/components/CompanionsList';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSubjectColor } from '@/lib/utils';

const Profile = async () => {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  // Fetch logged sessions
  const sessions = await getSessions();

  // Compute stats
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalSessions = sessions.length;

  // Determine favorite subject
  const subjectCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.subject) {
      subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
    }
  });

  let favoriteSubject = 'None';
  let maxCount = 0;
  Object.entries(subjectCounts).forEach(([subj, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteSubject = subj;
    }
  });

  const favoriteColor = favoriteSubject !== 'None' ? getSubjectColor(favoriteSubject) : '#f3f4f6';

  // Map sessions to match CompanionsList requirements (e.g., matching the 'id' field)
  const mappedSessions = sessions.map((s) => ({
    id: s.id,
    subject: s.subject,
    name: s.name,
    topic: s.topic,
    duration: s.duration,
    color: getSubjectColor(s.subject),
  }));

  const userName = user.firstName || user.username || 'Student';

  return (
    <main>
      <div className="flex flex-col gap-3">
        <h1>My Learning Journey</h1>
        <p className="text-muted-foreground text-lg">
          Track your progress, total active learning time, and details of all completed AI tutoring sessions.
        </p>
      </div>

      {/* Stats Dashboard Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
        {/* Card 1: Total Study Time */}
        <div className="rounded-border p-6 bg-white flex items-center gap-5 shadow-sm">
          <div className="size-14 rounded-2xl flex items-center justify-center bg-[#FFDA6E] border border-black/10">
            <Image
              src="/icons/clock.svg"
              alt="Clock"
              width={26}
              height={26}
            />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Practice Time</p>
            <h3 className="text-3xl font-bold text-black mt-1">{totalMinutes}</h3>
            <p className="text-xs text-neutral-400 mt-1">Total learning minutes logged</p>
          </div>
        </div>

        {/* Card 2: Completed Sessions */}
        <div className="rounded-border p-6 bg-white flex items-center gap-5 shadow-sm">
          <div className="size-14 rounded-2xl flex items-center justify-center bg-[#BDE7FF] border border-black/10">
            <Image
              src="/icons/cap.svg"
              alt="Sessions"
              width={28}
              height={28}
            />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Sessions</p>
            <h3 className="text-3xl font-bold text-black mt-1">{totalSessions}</h3>
            <p className="text-xs text-neutral-400 mt-1">Completed voice dialogs</p>
          </div>
        </div>

        {/* Card 3: Top Subject */}
        <div className="rounded-border p-6 bg-white flex items-center gap-5 shadow-sm">
          <div
            className="size-14 rounded-2xl flex items-center justify-center border border-black/10"
            style={{ backgroundColor: favoriteColor }}
          >
            <Image
              src={favoriteSubject !== 'None' ? `/icons/${favoriteSubject}.svg` : '/icons/bookmark.svg'}
              alt="Subject"
              width={26}
              height={26}
              className={favoriteSubject === 'None' ? 'opacity-40' : ''}
            />
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Top Subject</p>
            <h3 className="text-2xl font-bold text-black mt-1 capitalize">{favoriteSubject}</h3>
            <p className="text-xs text-neutral-400 mt-1">
              {maxCount > 0 ? `${maxCount} session${maxCount > 1 ? 's' : ''} completed` : 'No lessons logged yet'}
            </p>
          </div>
        </div>
      </section>

      {/* Completed Sessions Table */}
      <section className="w-full mt-4 flex gap-6 max-lg:flex-col items-start justify-between">
        {mappedSessions.length > 0 ? (
          <CompanionsList
            title="Completed Sessions History"
            companions={mappedSessions}
            classNames="w-2/3 max-lg:w-full"
          />
        ) : (
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
            <h3 className="font-bold text-2xl text-black">No Sessions Logged Yet</h3>
            <p className="text-neutral-500 max-w-sm mt-2">
              You haven&apos;t completed any voice dialogue sessions yet. Launch a companion lesson to start learning!
            </p>
            <Link href="/companions" className="mt-6">
              <button className="btn-primary">
                Explore Companions
              </button>
            </Link>
          </article>
        )}

        {/* Sidebar Info Card */}
        <article className="cta-section bg-neutral-900 text-white rounded-4xl p-8 flex flex-col gap-5 w-1/3 max-lg:w-full">
          <div className="cta-badge bg-orange-500 text-white text-xs font-bold w-fit">
            Next Milestone
          </div>
          <h3 className="text-2xl font-bold">Level Up Your Knowledge</h3>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Practice at least 15 minutes daily with your tutors to develop vocabulary retention, mathematical intuition, and science conceptual frameworks.
          </p>
          <div className="flex items-center gap-3 mt-2 border-t border-white/10 pt-4">
            <div className="size-10 rounded-full overflow-hidden bg-neutral-800 relative">
              <Image
                src={user.imageUrl || '/icons/default-avatar.svg'}
                alt={userName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400">Keep going,</p>
              <p className="text-sm font-bold text-white">{userName}!</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
};

export default Profile;
