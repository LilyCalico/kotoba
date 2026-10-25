import { cn } from "cn";

/**
 * ラベル（設問の「Question」、結果の品詞）。ラベンダーの小さなピルで、回答のピルより小さく、アイコンを付けない。
 * 回答のピルと形が近いため、色をラベンダーに限り、文字を小さくして役割を見分けさせる。
 */
export function LabelPill({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex h-6 w-fit items-center rounded-full bg-label px-2.5 text-xs font-medium text-foreground",
        className,
      )}
      id={id}
    >
      {children}
    </p>
  );
}
