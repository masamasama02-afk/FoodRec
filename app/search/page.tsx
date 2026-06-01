"use client";

import { supabase } from "../../lib/supabase";
import { useState, useEffect } from "react";
import Link from "next/link";

declare const google: any;

type Post = {
  id: number;
  restaurant: string;
  comment: string;
  rating: number;
  image: string;
  images?: string[];
  genres?: string[];
  area?: string;
  username?: string;
  user_id?: string;
  place_id?: string;
  lat?: number;
  lng?: number;
  must_menu_1?: string;
  must_menu_2?: string;
  must_menu_3?: string;
};

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "places">("posts");
  const [places, setPlaces] = useState<any[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUser(data.user);

      // 保存済みのplace_idを取得
      const { data: saved } = await supabase
        .from("my_restaurants")
        .select("place_id")
        .eq("user_id", data.user.id)
        .eq("status", "want");
      setSavedPlaceIds((saved || []).map((s: any) => s.place_id).filter(Boolean));
    };
    init();
  }, []);

  const search = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data: textData } = await supabase
      .from("posts")
      .select("*, profiles(avatar_url)")
      .or(`area.ilike.%${keyword}%,restaurant.ilike.%${keyword}%,comment.ilike.%${keyword}%`)
      .order("created_at", { ascending: false });

    const { data: allPosts } = await supabase
      .from("posts")
      .select("*, profiles(avatar_url)")
      .order("created_at", { ascending: false });

    const genreMatched = (allPosts || []).filter(p =>
      p.genres?.some((g: string) => g.includes(keyword))
    );

    const merged = [...(textData || []), ...genreMatched];
    const unique = merged.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);

    setPosts(unique);
    setLoading(false);
  };

  const searchPlaces = () => {
    if (!keyword.trim()) return;
    if (typeof google === "undefined") return;
    setPlacesLoading(true);
    setSearched(true);

    const service = new google.maps.places.PlacesService(document.createElement("div"));
    service.textSearch(
      { query: keyword, type: "restaurant" },
      (results: any[], status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPlaces(results.slice(0, 20));
        } else {
          setPlaces([]);
        }
        setPlacesLoading(false);
      }
    );
  };

  const handleSearch = () => {
    if (activeTab === "posts") {
      search();
    } else {
      searchPlaces();
    }
  };

  const toggleWant = async (place: any) => {
    if (!user) { alert("ログインしてください"); return; }

    const placeId = place.place_id;
    const alreadySaved = savedPlaceIds.includes(placeId);

    if (alreadySaved) {
      await supabase
        .from("my_restaurants")
        .delete()
        .eq("user_id", user.id)
        .eq("place_id", placeId);
      setSavedPlaceIds(savedPlaceIds.filter(id => id !== placeId));
    } else {
      // エリア取得
      let area = "";
      if (place.formatted_address) {
        const parts = place.formatted_address.split("、");
        area = parts[parts.length - 2] || "";
      }

      await supabase.from("my_restaurants").insert({
        user_id: user.id,
        restaurant: place.name,
        place_id: placeId,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
        area: area,
        status: "want",
        memo: null,
      });
      setSavedPlaceIds([...savedPlaceIds, placeId]);
    }
  };

  return (
    <main style={{
      padding: "16px",
      maxWidth: "720px",
      margin: "0 auto",
      paddingBottom: "80px",
      backgroundColor: "#f2f2f7",
      minHeight: "100vh",
    }}>
      <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#111", marginBottom: "16px" }}>
        🔍 検索
      </h1>

      {/* タブ */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            padding: "8px 20px", borderRadius: "20px", border: "none",
            backgroundColor: activeTab === "posts" ? "#111" : "#f0f0f0",
            color: activeTab === "posts" ? "#fff" : "#666",
            fontSize: "13px", fontWeight: "500", cursor: "pointer",
          }}
        >📝 投稿から探す</button>
        <button
          onClick={() => setActiveTab("places")}
          style={{
            padding: "8px 20px", borderRadius: "20px", border: "none",
            backgroundColor: activeTab === "places" ? "#111" : "#f0f0f0",
            color: activeTab === "places" ? "#fff" : "#666",
            fontSize: "13px", fontWeight: "500", cursor: "pointer",
          }}
        >🗺️ 全国から探す</button>
      </div>

      {/* 検索バー */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          placeholder={activeTab === "posts" ? "エリア・ジャンルで検索（例: 渋谷、焼肉）" : "レストラン名・エリアで検索"}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: "12px",
            border: "0.5px solid #e0e0e0", backgroundColor: "#fff",
            fontSize: "14px", color: "#111", outline: "none",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "12px 20px", borderRadius: "12px", border: "none",
            backgroundColor: "#111", color: "#fff",
            fontSize: "14px", fontWeight: "600", cursor: "pointer",
          }}
        >検索</button>
      </div>

      {/* ローディング */}
      {(loading || placesLoading) && (
        <p style={{ color: "#999", fontSize: "14px", textAlign: "center" }}>検索中...</p>
      )}

      {/* 投稿検索結果 */}
      {activeTab === "posts" && (
        <>
          {searched && !loading && posts.length === 0 && (
            <p style={{ color: "#999", fontSize: "14px", textAlign: "center" }}>
              「{keyword}」に該当する投稿が見つかりませんでした
            </p>
          )}
          {posts.length > 0 && (
            <p style={{ fontSize: "13px", color: "#999", marginBottom: "12px" }}>
              {posts.length}件見つかりました
            </p>
          )}
          {posts.map((post) => (
            <div key={post.id} style={{
              backgroundColor: "#fff", marginBottom: "12px",
              borderRadius: "16px", overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              {(() => {
                const imgs = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : [];
                return imgs.length > 0 ? (
                  <img src={imgs[0]} alt={post.restaurant} loading="lazy"
                    style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                ) : null;
              })()}
              <div style={{ padding: "14px" }}>
                <a
                  href={post.place_id
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}&query_place_id=${post.place_id}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}`
                  }
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "16px", fontWeight: "700", color: "#111", textDecoration: "none", display: "block", marginBottom: "4px" }}
                >
                  {post.restaurant}
                </a>
                {post.area && <p style={{ fontSize: "12px", color: "#999", marginBottom: "6px" }}>📍 {post.area}</p>}
                {post.genres && post.genres.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                    {post.genres.map((genre) => (
                      <span key={genre} style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", backgroundColor: "#f0f0f0", color: "#555" }}>{genre}</span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: "13px", color: "#f5a623", marginBottom: "6px" }}>★ {Number(post.rating).toFixed(1)}</p>
                {post.user_id && (
                  <Link href={`/users/${post.user_id}`} style={{ fontSize: "12px", color: "#2563eb" }}>
                    {post.username || "ユーザー"} の投稿
                  </Link>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* 全国レストラン検索結果 */}
      {activeTab === "places" && (
        <>
          {searched && !placesLoading && places.length === 0 && (
            <p style={{ color: "#999", fontSize: "14px", textAlign: "center" }}>
              「{keyword}」に該当するレストランが見つかりませんでした
            </p>
          )}
          {places.length > 0 && (
            <p style={{ fontSize: "13px", color: "#999", marginBottom: "12px" }}>
              {places.length}件見つかりました
            </p>
          )}
          {places.map((place) => (
            <div key={place.place_id} style={{
              backgroundColor: "#fff", marginBottom: "12px",
              borderRadius: "16px", overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              {place.photos && place.photos.length > 0 && (
                <img
                  src={place.photos[0].getUrl({ maxWidth: 800 })}
                  loading="lazy"
                  style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
                />
              )}
              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "16px", fontWeight: "700", color: "#111", marginBottom: "4px" }}>
                      {place.name}
                    </p>
                    {place.formatted_address && (
                      <p style={{ fontSize: "12px", color: "#999", marginBottom: "6px" }}>
                        📍 {place.formatted_address}
                      </p>
                    )}
                    {place.rating && (
                      <p style={{ fontSize: "13px", color: "#f5a623", marginBottom: "6px" }}>
                        ★ {place.rating} ({place.user_ratings_total}件)
                      </p>
                    )}
                    {place.opening_hours && (
                      <p style={{ fontSize: "12px", color: place.opening_hours.open_now ? "#4CAF50" : "#e74c3c", marginBottom: "6px" }}>
                        {place.opening_hours.open_now ? "営業中" : "営業時間外"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleWant(place)}
                    style={{
                      padding: "8px 14px", borderRadius: "20px", border: "none",
                      backgroundColor: savedPlaceIds.includes(place.place_id) ? "#f0f0f0" : "#111",
                      color: savedPlaceIds.includes(place.place_id) ? "#666" : "#fff",
                      fontSize: "12px", fontWeight: "600", cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    {savedPlaceIds.includes(place.place_id) ? "✅ 行きたい済" : "🔖 行きたい"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}