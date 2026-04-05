"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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

      // ★フォロワー取得（自分をフォローしてる人）
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

      // ★ユーザー情報取得
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", ids);

      if (profileError) {
        console.error("プロフィール取得エラー:", profileError);
        setLoading(false);
        return;
      }

      setUsers(profiles || []);
      setLoading(false);
    };

    fetchFollowers();
  }, []);

  if (loading) {
    return <p style={{ padding: "24px" }}>読み込み中...</p>;
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>フォロワー一覧</h1>

      {users.length === 0 && (
        <p>フォロワーはいません</p>
      )}

      {users.map((u) => (
        <div
          key={u.id}
          style={{
            padding: "10px",
            borderBottom: "1px solid #eee",
          }}
        >
          {u.username}
        </div>
      ))}
    </main>
  );
}