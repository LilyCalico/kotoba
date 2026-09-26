import Image from "next/image";

const LEAF_SIZE = 49;

/** 草案の 402 × 874 のフレームで引かれた座標を、画面幅に対する比率に直したもの。 */
const POSITIONS = {
  start: [
    { left: "79.1%", top: "7.0%" },
    { left: "22.1%", top: "25.1%" },
    { left: "37.8%", top: "87.6%" },
  ],
  teaser: [
    { left: "19.2%", top: "7.1%" },
    { left: "78.6%", top: "22.8%" },
    { left: "50.0%", top: "77.8%" },
  ],
} as const;

export function LeafScatter({
  variant = "start",
}: {
  variant?: keyof typeof POSITIONS;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {POSITIONS[variant].map((position) => (
        <Image
          alt=""
          className="absolute"
          height={LEAF_SIZE}
          key={position.left}
          loading="eager"
          src="/leaf.png"
          style={position}
          width={LEAF_SIZE}
        />
      ))}
    </div>
  );
}
