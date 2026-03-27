import { EventTags } from "@/lib/types";

const TAG_LABELS: Record<string, string> = {
  AA: "All Ages", "18": "18+", "21": "21+",
  CB: "Cash Bar", OB: "Open Bar", NA: "No Alcohol",
  M: "Mulligans", NM: "No Mulligans",
  LA: "Live Auction", SA: "Silent Auction",
  "50": "50/50",
};

interface Props {
  tags: string | null;
  size?: "sm" | "md";
}

export default function EventTagBadges({ tags, size = "sm" }: Props) {
  if (!tags) return null;

  let parsed: EventTags;
  try {
    parsed = JSON.parse(tags) as EventTags;
  } catch {
    return null;
  }

  const values = Object.values(parsed).filter(Boolean) as string[];
  if (values.length === 0) return null;

  const cls = size === "sm"
    ? "px-1.5 py-0.5 text-[10px] font-bold rounded"
    : "px-2 py-1 text-xs font-bold rounded";

  return (
    <div className="flex flex-wrap gap-1">
      {values.map(v => (
        <span
          key={v}
          title={TAG_LABELS[v]}
          className={`${cls} bg-[#0B1C3A] text-white`}
        >
          {v}
        </span>
      ))}
    </div>
  );
}
