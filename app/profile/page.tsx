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

  // プロフィール取得
  const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
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

  // ★プロフィール更新
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
  <p style={{ fontSize: "13px", color: "#888" }}>メール: {user?.email}</p>
  <p style={{ fontSize: "13px", color: "#888" }}>投稿数: {posts.length}</p>
</div>
      </section>

      {/* 投稿一覧 */}
      <section>
        <h2>自分の投稿</h2>

        {posts.length === 0 && <p>まだ投稿がありません</p>}

        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <h3>{post.restaurant}</h3>

            <p>{"★".repeat(Number(post.rating))}</p>

            <p style={{ fontSize: "12px", color: "#666" }}>
              {post.created_at
                ? new Date(post.created_at).toLocaleString("ja-JP")
                : ""}
            </p>

            <p>{post.comment}</p>

            {post.image && (
              <img
                src={post.image}
                style={{ width: "100%", borderRadius: "8px" }}
              />
            )}
          </div>
        ))}
      </section>
    </main>
  );
}