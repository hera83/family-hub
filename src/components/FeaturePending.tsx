import { Clock } from "lucide-react";

interface FeaturePendingProps {
  title: string;
  description?: string;
}

export function FeaturePending({ title, description }: FeaturePendingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <div className="rounded-full bg-muted p-4">
        <Clock className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description || "Denne funktion bliver aktiveret, når API-endpointet er klar."}
        </p>
      </div>
    </div>
  );
}
