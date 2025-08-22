import CrowdAnalysisClient from '@/components/crowd-analysis-client';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="container mx-auto max-w-5xl w-full">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-accent font-headline">
            CrowdFlow Insights
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Real-time crowd analysis powered by generative AI. Turn on your camera to begin detecting crowd flow and direction.
          </p>
        </header>
        <CrowdAnalysisClient />
      </div>
    </main>
  );
}
