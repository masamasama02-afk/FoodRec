"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function FollowsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ★フォロー一覧取得
  const fetchFollows = async () => {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      alert("ログインしてください");
      setLoading(false);
      return;
    }

    setCurrentUserId(authData.user.id);

    const { data: follows, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", authData.user.id);

    if (error) {
      console.error("follows取得エラー:", error);
      setLoading(false);
      return;
    }

    const ids = follows?.map((f) => f.following_id) || [];

    if (ids.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", ids);

    if (profileError) {
      console.error("profiles取得エラー:", profileError);
      setLoading(false);
      return;
    }

    setUsers(profiles || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFollows();
  }, []);

  // ★アンフォロー
  const unfollowUser = async (targetUserId: string) => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("アンフォローエラー:", error);
      alert("アンフォロー失敗");
      return;
    }

    // ★即反映
    setUsers(users.filter((u) => u.id !== targetUserId));
  };

  if (loading) {
    return <p style={{ padding: "24px" }}>読み込み中...</p>;
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>フォロー一覧</h1>

      {users.length === 0 && (
        <p>フォローしているユーザーはいません</p>
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

          <button
            style={{
              marginLeft: "10px",
              backgroundColor: "#eee",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => unfollowUser(u.id)}
          >
            フォロー解除
          </button>
        </div>
      ))}
    </main>
  );
}