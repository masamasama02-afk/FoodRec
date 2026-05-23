"use client";

import { supabase } from "../../lib/supabase";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

declare const google: any;

export default function MyListPage() {
  const [user, setUser] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [restaurantName, setRestaurantName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<"visited" | "want">("want");
  const [memo, setMemo] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"want" | "visited">("want");

  const fetchRestaurants = async (userId: string) => {
  // my_restaurantsから取得
  const { data: myData } = await supabase
    .from("my_restaurants")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // wishlistsから取得
  const { data: wishData } = await supabase
    .from("wishlists")
    .select("post_id, posts(id, restaurant, place_id, area, username)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // wishlistsをmy_restaurantsと同じ形式に変換
  const wishList = (wishData || []).map((w: any) => ({
    id: `wish_${w.post_id}`,
    restaurant: w.posts?.restaurant,
    place_id: w.posts?.place_id,
    area: w.posts?.area,
    status: "want",
    memo: `${w.posts?.username || ""}のおすすめ`,
    created_at: null,
    from_wishlist: true,
  }));

  setRestaurants([...(myData || []), ...wishList]);
};

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setLoading(false); return; }
      setUser(data.user);
      await fetchRestaurants(data.user.id);
      setLoading(false);
    };
    init();
  }, []);

  const searchPlaces = (query: string) => {
    if (!query.trim()) { setSearchResults([]); setShowResults(false); return; }
    if (typeof google === "undefined") return;
    const service = new google.maps.places.PlacesService(document.createElement("div"));
    service.textSearch({ query, type: "restaurant" }, (results: any[], status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results.slice(0, 8));
        setShowResults(true);
      }
    });
  };

  const selectPlace = (place: any) => {
    setRestaurantName(place.name);
    setPlaceId(place.place_id ?? "");
    setLat(place.geometry.location.lat());
    setLng(place.geometry.location.lng());
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: place.geometry.location }, (results: any, status: any) => {
      if (status === "OK" && results[0]) {
        const components = results[0].address_components;
        const area =
          components.find((c: any) => c.types.includes("sublocality_level_2"))?.long_name ||
          components.find((c: any) => c.types.includes("sublocality_level_1"))?.long_name ||
          components.find((c: any) => c.types.includes("locality"))?.long_name || "";
        setArea(area);
      }
    });
    setShowResults(false);
  };

  const addRestaurant = async () => {
    if (!restaurantName.trim() || !user) return;
    setAdding(true);
    const { error } = await supabase.from("my_restaurants").insert({
      user_id: user.id,
      restaurant: restaurantName,
      place_id: placeId || null,
      lat, lng, area,
      status,
      memo: memo || null,
    });
    if (error) { alert("追加失敗"); setAdding(false); return; }
    setRestaurantName("");
    setPlaceId("");
    setLat(null);
    setLng(null);
    setArea("");
    setMemo("");
    setStatus("want");
    setShowAdd(false);
    setAdding(false);
    await fetchRestaurants(user.id);
  };

  const deleteRestaurant = async (id: string) => {
    await supabase.from("my_restaurants").delete().eq("id", id);
    await fetchRestaurants(user.id);
  };

  if (loading) return <main style={{ padding: "24px" }}>読み込み中...</main>;

  if (!user) return (
    <main style={{ padding: "24px", textAlign: "center" }}>
      <p style={{ color: "#999" }}>ログインしてください</p>
      <Link href="/" style={{ color: "#2563eb" }}>ホームへ</Link>
    </main>
  );

  const filtered = restaurants.filter(r => r.status === activeTab);

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>📋 マイリスト</h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: "8px 18px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: "#111",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >＋ 追加</button>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("want")}
          style={{
            padding: "8px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: activeTab === "want" ? "#111" : "#f0f0f0",
            color: activeTab === "want" ? "#fff" : "#666",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >🔖 行きたい</button>
        <button
          onClick={() => setActiveTab("visited")}
          style={{
            padding: "8px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: activeTab === "visited" ? "#111" : "#f0f0f0",
            color: activeTab === "visited" ? "#fff" : "#666",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >✅ 行った</button>
      </div>

      {/* リスト */}
      {filtered.length === 0 && (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "40px 24px",
          textAlign: "center",
          border: "0.5px solid #eee",
        }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>
            {activeTab === "want" ? "🔖" : "✅"}
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginBottom: "20px" }}>
            {activeTab === "want" ? "行きたいお店を追加しよう" : "行ったお店を記録しよう"}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "12px 28px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >＋ 追加する</button>
        </div>
      )}

      {filtered.map((restaurant) => (
        <div key={restaurant.id} style={{
          backgroundColor: "#fff",
          border: "0.5px solid #eee",
          borderRadius: "16px",
          padding: "14px",
          marginBottom: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <a
                href={restaurant.place_id
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.restaurant)}&query_place_id=${restaurant.place_id}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.restaurant)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "15px", fontWeight: "700", color: "#111", textDecoration: "none", display: "block", marginBottom: "4px" }}
              >
                {restaurant.restaurant}
              </a>
              {restaurant.area && (
                <p style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>📍 {restaurant.area}</p>
              )}
              {restaurant.memo && (
                <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{restaurant.memo}</p>
              )}
            </div>
            <button
              onClick={() => deleteRestaurant(restaurant.id)}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                fontSize: "18px",
                cursor: "pointer",
                flexShrink: 0,
                padding: "0 0 0 8px",
              }}
            >×</button>
          </div>
        </div>
      ))}

      {/* 追加モーダル */}
      {showAdd && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "20px",
            padding: "24px",
            width: "100%",
            maxWidth: "400px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}>
            <p style={{ fontSize: "17px", fontWeight: "700", color: "#111", marginBottom: "16px" }}>
              レストランを追加
            </p>

            {/* 種別 */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => setStatus("want")}
                style={{
                  flex: 1, padding: "10px",
                  borderRadius: "10px", border: "none",
                  backgroundColor: status === "want" ? "#111" : "#f0f0f0",
                  color: status === "want" ? "#fff" : "#666",
                  fontSize: "13px", cursor: "pointer",
                }}
              >🔖 行きたい</button>
              <button
                onClick={() => setStatus("visited")}
                style={{
                  flex: 1, padding: "10px",
                  borderRadius: "10px", border: "none",
                  backgroundColor: status === "visited" ? "#111" : "#f0f0f0",
                  color: status === "visited" ? "#fff" : "#666",
                  fontSize: "13px", cursor: "pointer",
                }}
              >✅ 行った</button>
            </div>

            {/* レストラン検索 */}
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <input
                placeholder="レストラン名を検索"
                value={restaurantName}
                onChange={(e) => {
                  setRestaurantName(e.target.value);
                  searchPlaces(e.target.value);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "0.5px solid #e0e0e0",
                  backgroundColor: "#fafafa",
                  boxSizing: "border-box",
                  fontSize: "14px",
                  color: "#111",
                }}
              />
              {showResults && searchResults.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%", left: 0, right: 0,
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}>
                  {searchResults.map((place, index) => (
                    <div
                      key={index}
                      onClick={() => selectPlace(place)}
                      style={{
                        padding: "10px 12px",
                        borderBottom: "0.5px solid #f0f0f0",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#111",
                      }}
                    >
                      <p style={{ fontWeight: "500", margin: 0 }}>{place.name}</p>
                      <p style={{ fontSize: "11px", color: "#999", margin: 0 }}>{place.formatted_address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* メモ */}
            <textarea
              placeholder="メモ（任意）"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "0.5px solid #e0e0e0",
                backgroundColor: "#fafafa",
                boxSizing: "border-box",
                fontSize: "14px",
                color: "#111",
                resize: "none",
                height: "80px",
                marginBottom: "16px",
              }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={addRestaurant}
                disabled={adding || !restaurantName.trim()}
                style={{
                  flex: 1, padding: "13px",
                  borderRadius: "12px", border: "none",
                  backgroundColor: adding || !restaurantName.trim() ? "#ccc" : "#111",
                  color: "#fff", fontSize: "14px", fontWeight: "600",
                  cursor: adding || !restaurantName.trim() ? "not-allowed" : "pointer",
                }}
              >{adding ? "追加中..." : "追加する"}</button>
              <button
                onClick={() => { setShowAdd(false); setRestaurantName(""); setMemo(""); }}
                style={{
                  flex: 1, padding: "13px",
                  borderRadius: "12px", border: "0.5px solid #ddd",
                  backgroundColor: "#fff", color: "#666",
                  fontSize: "14px", cursor: "pointer",
                }}
              >キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}