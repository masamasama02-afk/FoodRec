"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function FollowersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        alert("ログインしてください");
        setLoading(false);
        return;
      }

      const { data: follows, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", authData.user.id);

      if (error) {
        console.error("フォロワー取得エラー:", error);
        setLoading(false);
        return;
      }

      const ids = follows?.map((f) => f.follower_id) || [];

      if (ids.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);

      setUsers(profiles || []);
      setLoading(false);
    };

    fetchFollowers();
  }, []);

  if (loading) {
    return <p style={{ padding: "24px" }}>読み込み中...</p>;
  }

  return (
    <main style={{
      padding: "24px",
      maxWidth: "700px",
      margin: "0 auto",
      paddingBottom: "80px",
    }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ fontSize: "14px", color: "#2563eb" }}>
          ← ホームに戻る
        </Link>
      </div>

      <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111", marginBottom: "16px" }}>
        フォロワー一覧
      </h1>

      {users.length === 0 && (
        <p style={{ color: "#999", fontSize: "14px" }}>まだフォロワーはいません</p>
      )}

      {users.map((u) => (
        <Link
          key={u.id}
          href={`/users/${u.id}`}
          style={{ textDecoration: "none" }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 14px",
            backgroundColor: "#fff",
            border: "0.5px solid #eee",
            borderRadius: "12px",
            marginBottom: "8px",
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              {u.avatar_url ? (
                <img src={u.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : "🍽️"}
            </div>
            <p style={{ fontSize: "14px", fontWeight: "500", color: "#111" }}>
              {u.username || "未設定"}
            </p>
          </div>
        </Link>
      ))}
    </main>
  );
}