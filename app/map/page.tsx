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

      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", auth.user.id)

      const ids = follows?.map(f => f.following_id) || []
      ids.push(auth.user.id)

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
  borderRadius: "16px",
  padding: "10px 14px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  zIndex: 10,
  maxWidth: "90vw",
  overflowX: "auto",
  scrollbarWidth: "none",
}}>
  {/* 評価フィルター */}
  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
    <span style={{ fontSize: "11px", color: "#999" }}>★</span>
    {[
        { label: "全て", value: 0 },
    { label: "★4以上", value: 4 },
    { label: "★4.5以上", value: 4.5 },
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
        }}
      >
        {btn.label}
      </button>
    ))}
  </div>

  {/* ジャンルフィルター */}
  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
    <span style={{ fontSize: "11px", color: "#999" }}>🍽️</span>
    {["🌞 ランチ", "🌙 ディナー", "☕ カフェ", "🍺 飲み", "🍣 和食", "🍝 洋食", "🍜 中華", "🌮 エスニック", "🍖 焼肉", "🍕 イタリアン", "🥗 ヘルシー", "🍔 ファストフード", "🍰 スイーツ"].map((genre) => (
      <button
        key={genre}
        onClick={() => setSelectedGenres(
          selectedGenres.includes(genre)
            ? selectedGenres.filter(g => g !== genre)
            : [...selectedGenres, genre]
        )}
        style={{
          padding: "4px 10px",
          borderRadius: "20px",
          border: "none",
          backgroundColor: selectedGenres.includes(genre) ? "#111" : "#f0f0f0",
          color: selectedGenres.includes(genre) ? "#fff" : "#666",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        {genre}
      </button>
    ))}
  </div>
</div>

      {/* 地図 */}
      <MapView posts={posts} minRating={minRating} selectedGenres={selectedGenres} />
    </div>
  )
}