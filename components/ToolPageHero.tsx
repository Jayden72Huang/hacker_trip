interface ToolPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  backgroundImage: string;
}

export function ToolPageHero({
  eyebrow,
  title,
  description,
  backgroundImage,
}: ToolPageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-32 pb-24 md:pt-36 md:pb-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-[560px]" aria-hidden>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060a]/15 via-[#05060a]/42 to-[#05060a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060a]/90 via-[#05060a]/18 to-[#05060a]/90" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent via-[#05060a]/82 to-[#05060a]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-sm text-white/60 backdrop-blur-md">
          {eyebrow}
        </div>
        <h1 className="bg-gradient-to-r from-[#7c5dff] via-[#c759ff] to-[#4de1ff] bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/55">
          {description}
        </p>
      </div>
    </section>
  );
}
