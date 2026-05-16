"use client";

import { supabase } from "../../lib/supabase";
import { useState } from "react";
import Link from "next/link";

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

  const search = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(avatar_url)")
      .or(`area.ilike.%${keyword}%,genres.cs.{"${keyword}"}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setPosts(data || []);
    setLoading(false);
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
        🔍 レストラン検索
      </h1>

      {/* 検索バー */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
      }}>
        <input
          placeholder="エリア・ジャンルで検索（例: 渋谷、焼肉）"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "12px",
            border: "0.5px solid #e0e0e0",
            backgroundColor: "#fff",
            fontSize: "14px",
            color: "#111",
            outline: "none",
          }}
        />
        <button
          onClick={search}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#111",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          検索
        </button>
      </div>

      {/* ローディング */}
      {loading && (
        <p style={{ color: "#999", fontSize: "14px", textAlign: "center" }}>検索中...</p>
      )}

      {/* 結果なし */}
      {searched && !loading && posts.length === 0 && (
        <p style={{ color: "#999", fontSize: "14px", textAlign: "center" }}>
          「{keyword}」に該当する投稿が見つかりませんでした
        </p>
      )}

      {/* 検索結果 */}
      {posts.length > 0 && (
        <p style={{ fontSize: "13px", color: "#999", marginBottom: "12px" }}>
          {posts.length}件見つかりました
        </p>
      )}

      {posts.map((post) => (
        <div key={post.id} style={{
          backgroundColor: "#fff",
          marginBottom: "12px",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          {/* 画像 */}
          {(() => {
            const imgs = post.images && post.images.length > 0
              ? post.images
              : post.image ? [post.image] : [];
            return imgs.length > 0 ? (
              <img
                src={imgs[0]}
                alt={post.restaurant}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "200px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : null;
          })()}

          <div style={{ padding: "14px" }}>
            {/* 店名 */}
            <a
              href={post.place_id
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}&query_place_id=${post.place_id}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "16px", fontWeight: "700", color: "#111", textDecoration: "none", display: "block", marginBottom: "4px" }}
            >
              {post.restaurant}
            </a>

            {/* エリア */}
            {post.area && (
              <p style={{ fontSize: "12px", color: "#999", marginBottom: "6px" }}>📍 {post.area}</p>
            )}

            {/* ジャンル */}
            {post.genres && post.genres.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                {post.genres.map((genre) => (
                  <span key={genre} style={{
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    backgroundColor: "#f0f0f0",
                    color: "#555",
                  }}>
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* 星評価 */}
            <p style={{ fontSize: "13px", color: "#f5a623", marginBottom: "6px" }}>
              ★ {Number(post.rating).toFixed(1)}
            </p>

            {/* おすすめメニュー */}
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

            {/* 投稿者 */}
            {post.user_id && (
              <Link
                href={`/users/${post.user_id}`}
                style={{ fontSize: "12px", color: "#2563eb" }}
              >
                {post.username || "ユーザー"} の投稿
              </Link>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}