import type { ReactNode } from "react";

interface ReportSectionProps {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Numbered printable report section — turns raw tables into structured information. */
export function ReportSection({ number, title, description, children }: ReportSectionProps) {
  return (
    <section className="space-y-3 border-t border-black/10 pt-5 first:border-t-0 first:pt-0">
      <header className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/55">
          Section {number}
        </p>
        <h2 className="text-base font-bold text-black">{title}</h2>
        {description ? <p className="text-sm leading-6 text-black/75">{description}</p> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}

interface ReportNarrativeProps {
  paragraphs: string[];
  bullets?: string[];
  note?: string;
}

/** Prose interpretation block for printable reports. */
export function ReportNarrative({ paragraphs, bullets, note }: ReportNarrativeProps) {
  return (
    <div className="space-y-3 rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-6 text-black/85">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {bullets && bullets.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5">
          {bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {note ? <p className="text-xs italic text-black/65">{note}</p> : null}
    </div>
  );
}
