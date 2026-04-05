"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  // ★ログインユーザー取得
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);

        // ★フォロー済み取得
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", data.user.id);

        if (follows) {
          setFollowingIds(follows.map((f) => f.following_id));
        }
      }
    };
    init();
  }, []);

  // ★リアルタイム検索
  useEffect(() => {
    const search = async () => {
      if (!keyword.trim()) {
        setUsers([]);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${keyword}%`)
        .limit(10);

      const filtered = (data || []).filter(
        (u) => u.id !== currentUserId
      );

      setUsers(filtered);
    };

    search();
  }, [keyword, currentUserId]);

  // ★フォロー処理
  const followUser = async (targetUserId: string) => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      alert("ログインしてください");
      return;
    }

    if (followingIds.includes(targetUserId)) {
      alert("すでにフォローしています");
      return;
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: data.user.id,
      following_id: targetUserId,
    });

    if (error) {
      console.error(error);
      alert("フォロー失敗");
      return;
    }

    // ★即反映（重要）
    setFollowingIds([...followingIds, targetUserId]);
  };

  return (
    <main style={{ padding: "24px" }}>
      <h1>ユーザー検索</h1>

      <input
        placeholder="ユーザー名で検索"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "12px",
        }}
      />

      {users.map((u) => {
        const isFollowing = followingIds.includes(u.id);

        return (
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
                backgroundColor: isFollowing ? "#ccc" : "#111",
                color: isFollowing ? "#000" : "#fff",
                borderRadius: "6px",
                padding: "6px 10px",
                border: "none",
                cursor: isFollowing ? "default" : "pointer",
              }}
              onClick={() => !isFollowing && followUser(u.id)}
            >
              {isFollowing ? "フォロー中" : "フォロー"}
            </button>
          </div>
        );
      })}
    </main>
  );
}