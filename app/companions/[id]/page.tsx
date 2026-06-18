import { getCompanionById } from '@/lib/actions/companion.actions';
import CompanionSessionClient from '@/components/CompanionSessionClient';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const CompanionSession = async ({ params }: PageProps) => {
  // Await params in Next.js 15
  const resolvedParams = await params;
  const companionId = resolvedParams.id;

  // Retrieve current Clerk user
  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  // Fetch companion configuration
  const companion = await getCompanionById(companionId);
  if (!companion) {
    redirect('/companions');
  }

  const userName = user.firstName || user.username || 'Student Explorer';
  const userImage = user.imageUrl || '/icons/default-avatar.svg';

  return (
    <main className="w-full max-w-[1400px] mx-auto px-14 max-sm:px-4 pt-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span>Voice Session</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Interact with your companion using natural spoken dialogue to study this topic.
        </p>
      </div>

      <CompanionSessionClient
        companionId={companionId}
        subject={companion.subject}
        topic={companion.topic}
        name={companion.name}
        userName={userName}
        userImage={userImage}
        voice={companion.voice || 'female'}
        style={companion.style || 'casual'}
      />
    </main>
  );
};

export default CompanionSession;
