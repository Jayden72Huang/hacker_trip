import Image from "next/image";

export function OrganizerIllustration() {
  return (
    <div className="shrink-0 w-48 h-48 md:w-64 md:h-64 relative">
      <Image
        src="/images/organizer-cta.png"
        alt="黑客松主办方数据仪表盘"
        fill
        className="object-contain"
        sizes="(max-width: 768px) 192px, 256px"
      />
    </div>
  );
}
