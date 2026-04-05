"use client";

import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
declare const google: any;

type Comment = {
  id: number
  post_id: number
  user_id: string
  username: string
  comment: string
  created_at: string
}
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
  profiles?: { avatar_url?: string };
};

type Like = {
  id: number;
  post_id: number;
  user_id: string;
};

export default function Home() {
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
const [avatarFile, setAvatarFile] = useState<File | null>(null);
const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [restaurant, setRestaurant] = useState("");
  const [comment, setComment] = useState("");
  const restaurantInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [rating, setRating] = useState(5.0);
  const [mapUrl, setMapUrl] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState("new");
  const [timelineType, setTimelineType] = useState("all");
  const [uploading, setUploading] = useState(false);

  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [rankingPosts, setRankingPosts] = useState<Post[]>([]);
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("プロフィール取得エラー:", error);
      return;
    }

    if (data) {
      setUsername(data.username ?? "");
    } else {
      setUsername("");
    }
  };

  const updateProfile = async () => {
    if (!user) {
      toast("ログインしてください");
      return;
    }

    if (!username.trim()) {
      toast("表示名を入力してください");
      return;
    }

    setProfileLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
      })
      .eq("id", user.id);

    setProfileLoading(false);

    if (error) {
      console.error("プロフィール更新エラー:", error);
      toast("表示名の更新に失敗しました");
      return;
    }

    toast("表示名を更新しました");
  };

  const signUp = async () => {
  if (!email.trim() || !password.trim()) {
    toast("メールアドレスとパスワードを入力してください");
    return;
  }

  if (!username.trim()) {
    toast("表示名を入力してください");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
  });

  if (error) {
    toast(error.message);
    return;
  }

  if (!data.user) {
    toast("ユーザー登録に失敗しました");
    return;
  }

  // アイコン画像をアップロード
  let avatarUrl = "";
  if (avatarFile) {
    const fileName = `avatars/${data.user.id}_${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, avatarFile);

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);
      avatarUrl = urlData.publicUrl;
    }
  }

  // プロフィールを保存
  const { error: profileError } = await supabase.from("profiles").insert([
    {
      id: data.user.id,
      username: username.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
    },
  ]);

  if (profileError) {
    toast(
      "認証登録はできましたが、プロフィール作成に失敗しました: " +
        profileError.message
    );
    return;
  }

 // 自動ログイン
  const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (signInError) {
    toast("登録しました！ログインしてください。");
    return;
  }

  setUser(signInData.user);
  await fetchProfile(signInData.user.id);
  await fetchLikes(signInData.user.id);
  toast("登録が完了しました！");
};


   const fetchRanking = async () => {

  const { data } = await supabase
    .from("likes")
    .select("post_id");

  if (!data) return;

  const counts: Record<number, number> = {};

  data.forEach((like) => {
    counts[like.post_id] = (counts[like.post_id] || 0) + 1;
  });

  const postIds = Object.keys(counts)
    .sort((a, b) => counts[Number(b)] - counts[Number(a)])
    .slice(0, 5)
    .map(Number);

  if (postIds.length === 0) return;

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .in("id", postIds);

  setRankingPosts(posts || []);
};

  const fetchPosts = async () => {

  const column = sortBy === "rating" ? "rating" : "created_at";

  if (timelineType === "all") {

    const { data, error } = await supabase
  .from("posts")
  .select("*, profiles(avatar_url)")
  .order(column, { ascending: false });

    if (error) {
      console.error("投稿取得エラー:", error);
      return;
    }

    setPosts(data || []);

  } else {

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", auth.user.id);

    if (!follows) return;

    const followingIds = follows.map((f) => f.following_id);

    if (followingIds.length === 0) {
      setPosts([]);
      return;
    }

    const { data, error } = await supabase
  .from("posts")
  .select("*, profiles(avatar_url)")
  .in("user_id", followingIds)
  .order(column, { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setPosts(data || []);
  }
};
 const fetchLikes = async (currentUserId?: string) => {
  const { data: postsData } = await supabase.from("posts").select("id");
  const postIds = (postsData ?? []).map((p) => p.id);

  const { data, error } = await supabase
    .from("likes")
    .select("*")
    .in("post_id", postIds);

    if (error) {
      console.error("いいね取得エラー:", error);
      return;
    }

    if (!data) return;

    const likes = data as Like[];

    const counts: Record<number, number> = {};
    likes.forEach((like) => {
      counts[like.post_id] = (counts[like.post_id] || 0) + 1;
    });
    setLikeCounts(counts);

    const targetUserId = currentUserId ?? user?.id;

    if (targetUserId) {
      const myLikedPostIds = likes
        .filter((like) => like.user_id === targetUserId)
        .map((like) => like.post_id);
      setLikedPostIds(myLikedPostIds);
    } else {
      setLikedPostIds([]);
    }
  };
  const fetchComments = async () => {

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("コメント取得エラー", error)
    return
  }

  const grouped: Record<number, Comment[]> = {}

  data?.forEach((c) => {
    if (!grouped[c.post_id]) {
      grouped[c.post_id] = []
    }
    grouped[c.post_id].push(c)
  })

  setComments(grouped)
}
const addComment = async (postId: number) => {

  const text = commentInputs[postId]

  if (!text?.trim()) return

  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    toast("ログインしてください")
    return
  }

  const displayName =
    username.trim() || data.user.email?.split("@")[0] || "user"

  const { error } = await supabase
    .from("comments")
    .insert([
      {
        post_id: postId,
        user_id: data.user.id,
        username: displayName,
        comment: text
      }
    ])

  if (error) {
    console.error(error)
    toast("コメント投稿失敗")
    return
  }

  setCommentInputs({
    ...commentInputs,
    [postId]: ""
  })

  await fetchComments()
}

  const signIn = async () => {
    if (!email.trim() || !password.trim()) {
      toast("メールアドレスとパスワードを入力してください");
      return;
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      toast(error.message);
      return;
    }

    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
      await fetchPosts();
      await fetchLikes(data.user.id);
      toast("ログインしました");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername("");
    setLikedPostIds([]);
    toast("ログアウトしました");
  };

  // 初回のみ認証チェック
useEffect(() => {
  const initAuth = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      await fetchProfile(data.user.id);
      await fetchLikes(data.user.id);
    }
    await fetchRanking();
    await fetchComments();
  };
  initAuth();
}, []); // ← 依存配列を空に

// 並び替え・タイムライン変更時は投稿だけ再取得
useEffect(() => {
  fetchPosts();
}, [sortBy, timelineType]);


    useEffect(() => {

  if (!restaurantInputRef.current) return;
   if (typeof google === "undefined") return;

  const autocomplete = new google.maps.places.Autocomplete(
    restaurantInputRef.current,
    {
      types: ["restaurant"],
      fields: ["name", "geometry"]
    }
  );

  autocomplete.addListener("place_changed", () => {

    const place = autocomplete.getPlace()

if (!place.name || !place.geometry) return

setRestaurant(place.name)

setLat(place.geometry.location.lat())
setLng(place.geometry.location.lng())

  });

}, []);

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
const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(fileName, file);

    if (error) {
      console.error("画像アップロードエラー:", error);
      toast("画像アップロードに失敗しました");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    setImage(urlData.publicUrl);
    setUploading(false);
  };

  const addPost = async () => {
    if (!restaurant.trim()) {
      toast("レストラン名を入力してください");
      return;
    }

    if (!comment.trim()) {
      toast("コメントを入力してください");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      toast("ログインしてください");
      return;
    }

    const displayName =
      username.trim() || userData.user.email?.split("@")[0] || "user";
 const mapLink =
  "https://www.google.com/maps/embed/v1/search?key=" +
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY +
  "&q=" +
  encodeURIComponent(restaurant);

  const { error } = await supabase.from("posts").insert([
    {
      restaurant: restaurant,
      comment: comment,
      rating: rating,
      image: image ?? "",
      user_id: userData.user.id,
      username: displayName,
      map_url: mapLink,
      lat: lat,
      lng: lng
      },
    ]);

    if (error) {
      console.error("投稿エラー:", JSON.stringify(error, null, 2));
      toast(error.message);
      return;
    }

    await fetchPosts();
    await fetchLikes(userData.user.id);
    await fetchRanking();

    setRestaurant("");
    setComment("");
    setImage(null);
    setRating(5);
    setMapUrl("");

    toast("投稿しました");
  };

  const toggleLike = async (postId: number) => {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
      toast("ログインしてください");
      return;
    }

    const alreadyLiked = likedPostIds.includes(postId);

    if (alreadyLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", data.user.id);

      if (error) {
        console.error("いいね解除エラー:", error);
        toast("いいね解除に失敗しました");
        return;
      }
    } else {
      const { error } = await supabase.from("likes").insert([
        {
          post_id: postId,
          user_id: data.user.id,
        },
      ]);

      if (error) {
        console.error("いいねエラー:", JSON.stringify(error));
        toast("いいねに失敗しました");
        return;
      }
    }

    await fetchLikes(data.user.id);
  };

  const deletePost = async (id: number) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      console.error("削除エラー:", error);
      toast("削除できませんでした");
      return;
    }

    await fetchPosts();
    await fetchLikes(user?.id);
  };

  return (
    <main
  style={{
    padding: "24px",
    fontFamily: "sans-serif",
    maxWidth: "700px",
    margin: "0 auto",
    backgroundColor: "#fafafa",
    minHeight: "100vh",
    paddingBottom: "80px",
  }}
>
      <div style={{
  borderBottom: "0.5px solid #eee",
  marginBottom: "24px",
  paddingBottom: "16px",
}}>
  <h1 style={{
    fontSize: "26px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    color: "#111",
    marginBottom: "2px",
  }}>
    FoodRec
  </h1>
  <p style={{ fontSize: "12px", color: "#bbb" }}>
    Recommendation & Record
  </p>
</div>

      {!user && (
        <section
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "30px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginBottom: "16px" }}>ログイン / 新規登録</h2>

<input
  placeholder="メールアドレス"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  style={{
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  }}
/>

<input
  type="password"
  placeholder="パスワード"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  style={{
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  }}
/>

{/* 新規登録用プロフィール設定 */}
<hr style={{ border: "none", borderTop: "1px solid #eee", margin: "16px 0" }} />
<p style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
  新規登録の方はプロフィールも設定できます
</p>

{/* アイコン画像 */}
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
  <div
    onClick={() => document.getElementById("avatar-input")?.click()}
    style={{
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      backgroundColor: "#f0f0f0",
      border: "1px solid #ddd",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      overflow: "hidden",
      marginBottom: "8px",
    }}
  >
    {avatarPreview ? (
      <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    ) : (
      <span style={{ fontSize: "32px" }}>🍽️</span>
    )}
  </div>
  <input
    id="avatar-input"
    type="file"
    accept="image/*"
    onChange={handleAvatar}
    style={{ display: "none" }}
  />
  <span style={{ fontSize: "12px", color: "#aaa" }}>タップして画像を選択</span>
</div>

{/* 表示名 */}
<input
  placeholder="表示名（必須）"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  maxLength={20}
  style={{
    width: "100%",
    padding: "10px",
    marginBottom: "4px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  }}
/>
<p style={{ fontSize: "11px", color: "#aaa", textAlign: "right", marginBottom: "12px" }}>
  {username.length} / 20
</p>

{/* 自己紹介 */}
<textarea
  placeholder={"自己紹介（任意）\n食べログより友達の味覚を信じています"}

    value={bio}
  onChange={(e) => setBio(e.target.value)}
  maxLength={100}
  style={{
    width: "100%",
    padding: "10px",
    marginBottom: "4px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    resize: "none",
    height: "80px",
  }}
/>
<p style={{ fontSize: "11px", color: "#aaa", textAlign: "right", marginBottom: "12px" }}>
  {bio.length} / 100
</p>

<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <button
    onClick={signIn}
    style={{
      padding: "10px 16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#111",
      color: "#fff",
      cursor: "pointer",
    }}
  >
    ログイン
  </button>

  <button
    onClick={signUp}
    style={{
      padding: "10px 16px",
      borderRadius: "10px",
      border: "1px solid #ccc",
      backgroundColor: "#fff",
      cursor: "pointer",
    }}
  >
    新規登録
  </button>
</div>
        </section>
      )}

      {user && (
  <section style={{
    backgroundColor: "#fff",
    border: "0.5px solid #eee",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "20px",
  }}>
    {/* ユーザー情報 */}
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        flexShrink: 0,
      }}>
        🍽️
      </div>
      <div>
        <p style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>
          {username || "未設定"}
        </p>
        <p style={{ fontSize: "11px", color: "#999" }}>{user.email}</p>
      </div>
      
        <span onClick={() => window.location.href = "/profile"}
      style={{
          marginLeft: "auto",
          fontSize: "12px",
          color: "#2563eb",
          textDecoration: "none",
          padding: "4px 10px",
          borderRadius: "20px",
          border: "0.5px solid #ddd",
        }}
      >
        編集
      </span>
    </div>

    {/* 表示名入力 */}
    <input
      placeholder="表示名を入力"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 14px",
        marginBottom: "10px",
        borderRadius: "10px",
        border: "0.5px solid #e0e0e0",
        backgroundColor: "#fafafa",
        boxSizing: "border-box",
        fontSize: "14px",
      }}
    />

    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={updateProfile}
        style={{
          padding: "9px 20px",
          borderRadius: "20px",
          border: "none",
          backgroundColor: "#111",
          color: "#fff",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: "500",
        }}
      >
        {profileLoading ? "保存中..." : "表示名を保存"}
      </button>
      <button
        onClick={signOut}
        style={{
          padding: "9px 20px",
          borderRadius: "20px",
          border: "0.5px solid #ddd",
          backgroundColor: "#fff",
          color: "#555",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        ログアウト
      </button>
    </div>
  </section>
)}

      <section
  style={{
    backgroundColor: "#fff",
    border: "0.5px solid #eee",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "20px",
  }}
>
  <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "12px" }}>
    ✏️ 投稿する
  </h2>

        <input
            ref={restaurantInputRef}
  placeholder="レストラン名を検索"
  value={restaurant}
  onChange={(e) => setRestaurant(e.target.value)}style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        <textarea
          placeholder="コメント"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            minHeight: "100px",
            marginBottom: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        <div style={{ marginTop: "10px", marginBottom: "16px" }}>
  <p style={{ marginBottom: "8px" }}>評価：</p>
  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = Math.min(Math.max(rating - (star - 1), 0), 1);
      return (
        <div
          key={star}
          style={{ position: "relative", width: "36px", height: "36px", cursor: "pointer" }}
        >
          <svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id={`grad${star}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset={`${filled * 100}%`} stopColor="#f5a623" />
                <stop offset={`${filled * 100}%`} stopColor="#ddd" />
              </linearGradient>
            </defs>
            <path
              d="M18 4l3.9 7.9 8.7 1.3-6.3 6.1 1.5 8.7L18 23.8l-7.8 4.1 1.5-8.7-6.3-6.1 8.7-1.3z"
              fill={`url(#grad${star})`}
              stroke="#f5a623"
              strokeWidth="0.5"
            />
          </svg>
          {/* 左半分：0.5刻み */}
          <div
            style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%", zIndex: 1 }}
            onClick={() => setRating(star - 0.5)}
          />
          {/* 右半分：整数 */}
          <div
            style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "100%", zIndex: 1 }}
            onClick={() => setRating(star)}
          />
        </div>
      );
    })}
    <span style={{ fontSize: "16px", fontWeight: "500", marginLeft: "8px" }}>
      {rating.toFixed(1)}
    </span>
  </div>
