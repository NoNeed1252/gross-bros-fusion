import React, { useEffect, useState } from "react";
import { supabase } from "@/supabase";

interface LeaderboardEntry {
  id: number;
  address: string;
  score: number;
  wave: number;
}

const truncateAddress = (addr: string) => {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("score", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return;
      }
      setEntries(data as LeaderboardEntry[]);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="overflow-x-auto" style={{ backgroundColor: "#0f172a" }}>
      <table className="min-w-full border" style={{ borderColor: "#2e3f2e" }}>
        <thead>
          <tr className="bg-zinc-950" style={{ color: "#4d7c0f" }}>
            <th className="px-4 py-2 text-left">Rank</th>
            <th className="px-4 py-2 text-left">Address</th>
            <th className="px-4 py-2 text-left">Score</th>
            <th className="px-4 py-2 text-left">Wave</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={entry.id} style={{ color: "#4d7c0f" }}>
              <td className="px-4 py-2">{idx + 1}</td>
              <td className="px-4 py-2">{truncateAddress(entry.address)}</td>
              <td className="px-4 py-2">{entry.score}</td>
              <td className="px-4 py-2">{entry.wave}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
