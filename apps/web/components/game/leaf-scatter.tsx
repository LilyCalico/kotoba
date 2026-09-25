import Image from "next/image";

const POSITIONS = [
  { left: "19%", top: "7%" },
  { left: "79%", top: "23%" },
  { left: "38%", top: "78%" },
];

export function LeafScatter() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {POSITIONS.map((position) => (
        <Image
          key={position.left}
          alt=""
          className="absolute"
          height={49}
          loading="eager"
          src="/leaf.png"
          style={position}
          width={49}
        />
      ))}
    </div>
  );
}
