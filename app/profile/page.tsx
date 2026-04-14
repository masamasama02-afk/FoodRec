"use client";

import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

type Post = {
  id: number;
  restaurant: string;
  comment: string;
  rating: number;
  image: string;
  images?: string[];
  genres?: string[];
  created_at?: string;
  user_id?: string;
  username?: string;
  map_url?: string;
};
export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
const [username, setUsername] = useState("");
const [bio, setBio] = useState("");
const [avatarUrl, setAvatarUrl] = useState("");
const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
const [posts, setPosts] = useState<Post[]>([]);
const [loading, setLoading] = useState(true);
const [editing, setEditing] = useState(false);
const [wishlist, setWishlist] = useState<any[]>([]);
const [activeTab, setActiveTab] = useState<"posts" | "wishlist">("posts");
const [followCount, setFollowCount] = useState(0);
const [followerCount, setFollowerCount] = useState(0);
const [rankBadge, setRankBadge] = useState("");
const [badges, setBadges] = useState<string[]>([]);
const [totalLikes, setTotalLikes] = useState(0);
const [editingPostId, setEditingPostId] = useState<number | null>(null);
const [editRestaurant, setEditRestaurant] = useState("");
const [editComment, setEditComment] = useState("");
const [editGenres, setEditGenres] = useState<string[]>([]);
const [editImages, setEditImages] = useState<string[]>([]);
const [editRating, setEditRating] = useState<number>(5);
  // プロフィール取得
  const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url, rank_badge, badges")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("プロフィール取得エラー:", error);
    return;
  }

  if (data) {
    setUsername(data.username ?? "");
    setBio(data.bio ?? "");
    setAvatarUrl(data.avatar_url ?? "");
    setRankBadge(data.rank_badge ?? "");
    setBadges(data.badges ?? []);
  }
};

  // 投稿取得
  const fetchMyPosts = async (userId: string) => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("投稿取得エラー:", error);
      return;
    }

    if (data) {
      setPosts(data as Post[]);
    }
  };
  const fetchWishlist = async (userId: string) => {
  const { data } = await supabase
    .from("wishlists")
    .select("post_id, posts(id, restaurant, rating, username, comment)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  setWishlist(data || []);
};
const fetchFollowCounts = async (userId: string) => {
  const { count: followCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  setFollowCount(followCount || 0);
  setFollowerCount(followerCount || 0);
};
const fetchTotalLikes = async (userId: string) => {
  const { data: myPosts } = await supabase
    .from("posts")
    .select("id")
    .eq("user_id", userId);

  if (!myPosts || myPosts.length === 0) {
    setTotalLikes(0);
    return;
  }

  const postIds = myPosts.map((p) => p.id);
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .in("post_id", postIds);

  setTotalLikes(count || 0);
};

const updateBadges = async (userId: string) => {
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId);

  if (!posts) return;

  const totalPosts = posts.length;

  const { count: likeCount } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .in("post_id", posts.map((p) => p.id));

  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("id")
    .in("post_id", posts.map((p) => p.id));
  const wishlistCount = wishlists?.length ?? 0;

  const areas = [...new Set(posts.map((p) => p.area).filter(Boolean))];
  const areaCount = areas.length;

  // ランクバッジ
  let newRankBadge = "First Bite";
  if (totalPosts >= 300) newRankBadge = "食の探求者";
  else if (totalPosts >= 100) newRankBadge = "グルメ通";
  else if (totalPosts >= 50) newRankBadge = "フーディー";
  else if (totalPosts >= 10) newRankBadge = "ビギナーグルメ";
  else if (totalPosts >= 1) newRankBadge = "First Bite";

  // 実績バッジ
  const newBadges: string[] = [];
  if (totalPosts >= 1) newBadges.push("🍴 First Bite");
  if ((likeCount ?? 0) >= 10) newBadges.push("🍽️❤️ 人気の一皿");
  if ((likeCount ?? 0) >= 30) newBadges.push("🔥 バズグルメ");
  if (wishlistCount >= 50) newBadges.push("🤖 行きたい製造機");
  if (areaCount >= 3) newBadges.push("📍 街歩きビギナー");
  if (areaCount >= 10) newBadges.push("👣 エリアハンター");
  if (areaCount >= 30) newBadges.push("🧭 探検家");

  const highEnd = posts.filter((p) => p.price >= 8001).length;
  const premium = posts.filter((p) => p.price >= 15001).length;
  const cheap = posts.filter((p) => p.price <= 1000 && p.price > 0).length;
  if (highEnd >= 5) newBadges.push("🍷 ブルジョワジー");
  if (premium >= 20) newBadges.push("💎 ラグジュアリーマスター");
  if (cheap >= 20) newBadges.push("🪙 コスパ神");

  const lunchPosts = posts.filter((p) => p.genres?.includes("🌞 ランチ")).length;
  const sushiPosts = posts.filter((p) => p.genres?.includes("🍣 和食")).length;
  const ramenPosts = posts.filter((p) => p.genres?.includes("🍜 ラーメン")).length;
  const yakinikuPosts = posts.filter((p) => p.genres?.includes("🍖 焼肉")).length;
  const cafePosts = posts.filter((p) => p.genres?.includes("☕ カフェ")).length;
  const italianPosts = posts.filter((p) => p.genres?.includes("🍕 イタリアン")).length;
  const izakayaPosts = posts.filter((p) => p.genres?.includes("🍺 飲み")).length;

  if (lunchPosts >= 20) newBadges.push("☀️ ランチハンター");
  if (sushiPosts >= 10) newBadges.push("🍣 寿司職人");
  if (ramenPosts >= 15) newBadges.push("🍜 ラーメン中毒");
  if (yakinikuPosts >= 10) newBadges.push("🥩 焼肉奉行");
  if (cafePosts >= 20) newBadges.push("☕ カフェ巡礼者");
  if (italianPosts >= 10) newBadges.push("🍝 パスタ貴族");
  if (izakayaPosts >= 20) newBadges.push("🍺 飲み歩き職人");

  await supabase
    .from("profiles")
    .update({ rank_badge: newRankBadge, badges: newBadges })
    .eq("id", userId);

  setRankBadge(newRankBadge);
  setBadges(newBadges);
};

const startEdit = (post: Post) => {
  setEditingPostId(post.id);
  setEditRestaurant(post.restaurant);
  setEditComment(post.comment);
  setEditGenres(post.genres || []);
  setEditImages(post.images || (post.image ? [post.image] : []));
  setEditRating(post.rating || 5);
};

  const saveEdit = async (postId: number) => {
  const { error } = await supabase
    .from("posts")
    .update({
      restaurant: editRestaurant,
      comment: editComment,
      genres: editGenres,
      images: editImages,
      image: editImages[0] ?? "",
      rating: editRating,
    })
    .eq("id", postId);

    if (error) {
      alert("更新失敗");
      return;
    }

    setEditingPostId(null);
    await fetchMyPosts(user.id);
  };
  const handleEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const remaining = 3 - editImages.length;
  if (remaining <= 0) {
    alert("画像は最大3枚までです");
    return;
  }

  const filesToUpload = files.slice(0, remaining);
  const uploadedUrls: string[] = [];

  for (const file of filesToUpload) {
    let uploadFile: File | Blob = file;
    let fileName = `${Date.now()}_${file.name}`;

    // HEIC変換
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      try {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
        uploadFile = Array.isArray(converted) ? converted[0] : converted;
        fileName = `${Date.now()}_converted.jpg`;
      } catch (e) {
        alert("画像の変換に失敗しました");
        continue;
      }
    }

    // 圧縮
    const compressImage = (blob: Blob): Promise<Blob> => {
      return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxSize || height > maxSize) {
            if (width > height) { height = Math.round((height * maxSize) / width); width = maxSize; }
            else { width = Math.round((width * maxSize) / height); height = maxSize; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((result) => resolve(result!), "image/jpeg", 0.7);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
    };

    uploadFile = await compressImage(uploadFile);
    fileName = `${Date.now()}_compressed.jpg`;

    const { error } = await supabase.storage.from("images").upload(fileName, uploadFile);
    if (error) { alert("アップロード失敗"); continue; }

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
    uploadedUrls.push(urlData.publicUrl);
  }

  setEditImages((prev) => [...prev, ...uploadedUrls]);
};

  const deletePost = async (postId: number) => {
    if (!confirm("削除しますか？")) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      alert("削除失敗");
      return;
    }

    await fetchMyPosts(user.id);
  };

  const updateProfile = async () => {
  if (!user) return;

  // アイコン画像をアップロード
  let newAvatarUrl = avatarUrl;
  if (avatarFile) {
    const fileName = `avatars/${user.id}_${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, avatarFile);

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);
      newAvatarUrl = urlData.publicUrl;
      setAvatarUrl(newAvatarUrl);
    }
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    username: username,
    bio: bio,
    avatar_url: newAvatarUrl,
  });

  if (error) {
    alert("更新失敗");
    console.error(error);
    return;
  }

  alert("更新完了");
  setEditing(false);
  setAvatarFile(null);
};
const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setAvatarFile(file);
  const reader = new FileReader();
  reader.onload = (e) => {
    setAvatarPreview(e.target?.result as string);
  };
  reader.readAsDataURL(file);
};

  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        alert("ログインしてください");
        setLoading(false);
        return;
      }

      setUser(data.user);
      await fetchProfile(data.user.id);
      await fetchMyPosts(data.user.id);
      await fetchFollowCounts(data.user.id);
      await fetchTotalLikes(data.user.id);
      await updateBadges(data.user.id);
      await fetchWishlist(data.user.id);
setLoading(false);
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: "24px" }}>
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main
  style={{
    padding: "24px",
    maxWidth: "700px",
    margin: "0 auto",
    paddingBottom: "80px",
  }}
>
      {/* 戻る */}
      <div style={{ marginBottom: "20px" }}>
        <Link href="/">← ホームに戻る</Link>
      </div>

      {/* プロフィール */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>プロフィール</h1>

{/* アイコン */}
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
  <div style={{ position: "relative", display: "inline-block", marginBottom: "8px" }}>
<div
    onClick={() => editing && document.getElementById("avatar-input")?.click()}
    style={{
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      backgroundColor: "#f0f0f0",
      border: "1px solid #ddd",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "32px",
      cursor: editing ? "pointer" : "default",
      marginBottom: "8px",
    }}
  >
    {avatarPreview ? (
      <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : avatarUrl ? (
      <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      "🍽️"
    )}
  </div>
  {rankBadge && (
    <div style={{
      position: "absolute",
      bottom: "0px",
      right: "0px",
      fontSize: "18px",
      backgroundColor: "#fff",
      borderRadius: "50%",
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid #eee",
    }}>
      {rankBadge === "First Bite" ? "🍴" :
       rankBadge === "ビギナーグルメ" ? "🍽️" :
       rankBadge === "フーディー" ? "🥘" :
       rankBadge === "グルメ通" ? "🥇" :
       rankBadge === "食の探求者" ? "👑" : "🍴"}
    </div>
  )}
</div>
  {editing && (
    <>
      <input
        id="avatar-input"
        type="file"
        accept="image/*"
        onChange={handleAvatar}
        style={{ display: "none" }}
      />
      <span style={{ fontSize: "12px", color: "#aaa" }}>タップして変更</span>
    </>
  )}
</div>

{/* 編集UI */}
{editing ? (
  <>
    <div style={{ marginBottom: "12px" }}>
      <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "4px" }}>表示名</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="表示名"
        maxLength={20}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          boxSizing: "border-box",
        }}
      />
    </div>
    <div style={{ marginBottom: "16px" }}>
      <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "4px" }}>自己紹介</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="自己紹介を入力"
        maxLength={100}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          boxSizing: "border-box",
          resize: "none",
          height: "80px",
        }}
      />
      <p style={{ fontSize: "11px", color: "#aaa", textAlign: "right" }}>{bio.length} / 100</p>
    </div>
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        onClick={updateProfile}
        style={{
          padding: "10px 16px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: "#111",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        保存
      </button>
      <button
        onClick={() => { setEditing(false); setAvatarPreview(null); }}
        style={{
          padding: "10px 16px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          backgroundColor: "#fff",
          cursor: "pointer",
        }}
      >
        キャンセル
      </button>
    </div>
  </>
) : (
  <>
    <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>{username || "未設定"}</p>
    <p style={{ fontSize: "14px", color: "#666", marginBottom: "12px", lineHeight: "1.6" }}>{bio || "自己紹介未設定"}</p>
    <button
      onClick={() => setEditing(true)}
      style={{
        padding: "10px 16px",
        borderRadius: "10px",
        border: "1px solid #ccc",
        backgroundColor: "#fff",
        cursor: "pointer",
      }}
    >
      編集
    </button>
  </>
)}

<div style={{ marginTop: "16px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
  <p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>メール: {user?.email}</p>
  <div style={{ display: "flex", gap: "20px" }}>
    <div style={{ textAlign: "center" }}>
     <p style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>{posts.length}</p>
      <p style={{ fontSize: "12px", color: "#999" }}>投稿</p>
    </div>
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>❤️ {totalLikes}</p>
      <p style={{ fontSize: "12px", color: "#999" }}>いいね</p>
    </div>
   <div
      style={{ textAlign: "center", cursor: "pointer" }}
      onClick={() => window.location.href = "/follows"}
    >
    <p style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>{followCount}</p>
      <p style={{ fontSize: "12px", color: "#999" }}>フォロー</p>
    </div>
    <div
      style={{ textAlign: "center", cursor: "pointer" }}
      onClick={() => window.location.href = "/followers"}
    >
     <p style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>{followerCount}</p>
      <p style={{ fontSize: "12px", color: "#999" }}>フォロワー</p>
    </div>
  </div>
</div>
{/* 招待リンク */}
<div style={{ marginTop: "16px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
  <p style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>👥 友達を招待</p>
  <button
    onClick={() => {
      const url = `https://food-rec-rouge.vercel.app?ref=${user?.id}`;
      navigator.clipboard.writeText(url);
      alert("招待リンクをコピーしました！");
    }}
    style={{
      padding: "8px 16px",
      borderRadius: "20px",
      border: "0.5px solid #ddd",
      backgroundColor: "#fff",
      fontSize: "13px",
      cursor: "pointer",
      color: "#111",
    }}
  >
    🔗 招待リンクをコピー
  </button>