</div>

        <input type="file" onChange={handleImage} />

        {uploading && (
          <p style={{ color: "#666", marginTop: "8px" }}>
            画像をアップロード中...
          </p>
        )}

        {image && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ marginBottom: "8px" }}>画像プレビュー</p>
            <img
              src={image}
              alt="preview"
              style={{
                width: "100%",
                maxWidth: "300px",
                borderRadius: "12px",
                border: "1px solid #ddd",
              }}
            />
          </div>
        )}

        <button
          onClick={addPost}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#111",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          投稿
        </button>
      </section>

     <div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
}}>
  <div style={{ display: "flex", gap: "6px" }}>
    <button
      onClick={() => setTimelineType("all")}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        border: "none",
        backgroundColor: timelineType === "all" ? "#111" : "#f0f0f0",
        color: timelineType === "all" ? "#fff" : "#666",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
      }}
    >
      全投稿
    </button>
    <button
      onClick={() => setTimelineType("follow")}
      style={{
        padding: "6px 14px",
        borderRadius: "20px",
        border: "none",
        backgroundColor: timelineType === "follow" ? "#111" : "#f0f0f0",
        color: timelineType === "follow" ? "#fff" : "#666",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
      }}
    >
      フォロー中
    </button>
  </div>

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    style={{
      padding: "6px 10px",
      borderRadius: "20px",
      border: "0.5px solid #ddd",
      backgroundColor: "#fff",
      fontSize: "12px",
      color: "#111",
    }}
  >
    <option value="new">新着順</option>
    <option value="rating">評価順</option>
  </select>
