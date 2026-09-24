import { BackLink } from "@/components/meetcast/back-link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-muted-foreground">
        That room or invite link does not exist.
      </p>
      <BackLink href="/" label="Home" />
    </div>
  );
}
