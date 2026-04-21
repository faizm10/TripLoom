"use client";
import { useRouter } from "next/navigation";
import { Landing } from "@/components/Landing";

export default function Page() {
  const router = useRouter();
  return <Landing onEnter={() => router.push("/trips")} />;
}