</div>
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
  return (
    <div style={{ marginTop: "16px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
      <p style={{ fontSize: "13px", color: "#888", marginBottom: "10px" }}>🏅 バッジ</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {allBadges.map((badge) => {
          const earned = badges.includes(badge.key);
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
      </section>

      {/* タブ */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("posts")}
          style={{
            padding: "8px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: activeTab === "posts" ? "#111" : "#f0f0f0",
            color: activeTab === "posts" ? "#fff" : "#666",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          投稿一覧
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          style={{
            padding: "8px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: activeTab === "wishlist" ? "#111" : "#f0f0f0",
            color: activeTab === "wishlist" ? "#fff" : "#666",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          🔖 行きたいリスト
        </button>
      </div>

      {/* 投稿一覧 */}
      <section>
        {activeTab === "posts" && (
          <>
            {posts.length === 0 && <p style={{ color: "#999", fontSize: "14px" }}>まだ投稿がありません</p>}

       {posts.map((post) => (
  <div
    key={post.id}
    style={{
      border: "0.5px solid #eee",
      borderRadius: "16px",
      padding: "14px",
      marginBottom: "12px",
      backgroundColor: "#fff",
    }}
  >
    {editingPostId === post.id ? (
      // 編集モード
      <div>
        <input
          value={editRestaurant}
          onChange={(e) => setEditRestaurant(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "8px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
            color: "#111",
          }}
        />
        <textarea
          value={editComment}
          onChange={(e) => setEditComment(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "8px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
            height: "80px",
            color: "#111",
          }}
        />
        {/* 評価 */}
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>評価</p>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setEditRating(star)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  opacity: star <= editRating ? 1 : 0.3,
                }}
              >
                ★
              </button>
            ))}
            <span style={{ fontSize: "13px", color: "#666", alignSelf: "center", marginLeft: "4px" }}>
              {editRating.toFixed(1)}
            </span>
          </div>
        </div>
        {/* ジャンル選択 */}
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>シーン</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
           {["🌞 ランチ", "🌙 ディナー", "☕ カフェ", "🍺 飲み", "👫 デート", "👥 グループ", "🥂 2次会"].map((genre) => (
              <button
                key={genre}
                onClick={() => setEditGenres(
                  editGenres.includes(genre)
                    ? editGenres.filter(g => g !== genre)
                    : [...editGenres, genre]
                )}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: editGenres.includes(genre) ? "#111" : "#f0f0f0",
                  color: editGenres.includes(genre) ? "#fff" : "#666",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {genre}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>料理ジャンル</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
           {["🍣 和食", "🍜 ラーメン", "🍱 鮨", "🦞 海鮮", "🍝 洋食", "🍕 イタリアン", "🍷 ビストロ", "🍜 中華", "🌮 エスニック", "🍖 焼肉", "🦌 ジビエ", "🥗 ヘルシー", "🍔 ファストフード", "🍰 スイーツ", "🍺 クラフトビール"].map((genre) => (
              <button
                key={genre}
                onClick={() => setEditGenres(
                  editGenres.includes(genre)
                    ? editGenres.filter(g => g !== genre)
                    : [...editGenres, genre]
                )}
                style={{
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: editGenres.includes(genre) ? "#111" : "#f0f0f0",
                  color: editGenres.includes(genre) ? "#fff" : "#666",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* 画像 */}
        <div style={{ marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>画像（最大3枚）</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
            {editImages.map((url, index) => (
              <div key={index} style={{ position: "relative" }}>
                <img
                  src={url}
                  style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }}
                />
                <button
                  onClick={() => setEditImages(editImages.filter((_, i) => i !== index))}
                  style={{
                    position: "absolute", top: "2px", right: "2px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: "none", backgroundColor: "rgba(0,0,0,0.5)",
                    color: "#fff", fontSize: "10px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>
            ))}
            {editImages.length < 3 && (
              <label style={{
                width: "80px", height: "80px", borderRadius: "8px",
                border: "1px dashed #ccc", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", fontSize: "24px", color: "#ccc",
              }}>
                +
                <input type="file" accept="image/*" multiple onChange={handleEditImage} style={{ display: "none" }} />
              </label>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => saveEdit(post.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            保存
          </button>
          <button
            onClick={() => setEditingPostId(null)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "0.5px solid #ddd",
              backgroundColor: "#fff",
              color: "#555",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    ) : (
      // 表示モード
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "4px" }}>
          {post.restaurant}
        </h3>
        <p style={{ color: "#f5a623", fontSize: "14px", marginBottom: "4px" }}>
          ★ {Number(post.rating).toFixed(1)}
        </p>
        <p style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>
          {post.created_at ? new Date(post.created_at).toLocaleString("ja-JP") : ""}
        </p>
        <p style={{ fontSize: "13px", color: "#111", lineHeight: 1.6, marginBottom: "8px" }}>
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
              marginBottom: "8px",
            }}
          />
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => startEdit(post)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "0.5px solid #ddd",
              backgroundColor: "#fff",
              color: "#111",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            編集
          </button>
          <button
            onClick={() => deletePost(post.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "0.5px solid #ffcccc",
              backgroundColor: "#fff0f0",
              color: "#cc0000",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            削除
          </button>
        </div>
      </div>
    )}
  </div>
))}
      </>
        )}

        {/* 行きたいリスト */}
        {activeTab === "wishlist" && (
          <>
            {wishlist.length === 0 && (
              <p style={{ color: "#999", fontSize: "14px" }}>まだ行きたいリストがありません</p>
            )}
            {wishlist.map((item) => (
              <div
                key={item.post_id}
                style={{
                  backgroundColor: "#fff",
                  border: "0.5px solid #eee",
                  borderRadius: "16px",
                  padding: "14px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "15px", fontWeight: "600", color: "#2563eb", textDecoration: "underline", marginBottom: "4px" }}>
                      {item.posts?.restaurant}
                    </p>
                    <p style={{ fontSize: "13px", color: "#f5a623", marginBottom: "4px" }}>
                      ★ {Number(item.posts?.rating).toFixed(1)}
                    </p>
                    <p style={{ fontSize: "12px", color: "#999" }}>
                      {item.posts?.username} のおすすめ
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase
                        .from("wishlists")
                        .delete()
                        .eq("post_id", item.post_id)
                        .eq("user_id", user.id);
                      await fetchWishlist(user.id);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      border: "0.5px solid #eee",
                      backgroundColor: "#fff",
                      color: "#999",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </main>
  );
}