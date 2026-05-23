"use client";

import { supabase } from "../../../lib/supabase";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineType, setTimelineType] = useState<"all" | "follow">("all");
  const [showMembers, setShowMembers] = useState(false);

  const fetchPosts = async (memberIds: string[], type: "all" | "follow", myFollowingIds: string[]) => {
    const targetIds = type === "follow"
      ? memberIds.filter(id => myFollowingIds.includes(id))
      : memberIds;

    if (targetIds.length === 0) {
      setPosts([]);
      return;
    }

    const { data } = await supabase
      .from("posts")
      .select("*, profiles(avatar_url, rank_badge)")
      .in("user_id", targetIds)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.push("/"); return; }
      setUser(auth.user);

      // コミュニティ取得
      const { data: communityData } = await supabase
        .from("communities")
        .select("*")
        .eq("id", communityId)
        .maybeSingle();

      if (!communityData) { router.push("/communities"); return; }
      setCommunity(communityData);

      // メンバー取得
      const { data: memberData } = await supabase
        .from("community_members")
        .select("user_id, profiles(username, avatar_url, rank_badge)")
        .eq("community_id", communityId);

      const memberList = memberData || [];
      setMembers(memberList);
      const memberIds = memberList.map((m: any) => m.user_id);

      // フォロー中取得
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", auth.user.id);

      const myFollowingIds = (follows || []).map((f: any) => f.following_id);
      setFollowingIds(myFollowingIds);

      await fetchPosts(memberIds, "all", myFollowingIds);
      setLoading(false);
    };
    init();
  }, [communityId]);

  useEffect(() => {
    if (members.length === 0) return;
    const memberIds = members.map((m: any) => m.user_id);
    fetchPosts(memberIds, timelineType, followingIds);
  }, [timelineType]);

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = followingIds.includes(targetUserId);

    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      setFollowingIds(followingIds.filter(id => id !== targetUserId));
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
      setFollowingIds([...followingIds, targetUserId]);
    }
  };

  if (loading) return <main style={{ padding: "24px" }}>読み込み中...</main>;

  return (
    <main style={{
      padding: "16px",
      maxWidth: "720px",
      margin: "0 auto",
      paddingBottom: "80px",
      backgroundColor: "#f2f2f7",
      minHeight: "100vh",
    }}>

      {/* ヘッダー */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "16px",
        border: "0.5px solid #eee",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <button
            onClick={() => router.push("/communities")}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", padding: 0 }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "17px", fontWeight: "700", color: "#111" }}>{community.name}</p>
            {community.description && (
              <p style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>{community.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "0.5px solid #ddd",
              backgroundColor: "#fff",
              fontSize: "12px",
              color: "#111",
              cursor: "pointer",
            }}
          >
            👥 {members.length}人
          </button>
        </div>

        {/* 招待リンク */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
  <button
    onClick={() => {
      const url = `https://foodrec.app/join/${community.invite_code}`;
      const text = `「${community.name}」のグルメコミュニティに招待します！FoodRecで友達のおすすめレストランをチェックしよう🍽️`;
      window.open(`https://line.me/R/share?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
    }}
    style={{
      flex: 1,
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#06C755",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    LINE で招待
  </button>
  <button
    onClick={() => {
      const url = `https://foodrec.app/join/${community.invite_code}`;
      const text = `「${community.name}」のグルメコミュニティに招待します！FoodRecで友達のおすすめレストランをチェックしよう🍽️`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    }}
    style={{
      flex: 1,
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#000",
      color: "#fff",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    𝕏 で招待
  </button>
  <button
    onClick={() => {
      const url = `https://foodrec.app/join/${community.invite_code}`;
      navigator.clipboard.writeText(url);
      alert("招待リンクをコピーしました！");
    }}
    style={{
      flex: 1,
      padding: "10px",
      borderRadius: "10px",
      border: "0.5px solid #ddd",
      backgroundColor: "#fff",
      color: "#111",
      fontSize: "13px",
      cursor: "pointer",
    }}
  >
    🔗 コピー
  </button>
</div>
      </div>

      {/* メンバー一覧 */}
      {showMembers && (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "16px",
          border: "0.5px solid #eee",
        }}>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#111", marginBottom: "12px" }}>
            メンバー
          </p>
          {members.map((member: any) => (
            <div key={member.user_id} style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}>
              <div style={{
                width: "40px", height: "40px",
                borderRadius: "50%",
                backgroundColor: "#f0f0f0",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}>
                {member.profiles?.avatar_url
                  ? <img src={member.profiles.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : "🍽️"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>
                  {member.profiles?.username || "ユーザー"}
                </p>
              </div>
              {user && member.user_id !== user.id && (
                <button
                  onClick={() => toggleFollow(member.user_id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: "none",
                    backgroundColor: followingIds.includes(member.user_id) ? "#f0f0f0" : "#111",
                    color: followingIds.includes(member.user_id) ? "#666" : "#fff",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {followingIds.includes(member.user_id) ? "フォロー中" : "フォロー"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* タイムライン切り替え */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={() => setTimelineType("all")}
          style={{
            padding: "8px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: timelineType === "all" ? "#111" : "#f0f0f0",
            color: timelineType === "all" ? "#fff" : "#666",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          全員
        </button>
        <button
          onClick={() => setTimelineType("follow")}
          style={{
            padding: "8px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: timelineType === "follow" ? "#111" : "#f0f0f0",
            color: timelineType === "follow" ? "#fff" : "#666",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          フォロー中
        </button>
      </div>

      {/* 投稿一覧 */}
      {posts.length === 0 && (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "40px 24px",
          textAlign: "center",
          border: "0.5px solid #eee",
        }}>
          <p style={{ fontSize: "14px", color: "#999" }}>
            {timelineType === "follow"
              ? "フォローしているメンバーの投稿がありません"
              : "まだ投稿がありません"}
          </p>
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} style={{
          backgroundColor: "#fff",
          marginBottom: "12px",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          {/* ユーザー情報 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "38px", height: "38px",
                borderRadius: "50%",
                backgroundColor: "#f0f0f0",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}>
                {post.profiles?.avatar_url
                  ? <img src={post.profiles.avatar_url} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : "🍽️"}
              </div>
              <Link href={`/users/${post.user_id}`} style={{ fontSize: "13px", color: "#2563eb", textDecoration: "underline" }}>
                {post.username || "不明"}
              </Link>
            </div>
            {post.created_at && (
              <span style={{ fontSize: "11px", color: "#999" }}>
                {(() => {
                  const d = new Date(post.created_at);
                  const now = new Date();
                  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
                  if (diff < 60) return "たった今";
                  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
                  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
                  return `${d.getMonth() + 1}月${d.getDate()}日`;
                })()}
              </span>
            )}
          </div>

          {/* 投稿内容 */}
          <div style={{ padding: "0 14px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
              
                href={post.place_id
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}&query_place_id=${post.place_id}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "15px", fontWeight: "700", color: "#111", textDecoration: "none" }}
              <a>
                {post.restaurant}
              </a>
              {post.area && (
                <span style={{ fontSize: "11px", color: "#999" }}>📍 {post.area}</span>
              )}
            </div>

            {post.genres && post.genres.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                {post.genres.map((genre: string) => (
                  <span key={genre} style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    backgroundColor: "#f0f0f0",
                    color: "#555",
                  }}>{genre}</span>
                ))}
              </div>
            )}

            <p style={{ fontSize: "13px", color: "#f5a623", marginBottom: "8px" }}>
              ★ {Number(post.rating).toFixed(1)}
            </p>

            {[post.must_menu_1, post.must_menu_2, post.must_menu_3].filter(Boolean).length > 0 && (
              <div style={{ marginBottom: "8px" }}>
                <p style={{ fontSize: "11px", color: "#bbb", marginBottom: "4px" }}>おすすめメニュー</p>
                {[
                  { rank: "🥇", value: post.must_menu_1 },
                  { rank: "🥈", value: post.must_menu_2 },
                  { rank: "🥉", value: post.must_menu_3 },
                ].filter(item => item.value).map(({ rank, value }) => (
                  <div key={rank} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "12px" }}>{rank}</span>
                    <span style={{ fontSize: "12px", color: "#333" }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: "13px", color: "#111", lineHeight: 1.6, marginBottom: "10px", whiteSpace: "pre-wrap" }}>
              {post.comment}
            </p>

            {(() => {
              const imgs = post.images && post.images.length > 0
                ? post.images : post.image ? [post.image] : [];
              if (imgs.length === 0) return null;
              return (
                <div style={{
                  display: "flex",
                  overflowX: imgs.length > 1 ? "auto" : "hidden",
                  gap: "3px",
                  marginBottom: "0",
                  scrollbarWidth: "none",
                }}>
                  {imgs.map((url: string, index: number) => (
                    <img
                      key={index}
                      src={url}
                      loading="lazy"
                      style={{
                        width: imgs.length > 1 ? "75vw" : "100%",
                        minWidth: imgs.length > 1 ? "75vw" : "100%",
                        height: "280px",
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ))}
    </main>
  );
}