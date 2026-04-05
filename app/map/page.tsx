"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import dynamic from "next/dynamic"

const MapView = dynamic(() => import("../components/MapView").then(mod => mod.default), { ssr: false })

export default function MapPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [minRating, setMinRating] = useState(0)

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
        borderRadius: "30px",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 1000,
        whiteSpace: "nowrap",
        overflowX: "auto",
        maxWidth: "90vw",
        scrollbarWidth: "none",
      }}>
        <span style={{ fontSize: "12px", color: "#666" }}>★フィルター</span>
        {[
          { label: "全て", value: 0 },
          { label: "2以上", value: 2 },
          { label: "3以上", value: 3 },
          { label: "4以上", value: 4 },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setMinRating(btn.value)}
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              border: "1px solid #ddd",
              backgroundColor: minRating === btn.value ? "#f5a623" : "#fff",
              color: minRating === btn.value ? "#fff" : "#666",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 地図 */}
      <MapView posts={posts} minRating={minRating} />
    </div>
  )
}