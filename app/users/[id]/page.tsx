"use client";

import { supabase } from "../../../lib/supabase";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function UserPage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // ログインユーザー取得
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        setCurrentUserId(auth.user.id);

        // フォロー状態確認
        const { data: follow } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", auth.user.id)
          .eq("following_id", userId)
          .maybeSingle();

        setIsFollowing(!!follow);
      }

      // プロフィール取得
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      setProfile(profileData);

      // 投稿取得
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
      setLoading(false);
    };

    init();
  }, [userId]);

  const toggleFollow = async () => {
    if (!currentUserId) {
      alert("ログインしてください");
      return;
    }

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: userId,
      });
      setIsFollowing(true);

      // フォロー通知
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUserId)
        .maybeSingle();
      const myName = myProfile?.username || "ユーザー";

      await supabase.from("notifications").insert({
        user_id: userId,
        from_user_id: currentUserId,
        from_username: myName,
        type: "follow",
        message: `${myName}さんがフォローしました`,
      });
    }
  };

  if (loading) return <main style={{ padding: "24px" }}>読み込み中...</main>;

  return (
    <main style={{
      padding: "24px",
      maxWidth: "700px",
      margin: "0 auto",
      paddingBottom: "80px",
    }}>
      <Link href="/" style={{ fontSize: "14px", color: "#2563eb" }}>
        ← ホームに戻る
      </Link>

      {/* プロフィール */}
      <div style={{
        backgroundColor: "#fff",
        border: "0.5px solid #eee",
        borderRadius: "16px",
        padding: "20px",
        marginTop: "16px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            overflow: "hidden",
          }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : "🍽️"}
          </div>
          {profile?.rank_badge && (
            <div style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              fontSize: "12px",
              backgroundColor: "#fff",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #eee",
            }}>
              {profile.rank_badge === "First Bite" ? "🍴" :
               profile.rank_badge === "ビギナーグルメ" ? "🍽️" :
               profile.rank_badge === "フーディー" ? "🥘" :
               profile.rank_badge === "グルメ通" ? "🥇" :
               profile.rank_badge === "食の探求者" ? "👑" : "🍴"}
            </div>
          )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "#111" }}>
              {profile?.username || "未設定"}
            </p>
            <p style={{ fontSize: "12px", color: "#999" }}>
              投稿数: {posts.length}
            </p>
          </div>
          {currentUserId && currentUserId !== userId && (
            <button
              onClick={toggleFollow}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: isFollowing ? "#f0f0f0" : "#111",
                color: isFollowing ? "#666" : "#fff",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              {isFollowing ? "フォロー中" : "フォロー"}
            </button>
          )}
        </div>

        {profile?.bio && (
          <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "12px" }}>
            {profile.bio}
          </p>
        )}
        {(() => {
          const allBadges = [
            { key: "🍴 First Bite", label: "First Bite", icon: "🍴" },
            { key: "🍽️❤️ 人気の一皿", label: "人気の一皿", icon: "🍽️❤️" },
            { key: "🔥 バズグルメ", label: "バズグルメ", icon: "🔥" },
            { key: "🤖 行きたい製造機", label: "行きたい製造機", icon: "🤖" },
            { key: "📍 街歩きビギナー", label: "街歩きビギナー", icon: "📍" },
            { key: "👣 エリアハンター", label: "エリアハンター", icon: "👣" },
            { key: "🧭 探検家", label: "探検家", icon: "🧭" },
            { key: "🍷 ブルジョワジー", label: "ブルジョワジー", icon: "🍷" },
            { key: "💎 ラグジュアリーマスター", label: "ラグジュアリーマスター", icon: "💎" },
            { key: "🪙 コスパ神", label: "コスパ神", icon: "🪙" },
            { key: "☀️ ランチハンター", label: "ランチハンター", icon: "☀️" },
            { key: "🍣 寿司職人", label: "寿司職人", icon: "🍣" },
            { key: "🍜 ラーメン中毒", label: "ラーメン中毒", icon: "🍜" },
            { key: "🥩 焼肉奉行", label: "焼肉奉行", icon: "🥩" },
            { key: "☕ カフェ巡礼者", label: "カフェ巡礼者", icon: "☕" },
            { key: "🍝 パスタ貴族", label: "パスタ貴族", icon: "🍝" },
            { key: "🍺 飲み歩き職人", label: "飲み歩き職人", icon: "🍺" },
          ];
          const earnedBadges = profile?.badges ?? [];
          return (
            <div style={{ marginTop: "12px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
              <p style={{ fontSize: "13px", color: "#888", marginBottom: "10px" }}>🏅 バッジ</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {allBadges.map((badge) => {
                  const earned = earnedBadges.includes(badge.key);
                  return (
                    <div
                      key={badge.key}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        backgroundColor: earned ? "#f8f8f8" : "transparent",
                        border: earned ? "0.5px solid #ddd" : "0.5px dashed #ddd",
                        fontSize: "12px",
                        color: earned ? "#333" : "#ccc",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span style={{ filter: earned ? "none" : "grayscale(1) opacity(0.3)" }}>
                        {badge.icon}
                      </span>
                      {badge.label}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 投稿一覧 */}
      <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", color: "#111" }}>
        投稿一覧
      </h2>

      {posts.length === 0 && (
        <p style={{ color: "#999", fontSize: "14px" }}>まだ投稿がありません。</p>
      )}

      {posts.map((post) => (
        <div key={post.id} style={{
          backgroundColor: "#fff",
          border: "0.5px solid #eee",
          borderRadius: "16px",
          padding: "14px",
          marginBottom: "12px",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "4px" }}>
            {post.restaurant}
          </h3>
          <p style={{ color: "#f5a623", fontSize: "14px", marginBottom: "4px" }}>
            ★ {Number(post.rating).toFixed(1)}
          </p>
          <p style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>
            {post.created_at ? new Date(post.created_at).toLocaleString("ja-JP") : ""}
          </p>
          <p style={{ fontSize: "13px", color: "#111", lineHeight: 1.6 }}>
            {post.comment}
          </p>
          {post.image && (
            <img
              src={post.image}
              style={{
                width: "100%",
                maxHeight: "200px",
                objectFit: "cover",
                borderRadius: "10px",
                marginTop: "8px",
              }}
            />
          )}
        </div>
      ))}
    </main>
  );
}