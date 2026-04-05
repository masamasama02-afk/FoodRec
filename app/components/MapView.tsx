"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { useState } from "react"

type Post = {
  id: number
  restaurant: string
  comment: string
  rating: number
  lat: number
  lng: number
  username?: string
}

type Props = {
  posts: Post[]
  minRating: number
}

const getIcon = (rating: number) => {
  const color = rating >= 4 ? "#2ecc71" : rating >= 3 ? "#f5a623" : "#e74c3c"
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 32px;
      height: 32px;
      background: ${color};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

function LocationButton() {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  const handleClick = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        map.flyTo([latitude, longitude], 15)
        L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: "",
            html: `<div style="
              width: 16px;
              height: 16px;
              background: #2563eb;
              border-radius: 50%;
              border: 3px solid #fff;
              box-shadow: 0 0 0 3px rgba(37,99,235,0.3);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })
        }).addTo(map)
        setLocating(false)
      },
      () => {
        alert("位置情報の取得に失敗しました")
        setLocating(false)
      }
    )
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: "absolute",
        bottom: "80px",
        right: "12px",
        zIndex: 1000,
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "50%",
        width: "44px",
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontSize: "20px",
      }}
    >
      {locating ? "⏳" : "⌖"}
    </div>
  )
}

export default function MapView({ posts, minRating }: Props) {
  const filtered = posts.filter(p => Number(p.rating) >= minRating)

  return (
    <MapContainer
      center={[35.6804, 139.7690]}
      zoom={13}
      style={{ width: "100%", height: "100vh" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {filtered.map(post => (
        <Marker
          key={post.id}
          position={[Number(post.lat), Number(post.lng)]}
          icon={getIcon(Number(post.rating))}
        >
          <Popup>
            <div style={{ minWidth: "140px" }}>
              <strong>{post.restaurant}</strong>
              <p style={{ margin: "4px 0", color: "#f5a623" }}>
                ★ {Number(post.rating).toFixed(1)}
              </p>
              <p style={{ margin: "4px 0", fontSize: "12px" }}>{post.comment}</p>
              <p style={{ margin: "4px 0", fontSize: "11px", color: "#888" }}>
                {post.username}
              </p>
              
             <span
                onClick={() => window.location.href = `/posts/${post.id}`}
                style={{ fontSize: "12px", color: "#2563eb", cursor: "pointer" }}
              >
                詳細を見る →
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
      <LocationButton />
    </MapContainer>
  )
}