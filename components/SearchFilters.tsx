'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { subjects } from '@/constants';
import { getSubjectColor } from '@/lib/utils';
import Image from 'next/image';

const SearchFilters = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentSubject = searchParams.get('subject') || '';

  const [searchVal, setSearchVal] = useState(currentSearch);
  const [isPending, startTransition] = useTransition();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchVal });
  };

  const updateParams = (newParams: { search?: string; subject?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newParams.search !== undefined) {
      if (newParams.search) {
        params.set('search', newParams.search);
      } else {
        params.delete('search');
      }
    }

    if (newParams.subject !== undefined) {
      if (newParams.subject) {
        params.set('subject', newParams.subject);
      } else {
        params.delete('subject');
      }
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg w-full relative">
        <input
          type="text"
          placeholder="Search companion by name or topic..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="input rounded-4xl border border-black pl-12 pr-4 py-3 text-lg bg-white w-full shadow-sm"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60">
          <Image
            src="/icons/search.svg"
            alt="Search"
            width={20}
            height={20}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary px-6 rounded-4xl bg-black text-white hover:bg-neutral-800 transition"
        >
          Search
        </button>
      </form>

      {/* Subject Filter Badges */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="font-semibold text-lg mr-2">Subjects:</span>
        <button
          onClick={() => updateParams({ subject: '' })}
          className={`px-4 py-1.5 rounded-4xl border text-sm font-medium capitalize cursor-pointer transition ${
            !currentSubject
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black/30 hover:border-black'
          }`}
        >
          All
        </button>
        {subjects.map((subject) => {
          const color = getSubjectColor(subject);
          const isActive = currentSubject === subject;
          return (
            <button
              key={subject}
              onClick={() => updateParams({ subject: isActive ? '' : subject })}
              className="px-4 py-1.5 rounded-4xl border text-sm font-medium capitalize cursor-pointer transition hover:scale-102"
              style={{
                backgroundColor: isActive ? color : '#ffffff',
                borderColor: isActive ? 'black' : 'rgba(0,0,0,0.15)',
                color: '#000000',
                fontWeight: isActive ? '700' : '500',
              }}
            >
              {subject}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchFilters;
