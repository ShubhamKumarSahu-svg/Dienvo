import { getCompanions } from '@/lib/actions/companion.actions';
import CompanionCard from '@/components/CompanionCard';
import SearchFilters from '@/components/SearchFilters';
import { getSubjectColor } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    subject?: string;
  }>;
}

const CompanionsLibrary = async ({ searchParams }: PageProps) => {
  const resolvedParams = await searchParams;
  const search = resolvedParams.search || '';
  const subject = resolvedParams.subject || '';

  // Get user's custom companions
  const customCompanions = await getCompanions();

  // Popular companion templates
  const popularCompanions = [
    {
      id: '123',
      name: 'Neura the Brainy Explorer',
      subject: 'science',
      topic: 'Neural Network of the Brain',
      duration: 45,
      color: '#ffda62',
    },
    {
      id: '456',
      name: 'Countsy the Number Wizard',
      subject: 'maths',
      topic: 'Derivatives & Integrals',
      duration: 30,
      color: '#e5d0ff',
    },
    {
      id: '789',
      name: 'Verba the Vocabulary Builder',
      subject: 'language',
      topic: 'English Literature',
      duration: 30,
      color: '#bde7ff',
    },
  ];

  // Map custom companions to include colors from our utility
  const mappedCustom = customCompanions.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    topic: c.topic,
    duration: c.duration,
    color: getSubjectColor(c.subject) || '#e5d0ff',
  }));

  // Combine lists
  const allCompanions = [...popularCompanions, ...mappedCustom];

  // Filter based on search params
  const filteredCompanions = allCompanions.filter((companion) => {
    const matchesSearch =
      !search ||
      companion.name.toLowerCase().includes(search.toLowerCase()) ||
      companion.topic.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      !subject || companion.subject.toLowerCase() === subject.toLowerCase();

    return matchesSearch && matchesSubject;
  });

  return (
    <main>
      <div className="flex flex-col gap-3">
        <h1>Companion Library</h1>
        <p className="text-muted-foreground text-lg">
          Browse popular learning companions or build your own custom tutor with personalized personality, subject, voice, and topic focus.
        </p>
      </div>

      <SearchFilters />

      <section className="companions-grid mt-4">
        {/* Dash-border "Create Companion" card */}
        <article className="companion-card border-dashed border-2 bg-neutral-50/50 hover:bg-neutral-50/100 border-black/30 hover:border-black flex items-center justify-center p-8 min-h-[260px] transition group">
          <Link href="/companions/new" className="flex flex-col items-center gap-4 text-center cursor-pointer">
            <div className="size-16 rounded-full border border-black flex items-center justify-center bg-white group-hover:scale-105 transition shadow-sm">
              <Image
                src="/icons/plus.svg"
                alt="Create"
                width={20}
                height={20}
              />
            </div>
            <div>
              <h3 className="font-bold text-xl text-black">Create Custom Companion</h3>
              <p className="text-sm text-muted-foreground mt-1">Design a companion for your custom learning topics</p>
            </div>
          </Link>
        </article>

        {/* Filtered Companions */}
        {filteredCompanions.map((companion) => (
          <CompanionCard
            key={companion.id}
            id={companion.id}
            name={companion.name}
            subject={companion.subject}
            topic={companion.topic}
            duration={companion.duration}
            color={companion.color}
          />
        ))}

        {filteredCompanions.length === 0 && (
          <div className="w-full text-center py-16 flex flex-col items-center gap-3">
            <p className="text-xl font-semibold text-neutral-600">No companions found matching your criteria.</p>
            <p className="text-neutral-500">Try clearing the search query or selecting a different subject.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default CompanionsLibrary;