</div>

<div style={{
  backgroundColor: "#fff",
  border: "0.5px solid #eee",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "16px",
}}>
  <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "12px" }}>
    🔥 人気ランキング
  </h2>
  {rankingPosts.map((post, index) => (
    <div
      key={post.id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 0",
        borderBottom: index < rankingPosts.length - 1 ? "0.5px solid #f0f0f0" : "none",
      }}
    >
      <span style={{ fontSize: "16px", fontWeight: "700", color: "#f5a623", minWidth: "24px" }}>
        #{index + 1}
      </span>
      <div>
        <p style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>{post.restaurant}</p>
        <p style={{ fontSize: "11px", color: "#999" }}>{post.username}</p>
      </div>
    </div>
  ))}
</div>
      <h2 style={{ marginBottom: "20px" }}>投稿一覧</h2>

      {posts.length === 0 && (
        <p style={{ color: "#666" }}>まだ投稿がありません。</p>
      )}

      {posts.map((post) => (
        <div
  key={post.id}
  style={{
    backgroundColor: "#fff",
    border: "0.5px solid #eee",
    borderRadius: "16px",
    padding: "14px",
    marginBottom: "12px",
  }}
>
         <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  }}
>
  {/* アイコン */}
  <div
    style={{
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      backgroundColor: "#f0f0f0",
      border: "1px solid #eee",
      overflow: "hidden",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
    }}
  >
    {post.profiles?.avatar_url ? (
      <img
        src={post.profiles.avatar_url}
        alt="avatar"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      "🍽️"
    )}
  </div>

  {/* ユーザー名 */}
  {post.user_id ? (
    <Link
      href={`/users/${post.user_id}`}
      style={{
        fontSize: "13px",
        color: "#2563eb",
        textDecoration: "underline",
      }}
    >
      {post.username || "不明"}
    </Link>
  ) : (
    <span style={{ fontSize: "13px", color: "#666" }}>
      {post.username || "不明"}
    </span>
  )}
</div>

          <h3 style={{ marginBottom: "8px" }}>{post.restaurant}</h3>

          <div style={{ display: "flex", alignItems: "center", gap: "2px", marginBottom: "4px" }}>
  {[1, 2, 3, 4, 5].map((star) => {
    const filled = Math.min(Math.max(Number(post.rating) - (star - 1), 0), 1);
    return (
      <svg key={star} viewBox="0 0 36 36" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`post-grad-${post.id}-${star}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset={`${filled * 100}%`} stopColor="#f5a623" />
            <stop offset={`${filled * 100}%`} stopColor="#ddd" />
          </linearGradient>
        </defs>
        <path
          d="M18 4l3.9 7.9 8.7 1.3-6.3 6.1 1.5 8.7L18 23.8l-7.8 4.1 1.5-8.7-6.3-6.1 8.7-1.3z"
          fill={`url(#post-grad-${post.id}-${star})`}
          stroke="#f5a623"
          strokeWidth="0.5"
        />
      </svg>
    );
  })}
  <span style={{ fontSize: "13px", color: "#f5a623", marginLeft: "4px" }}>
    {Number(post.rating).toFixed(1)}
  </span>
</div>

          <p
            style={{
              fontSize: "12px",
              color: "#888",
              marginBottom: "12px",
            }}
          >
            {post.created_at
              ? new Date(post.created_at).toLocaleString("ja-JP")
              : ""}
          </p>

          <p style={{ marginBottom: "12px", lineHeight: 1.6 }}>
            {post.comment}
          </p>

          {post.image && (
  <img
    src={post.image}
    alt={post.restaurant}
    style={{
      width: "100%",
      maxHeight: "300px",
      objectFit: "cover",
      borderRadius: "12px",
      marginBottom: "12px",
      border: "1px solid #eee",
    }}
  />
)}

        

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <button
              onClick={() => toggleLike(post.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: likedPostIds.includes(post.id)
                  ? "#ffe4e6"
                  : "#fff",
                cursor: "pointer",
              }}
            >
              {likedPostIds.includes(post.id) ? "❤️ いいね済み" : "🤍 いいね"}
            </button>

            <span style={{ fontSize: "14px", color: "#666" }}>
              いいね {likeCounts[post.id] || 0} 件
            </span>
          </div>
          <div style={{ marginTop: "10px" }}>

  {(comments[post.id] || []).map((c) => (
    <div key={`${post.id}-${c.id}`} style={{ fontSize: "14px", marginBottom: "6px" }}>
      <strong>{c.username}</strong> {c.comment}
    </div>
  ))}

  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
    <input
      placeholder="コメント"
      value={commentInputs[post.id] || ""}
      onChange={(e) =>
        setCommentInputs({
          ...commentInputs,
          [post.id]: e.target.value
        })
      }
      style={{
        flex: 1,
        padding: "6px",
        border: "1px solid #ccc",
        borderRadius: "6px"
      }}
    />

    <button
      onClick={() => addComment(post.id)}
      style={{
        padding: "6px 10px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        background: "#fff"
      }}
    >
      送信
    </button>
  </div>

</div>
{/* アフィリエイトリンク */}
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
  
    <a href={`${process.env.NEXT_PUBLIC_HOTPEPPER_AFFILIATE_URL}${encodeURIComponent(post.restaurant)}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-block",
      padding: "8px 14px",
      borderRadius: "8px",
      backgroundColor: "#ff6b6b",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "bold",
      textDecoration: "none",
    }}
  >
    🍽️ ホットペッパーで予約
  </a>
  
    <a href={`https://tabelog.com/rstLst/?vs=1&sa=&sk=${encodeURIComponent(post.restaurant)}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-block",
      padding: "8px 14px",
      borderRadius: "8px",
      backgroundColor: "#f0956f",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "bold",
      textDecoration: "none",
    }}
  >
    🔍 食べログで検索
  </a>
</div>

{user && post.user_id === user.id && (
  <button
    onClick={() => deletePost(post.id)}
    style={{
      padding: "8px 14px",
      borderRadius: "8px",
      border: "1px solid #ccc",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              削除
            </button>
          )}
        </div>
        
      ))}
    </main>
  );
}