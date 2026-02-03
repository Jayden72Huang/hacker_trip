'use client';

import { useMemo, useState } from 'react';
import { Hero } from '@/components/Hero';
import { Navbar } from '@/components/Navbar';
import { Timeline } from '@/components/Timeline';
import { EventDetail } from '@/components/EventDetail';
import { Footer } from '@/components/Footer';
import { hackathons } from '@/data/hackathons';

export default function Home() {
  const defaultId = useMemo(() => {
    const upcoming = hackathons.find((h) => !h.isPast);
    return upcoming ? upcoming.id : hackathons[0].id;
  }, []);

  const [selectedId, setSelectedId] = useState<string>(defaultId);
  const selected = hackathons.find((h) => h.id === selectedId) ?? hackathons[0];

  return (
    <div className="relative min-h-screen pb-12">
      <div className="fixed inset-0 -z-10 grid-bg-optimized opacity-30" aria-hidden />
      <Navbar />
      <main className="pt-10">
        <Hero />
        <Timeline selectedId={selectedId} onSelect={setSelectedId} />
        <EventDetail hackathon={selected} />
      </main>
      <Footer />
    </div>
  );
}
