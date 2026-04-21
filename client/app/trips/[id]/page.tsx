import { notFound } from "next/navigation";
import { Workspace } from "@/components/Workspace";
import { TRIP } from "@/lib/data";

export default function Page({ params }: { params: { id: string } }) {
  if (params.id !== TRIP.id) return notFound();
  return <Workspace />;
}
