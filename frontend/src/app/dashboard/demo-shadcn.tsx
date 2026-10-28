import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Your learning space</p>
          <h1 className="text-3xl font-bold tracking-tight">CyberSmart workplace</h1>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/modules">
            Continue learning
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
