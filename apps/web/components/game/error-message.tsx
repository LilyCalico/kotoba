import { TriangleAlertIcon } from "lucide-react";

export const ERROR_TEXT = "Something went wrong. Please send it again.";

export function ErrorMessage() {
  return (
    <p className="mr-auto flex w-fit max-w-[85%] items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm text-card-foreground">
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
      {ERROR_TEXT}
    </p>
  );
}
