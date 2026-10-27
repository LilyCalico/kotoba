import { cn } from "cn";

/**
 * ラベル（結果の品詞）。ラベンダーの小さなピルで、回答のピルより小さく、アイコンを付けない。
 * 設問のタイトルバーと同じラベンダーで、「ものの種類を示す札」の役割をそろえる。
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
