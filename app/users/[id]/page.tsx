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
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "wishlist">("posts");
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        setCurrentUserId(auth.user.id);
        const { data: follow } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", auth.user.id)
          .eq("following_id", userId)
          .maybeSingle();
        setIsFollowing(!!follow);

        if (follow) {
  // my_restaurantsから取得
  const { data: myData } = await supabase
    .from("my_restaurants")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "want")
    .order("created_at", { ascending: false });

  // wishlistsから取得
  const { data: wishData } = await supabase
    .from("wishlists")
    .select("post_id, posts(id, restaurant, place_id, area)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // wishlistsをmy_restaurantsと同じ形式に変換
  const wishList = (wishData || []).map((w: any) => ({
    id: `wish_${w.post_id}`,
    restaurant: w.posts?.restaurant,
    place_id: w.posts?.place_id,
    area: w.posts?.area,
    status: "want",
    memo: null,
  }));

  setWishlist([...(myData || []), ...wishList]);
}
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      setProfile(profileData);

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
    if (!currentUserId) { alert("ログインしてください"); return; }
    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: userId,
      });
      setIsFollowing(true);
      const { data: myProfile } = await supabase
        .from("profiles").select("username")
        .eq("id", currentUserId).maybeSingle();
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
    <main style={{ padding: "24px", maxWidth: "700px", margin: "0 auto", paddingBottom: "80px" }}>
      <Link href="/" style={{ fontSize: "14px", color: "#2563eb" }}>← ホームに戻る</Link>

      {/* プロフィール */}
      <div style={{ backgroundColor: "#fff", border: "0.5px solid #eee", borderRadius: "16px", padding: "20px", marginTop: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", overflow: "hidden" }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🍽️"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "16px", fontWeight: "600", color: "#111" }}>{profile?.username || "未設定"}</p>
            {profile?.rank_badge && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "#555", backgroundColor: "#fff", border: "1px solid #eee", borderRadius: "20px", padding: "3px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginTop: "4px" }}>
                <span style={{ fontSize: "14px" }}>
                  {profile.rank_badge === "First Bite" ? "🍴" : profile.rank_badge === "ビギナーグルメ" ? "🍽️" : profile.rank_badge === "フーディー" ? "🥘" : profile.rank_badge === "グルメ通" ? "🥇" : profile.rank_badge === "食の探求者" ? "👑" : "🍴"}
                </span>
                {profile.rank_badge}
              </div>
            )}
            <p style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>投稿数: {posts.length}</p>
          </div>
          {currentUserId && currentUserId !== userId && (
            <button onClick={toggleFollow} style={{ padding: "8px 16px", borderRadius: "20px", border: "none", backgroundColor: isFollowing ? "#f0f0f0" : "#111", color: isFollowing ? "#666" : "#fff", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
              {isFollowing ? "フォロー中" : "フォロー"}
            </button>
          )}
        </div>

        {profile?.bio && <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "12px" }}>{profile.bio}</p>}

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
            { key: "🍣 寿司狂い", label: "寿司狂い", icon: "🍣" },
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
                    <div key={badge.key} style={{ padding: "6px 12px", borderRadius: "20px", backgroundColor: earned ? "#f8f8f8" : "transparent", border: earned ? "0.5px solid #ddd" : "0.5px dashed #ddd", fontSize: "12px", color: earned ? "#333" : "#ccc", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ filter: earned ? "none" : "grayscale(1) opacity(0.3)" }}>{badge.icon}</span>
                      {badge.label}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button onClick={() => setActiveTab("posts")} style={{ padding: "8px 20px", borderRadius: "20px", border: "none", backgroundColor: activeTab === "posts" ? "#111" : "#f0f0f0", color: activeTab === "posts" ? "#fff" : "#666", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>投稿一覧</button>
        {isFollowing && (
          <button onClick={() => setActiveTab("wishlist")} style={{ padding: "8px 20px", borderRadius: "20px", border: "none", backgroundColor: activeTab === "wishlist" ? "#111" : "#f0f0f0", color: activeTab === "wishlist" ? "#fff" : "#666", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>🔖 行きたいリスト</button>
        )}
      </div>

      {/* 投稿Tier表示 */}
      {activeTab === "posts" && (
        <>
          {posts.length === 0 && <p style={{ color: "#999", fontSize: "14px" }}>まだ投稿がありません。</p>}
          {[
            { label: "S", color: "#ff4444", bg: "#fff0f0" },
            { label: "A", color: "#ff8800", bg: "#fff8f0" },
            { label: "B", color: "#4CAF50", bg: "#f0fff0" },
            { label: "C", color: "#888", bg: "#f8f8f8" },
          ].map((tier) => {
            const tierPosts = posts.filter((p) => {
              const r = Number(p.rating);
              if (tier.label === "S") return r >= 4.5;
              if (tier.label === "A") return r >= 4.0 && r < 4.5;
              if (tier.label === "B") return r >= 3.5 && r < 4.0;
              return r < 3.5;
            });
            if (tierPosts.length === 0) return null;
            return (
              <div key={tier.label} style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "stretch", borderRadius: "12px", overflow: "hidden", border: "0.5px solid #eee" }}>
                  <div style={{ width: "44px", flexShrink: 0, backgroundColor: tier.bg, display: "flex", alignItems: "center", justifyContent: "center", borderRight: `2px solid ${tier.color}` }}>
                    <span style={{ fontSize: "20px", fontWeight: "900", color: tier.color }}>{tier.label}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", padding: "2px", backgroundColor: "#fff", flex: 1 }}>
                    {tierPosts.map((post) => {
                      const imgs = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : [];
                      return (
                        <div key={post.id} onClick={() => setSelectedPost(post)} style={{ width: "calc(33.33% - 2px)", aspectRatio: "1", overflow: "hidden", cursor: "pointer", position: "relative", backgroundColor: "#f8f8f8" }}>
                          {imgs.length > 0 ? (
                            <img src={imgs[0]} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🍽️</div>
                          )}
                          <div style={{ position: "absolute", bottom: "4px", right: "4px", backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "10px", fontWeight: "600", padding: "2px 5px", borderRadius: "6px" }}>★{Number(post.rating).toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* 行きたいリスト */}
      {activeTab === "wishlist" && (
        <div>
          {wishlist.length === 0 && <p style={{ color: "#999", fontSize: "14px" }}>行きたいリストがありません</p>}
          {wishlist.map((item: any) => (
            <div key={item.id} style={{ backgroundColor: "#fff", border: "0.5px solid #eee", borderRadius: "16px", padding: "14px", marginBottom: "12px" }}>
              <a
                href={item.place_id
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.restaurant)}&query_place_id=${item.place_id}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.restaurant)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "15px", fontWeight: "700", color: "#111", textDecoration: "none", display: "block", marginBottom: "4px" }}
              >
                {item.restaurant}
              </a>
              {item.area && <p style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>📍 {item.area}</p>}
              {item.memo && <p style={{ fontSize: "13px", color: "#555" }}>{item.memo}</p>}
            </div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedPost && (
        <div onClick={() => setSelectedPost(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#fff", borderRadius: "20px", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto" }}>
            {(() => {
              const imgs = selectedPost.images && selectedPost.images.length > 0 ? selectedPost.images : selectedPost.image ? [selectedPost.image] : [];
              return imgs.length > 0 ? (
                <div style={{ display: "flex", overflowX: imgs.length > 1 ? "auto" : "hidden", scrollbarWidth: "none" }}>
                  {imgs.map((url: string, index: number) => (
                    <img key={index} src={url} style={{ width: imgs.length > 1 ? "85vw" : "100%", minWidth: imgs.length > 1 ? "85vw" : "100%", height: "260px", objectFit: "cover", flexShrink: 0, borderRadius: imgs.length === 1 ? "20px 20px 0 0" : "0" }} />
                  ))}
                </div>
              ) : null;
            })()}
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                <a
                  href={selectedPost.place_id
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPost.restaurant)}&query_place_id=${selectedPost.place_id}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPost.restaurant)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "18px", fontWeight: "700", color: "#111", textDecoration: "none" }}
                >
                  {selectedPost.restaurant} 🗺️
                </a>
                {selectedPost.area && <span style={{ fontSize: "12px", color: "#999" }}>📍 {selectedPost.area}</span>}
              </div>
              {selectedPost.genres && selectedPost.genres.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                  {selectedPost.genres.map((genre: string) => (
                    <span key={genre} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", backgroundColor: "#f0f0f0", color: "#555" }}>{genre}</span>
                  ))}
                </div>
              )}
              <p style={{ fontSize: "14px", color: "#f5a623", marginBottom: "10px" }}>★ {Number(selectedPost.rating).toFixed(1)}</p>
              {[selectedPost.must_menu_1, selectedPost.must_menu_2, selectedPost.must_menu_3].filter(Boolean).length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ fontSize: "11px", color: "#bbb", marginBottom: "4px" }}>おすすめメニュー</p>
                  {[{ rank: "🥇", value: selectedPost.must_menu_1 }, { rank: "🥈", value: selectedPost.must_menu_2 }, { rank: "🥉", value: selectedPost.must_menu_3 }].filter(item => item.value).map(({ rank, value }: any) => (
                    <div key={rank} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "12px" }}>{rank}</span>
                      <span style={{ fontSize: "12px", color: "#333" }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: "14px", color: "#111", lineHeight: 1.6, marginBottom: "16px", whiteSpace: "pre-wrap" }}>{selectedPost.comment}</p>
              <p style={{ fontSize: "12px", color: "#bbb", marginBottom: "16px" }}>{selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString("ja-JP") : ""}</p>
              <button onClick={() => setSelectedPost(null)} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "0.5px solid #ddd", backgroundColor: "#fff", color: "#666", fontSize: "14px", cursor: "pointer" }}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}