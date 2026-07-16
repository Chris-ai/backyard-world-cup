import { supabase } from "../../../utils/supabase";

export type ActiveChallenge = {
  id: string;
  maxPoints: number;
  name: string;
  sortOrder: number;
  status: "open" | "pending";
};

type ActiveChallengeRow = {
  id: string;
  name: string;
  points: number | null;
  sort_order: number | null;
  status?: "open" | "pending";
};

export async function getActiveOnlineChallenges(): Promise<ActiveChallenge[]> {
  const statusResponse = await supabase
    .from("challenges")
    .select("id,name,points,sort_order,status")
    .in("status", ["open", "pending"])
    .eq("type", "online")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  let rows: ActiveChallengeRow[];
  let error = statusResponse.error;

  if (statusResponse.error?.code === "42703") {
    const legacyResponse = await supabase
      .from("challenges")
      .select("id,name,points,sort_order")
      .eq("isOpen", true)
      .eq("type", "online")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });
    error = legacyResponse.error;
    rows = ((legacyResponse.data ?? []) as Omit<ActiveChallengeRow, "status">[]).map((challenge) => ({
      ...challenge,
      status: "open",
    }));
  } else {
    rows = (statusResponse.data ?? []) as ActiveChallengeRow[];
  }

  if (error) throw error;

  return rows.map((challenge) => ({
    id: challenge.id,
    maxPoints: Number.isFinite(challenge.points) ? Number(challenge.points) : 0,
    name: challenge.name,
    sortOrder: challenge.sort_order ?? Number.MAX_SAFE_INTEGER,
    status: challenge.status ?? "open",
  }));
}
