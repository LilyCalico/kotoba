export function PlayerMessage({ text }: { text: string }) {
  return (
    <p className="ml-auto w-fit max-w-[85%] rounded-md bg-secondary px-4 py-2 text-sm text-secondary-foreground">
      {text}
    </p>
  );
}
