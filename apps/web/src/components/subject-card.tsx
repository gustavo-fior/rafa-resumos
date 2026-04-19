import { Card, CardContent } from "@rafa-resumos/ui/components/card";
import type { Route } from "next";
import Link from "next/link";

type SubjectCardProps = {
  href?: string;
  onClick?: () => void;
  subject: {
    id: string;
    name: string;
    slug: string;
  };
};

function parseSubjectName(raw: string) {
  const trimmed = raw.trim();
  const spaceIdx = trimmed.indexOf(" ");

  if (spaceIdx === -1) {
    return { emoji: null, label: trimmed };
  }

  const first = trimmed.slice(0, spaceIdx);
  const rest = trimmed.slice(spaceIdx + 1).trim();

  if (!rest || /[\p{L}\p{N}]/u.test(first)) {
    return { emoji: null, label: trimmed };
  }

  return { emoji: first, label: rest };
}

export default function SubjectCard({
  href,
  onClick,
  subject,
}: SubjectCardProps) {
  const { emoji, label } = parseSubjectName(subject.name);
  const cardContent = (
    <Card className="h-full transition-colors group-hover:bg-muted/30 cursor-pointer">
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col items-start gap-2">
          {emoji ? (
            <span aria-hidden className="text-xl leading-none">
              {emoji}
            </span>
          ) : null}
          <h3 className="text-sm font-medium leading-snug line-clamp-2">
            {label}
          </h3>
        </div>
      </CardContent>
    </Card>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group block w-full text-left"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <Link href={href as Route} className="group block">
      {cardContent}
    </Link>
  );
}
