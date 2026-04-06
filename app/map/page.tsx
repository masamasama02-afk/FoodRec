"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import dynamic from "next/dynamic"

const MapView = dynamic(() => import("../components/MapView").then(mod => mod.default), { ssr: false })

export default function MapPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [minRating, setMinRating] = useState(0)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      const { data } = await supabase
        .from("posts")
        .select("*")
        .not("lat", "is", null)

      setPosts(data || [])
    }

    fetchPosts()
  }, [])

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* フィルターバー */}
      <div style={{
        position: "absolute",
        top: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "30px",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
        maxWidth: "92vw",
        overflowX: "auto",
        scrollbarWidth: "none",
        whiteSpace: "nowrap",
      }}>
        <span style={{ fontSize: "11px", color: "#999", flexShrink: 0 }}>★</span>
        {[
          { label: "全て", value: 0 },
          { label: "3+", value: 3 },
          { label: "4+", value: 4 },
          { label: "4.5+", value: 4.5 },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setMinRating(btn.value)}
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: minRating === btn.value ? "#f5a623" : "#f0f0f0",
              color: minRating === btn.value ? "#fff" : "#666",
              fontSize: "12px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {btn.label}
          </button>
        ))}
        <span style={{ color: "#ddd", flexShrink: 0 }}>|</span>
       {["🌞", "🌙", "☕", "🍺", "👫", "👥", "🥂", "🍣", "🍜", "🍱", "🦞", "🍝", "🍕", "🍷", "🍜", "🌮", "🍖", "🦌", "🥗", "🍔", "🍰", "🍺"].map((emoji, index) => {
          const genres = ["🌞 ランチ", "🌙 ディナー", "☕ カフェ", "🍺 飲み", "👫 デート", "👥 グループ", "🥂 2次会", "🍣 和食", "🍜 ラーメン", "🍱 鮨", "🦞 海鮮", "🍝 洋食", "🍕 イタリアン", "🍷 ビストロ", "🍜 中華", "🌮 エスニック", "🍖 焼肉", "🦌 ジビエ", "🥗 ヘルシー", "🍔 ファストフード", "🍰 スイーツ", "🍺 クラフトビール"]; const genre = genres[index];
          return (
            <button
              key={genre}
              onClick={() => setSelectedGenres(
                selectedGenres.includes(genre)
                  ? selectedGenres.filter((g: string) => g !== genre)
                  : [...selectedGenres, genre]
              )}
              style={{
                padding: "4px 8px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: selectedGenres.includes(genre) ? "#111" : "#f0f0f0",
                fontSize: "14px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
                <span style={{ fontSize: "14px" }}>{emoji}</span>
                <span style={{ fontSize: "9px", color: selectedGenres.includes(genre) ? "#fff" : "#999" }}>
                  {genre.replace(/^[^\s]+\s/, "")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 地図 */}
      <MapView posts={posts} minRating={minRating} selectedGenres={selectedGenres} />
    </div>
  )
}