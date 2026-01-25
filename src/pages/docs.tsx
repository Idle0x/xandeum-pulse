import { useState } from 'react';
import Head from 'next/head';
import { DocShell } from '../components/docs/layout/DocShell';
import { TopRail } from '../components/docs/layout/TopRail';
import { NavigatorPod } from '../components/docs/layout/NavigatorPod';

// --- CHAPTER IMPORTS ---
import { BootChapter } from '../components/docs/chapters/00_Boot';
import { FlightChapter } from '../components/docs/chapters/01_Flight';
import { ManualChapter } from '../components/docs/chapters/02_Manual';
import { TelemetryChapter } from '../components/docs/chapters/03_Telemetry';
import { InspectorChapter } from '../components/docs/chapters/04_Inspector';
import { CompareChapter } from '../components/docs/chapters/05_Compare';
import { BrainChapter } from '../components/docs/chapters/06_Brain';
import { TemporalChapter } from '../components/docs/chapters/07_Temporal';
import { SynthesisChapter } from '../components/docs/chapters/08_Synthesis';
import { SpatialChapter } from '../components/docs/chapters/09_Spatial';
import { EconomicsChapter } from '../components/docs/chapters/10_Economics';
import { EngineeringChapter } from '../components/docs/chapters/11_Engineering';
import { TerminalChapter } from '../components/docs/chapters/12_Terminal';

export type ChapterID = 
  'BOOT' | 'FLIGHT' | 'MANUAL' | 'TELEMETRY' | 'INSPECTOR' | 'COMPARE' | 
  'BRAIN' | 'TEMPORAL' | 'SYNTHESIS' | 'SPATIAL' | 'ECONOMICS' | 'ENGINEERING' | 'TERMINAL';

export const CHAPTERS = [
  { id: 'BOOT', title: 'System Initialization', color: 'blue' },
  { id: 'FLIGHT', title: 'Flight School', color: 'blue' },
  { id: 'MANUAL', title: 'Field Manual', color: 'green' },
  { id: 'TELEMETRY', title: 'Telemetry & UX', color: 'emerald' },
  { id: 'INSPECTOR', title: 'Diagnostics Suite', color: 'red' },
  { id: 'COMPARE', title: 'Comparative Intelligence', color: 'purple' },
  { id: 'BRAIN', title: 'Neural Core', color: 'indigo' },
  { id: 'TEMPORAL', title: 'Temporal Persistence', color: 'orange' },
  { id: 'SYNTHESIS', title: 'Narrative Engine', color: 'pink' },
  { id: 'SPATIAL', title: 'Spatial Topology', color: 'cyan' },
  { id: 'ECONOMICS', title: 'Economics', color: 'yellow' },
  { id: 'ENGINEERING', title: 'Engineering', color: 'zinc' },
  { id: 'TERMINAL', title: 'Terminal', color: 'gray' },
];

export default function DocsPage() {
  const [activeChapter, setActiveChapter] = useState<ChapterID>('BOOT');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'NEXT' | 'PREV'>('NEXT');

  const changeChapter = (id: ChapterID) => {
    if (id === activeChapter) return;
    const currentIndex = CHAPTERS.findIndex(c => c.id === activeChapter);
    const newIndex = CHAPTERS.findIndex(c => c.id === id);
    
    setDirection(newIndex > currentIndex ? 'NEXT' : 'PREV');
    setIsTransitioning(true);
    
    setTimeout(() => {
      setActiveChapter(id);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const nextChapter = () => {
    const currentIndex = CHAPTERS.findIndex(c => c.id === activeChapter);
    if (currentIndex < CHAPTERS.length - 1) {
      changeChapter(CHAPTERS[currentIndex + 1].id as ChapterID);
    }
  };

  return (
    <DocShell>
      <Head>
        <title>Operator Manual v3.0 - Xandeum Pulse</title>
      </Head>

      <TopRail activeChapter={activeChapter} chapters={CHAPTERS} />

      <main className="flex-1 relative pt-16 pb-32 overflow-y-auto scrollbar-hide">
        <div className={`transition-all duration-300 ease-in-out ${isTransitioning ? (direction === 'NEXT' ? '-translate-x-10 opacity-0' : 'translate-x-10 opacity-0') : 'translate-x-0 opacity-100'}`}>
            
            {/* The 12-Step Journey */}
            {activeChapter === 'BOOT' && <BootChapter onStart={() => changeChapter('FLIGHT')} />}
            {activeChapter === 'FLIGHT' && <FlightChapter />}
            {activeChapter === 'MANUAL' && <ManualChapter />}
            {activeChapter === 'TELEMETRY' && <TelemetryChapter />}
            {activeChapter === 'INSPECTOR' && <InspectorChapter />}
            {activeChapter === 'COMPARE' && <CompareChapter />}
            {activeChapter === 'BRAIN' && <BrainChapter />}
            {activeChapter === 'TEMPORAL' && <TemporalChapter />}
            {activeChapter === 'SYNTHESIS' && <SynthesisChapter />}
            {activeChapter === 'SPATIAL' && <SpatialChapter />}
            {activeChapter === 'ECONOMICS' && <EconomicsChapter />}
            {activeChapter === 'ENGINEERING' && <EngineeringChapter />}
            {activeChapter === 'TERMINAL' && <TerminalChapter />}

        </div>
      </main>

      <NavigatorPod 
        activeChapter={activeChapter} 
        chapters={CHAPTERS} 
        onChange={changeChapter as any} 
        onNext={nextChapter}
      />
    </DocShell>
  );
}