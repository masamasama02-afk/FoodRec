"use client";

import { supabase } from "../../../lib/supabase";
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
  const [profileLoading, setProfileLoading] = useState(false);

  const [restaurant, setRestaurant] = useState("");
  const [comment, setComment] = useState("");
  const restaurantInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
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
      alert("ログインしてください");
      return;
    }

    if (!username.trim()) {
      alert("表示名を入力してください");
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
      alert("表示名の更新に失敗しました");
      return;
    }

    alert("表示名を更新しました");
  };

  const signUp = async () => {
    if (!email.trim() || !password.trim()) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (!data.user) {
      alert("ユーザー登録に失敗しました");
      return;
    }

    const defaultUsername = email.trim().split("@")[0];

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        username: defaultUsername,
      },
    ]);

    if (profileError) {
      alert(
        "認証登録はできましたが、プロフィール作成に失敗しました: " +
          profileError.message
      );
      return;
    }

    alert("登録しました");
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
      .select("*")
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
      .select("*")
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
    const { data, error } = await supabase.from("likes").select("*");

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
    alert("ログインしてください")
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
    alert("コメント投稿失敗")
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
      alert("メールアドレスとパスワードを入力してください");
      return;
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);
      await fetchPosts();
      await fetchLikes(data.user.id);
      alert("ログインしました");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsername("");
    setLikedPostIds([]);
    alert("ログアウトしました");
  };

  useEffect(() => {
    const initialize = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        await fetchProfile(data.user.id);
        await fetchLikes(data.user.id);
        await fetchRanking();
      } else {
        setLikedPostIds([]);
      }

      await fetchPosts();
      await fetchComments()
    };
    initialize()
  },[sortBy, timelineType])

    useEffect(() => {

  if (!restaurantInputRef.current) return;

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
      alert("画像アップロードに失敗しました");
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
      alert("レストラン名を入力してください");
      return;
    }

    if (!comment.trim()) {
      alert("コメントを入力してください");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("ログインしてください");
      return;
    }

    const displayName =
      username.trim() || userData.user.email?.split("@")[0] || "user";
 const mapLink =
    "https://www.google.com/maps/search/?api=1&query=" +
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
      console.error("投稿エラー:", error);
      alert(error.message);
      return;
    }

    await fetchPosts();
    await fetchLikes(userData.user.id);

    setRestaurant("");
    setComment("");
    setImage(null);
    setRating(5);
    setMapUrl("");

    alert("投稿しました");
  };

  const toggleLike = async (postId: number) => {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
      alert("ログインしてください");
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
        alert("いいね解除に失敗しました");
        return;
      }
    } else {
      const { error } = await supabase.from("likes").insert([
        {
          post_id: postId,
          user_id: user.id,
        },
      ]);

      if (error) {
        console.error("いいねエラー:", error);
        alert("いいねに失敗しました");
        return;
      }
    }

    await fetchLikes(user.id);
  };

  const deletePost = async (id: number) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      console.error("削除エラー:", error);
      alert("削除できませんでした");
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
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
      FoodRec</h1>
      <Link
  href="/map"
  style={{
    display: "inline-block",
    marginBottom: "20px",
    color: "#2563eb",
    textDecoration: "underline",
  }}
>
  📍 友達おすすめMAPを見る
</Link>

      <p style={{ color: "#666", marginBottom: "32px" }}>
        友達のおすすめを記録するグルメSNS
      </p>

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
          <p style={{ marginBottom: "8px" }}>
            ログイン中: <strong>{user.email}</strong>
          </p>

          <a
            href="/profile"
            style={{
              display: "inline-block",
              marginBottom: "12px",
              color: "#2563eb",
              textDecoration: "underline",
            }}
          >
            プロフィールページを見る
          </a>

          <p style={{ marginBottom: "12px", color: "#666" }}>
            表示名: <strong>{username || "未設定"}</strong>
          </p>

          <input
            placeholder="表示名を入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
              {profileLoading ? "保存中..." : "表示名を保存"}
            </button>

            <button
              onClick={signOut}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1px solid #ccc",
                backgroundColor: "#fff",
                cursor: "pointer",
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
          border: "1px solid #ddd",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ marginBottom: "16px" }}>投稿する</h2>

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
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              style={{
                fontSize: "32px",
                cursor: "pointer",
                color: star <= rating ? "#f5a623" : "#ccc",
                marginRight: "4px",
              }}
            >
              ★
            </span>
          ))}
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

      <div style={{ marginBottom: "20px" }}>
        <p style={{ marginBottom: "8px" }}>並び替え：</p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
          }}
        >
          <option value="new">新着順</option>
          <option value="rating">人気順</option>
        </select>
      </div>

      <div style={{ marginBottom: "20px" }}>

  <p style={{ marginBottom: "8px" }}>タイムライン</p>

  <div style={{ display: "flex", gap: "10px" }}>

    <button
      onClick={() => setTimelineType("all")}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        backgroundColor: timelineType === "all" ? "#111" : "#fff",
        color: timelineType === "all" ? "#fff" : "#111",
        cursor: "pointer"
      }}
    >
      全投稿
    </button>

    <button
      onClick={() => setTimelineType("follow")}
      style={{
        padding: "8px 14px",
        borderRadius: "8px",
        border: "1px solid #ccc",
        backgroundColor: timelineType === "follow" ? "#111" : "#fff",
        color: timelineType === "follow" ? "#fff" : "#111",
        cursor: "pointer"
      }}
    >
      フォロー投稿
    </button>

  </div>

</div>
<h2 style={{ marginBottom: "16px" }}>🔥 人気ランキング</h2>

{rankingPosts.map((post, index) => (

  <div
    key={post.id}
    style={{
      background: "#fff7ed",
      border: "1px solid #fed7aa",
      padding: "12px",
      borderRadius: "10px",
      marginBottom: "10px"
    }}
  >

    <strong>
      #{index + 1} {post.restaurant}
    </strong>

    <p style={{ fontSize: "13px", color: "#666" }}>
      {post.username}
    </p>

  </div>

))}
      <h2 style={{ marginBottom: "20px" }}>投稿一覧</h2>

      {posts.length === 0 && (
        <p style={{ color: "#666" }}>まだ投稿がありません。</p>
      )}

      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "20px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "#666",
              marginBottom: "6px",
            }}
          >
            投稿者:{" "}
            {post.user_id ? (
              <Link
                href={`/users/${post.user_id}`}
                style={{
                  color: "#2563eb",
                  textDecoration: "underline",
                }}
              >
                {post.username || "不明"}
              </Link>
            ) : (
              post.username || "不明"
            )}
          </p>

          <h3 style={{ marginBottom: "8px" }}>{post.restaurant}</h3>

          <p
            style={{
              color: "#f5a623",
              fontSize: "20px",
              marginBottom: "4px",
            }}
          >
            {"★".repeat(Number(post.rating))}
          </p>

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
                borderRadius: "12px",
                marginBottom: "12px",
                border: "1px solid #eee",
              }}
            />
          )}

         {post.map_url && (
  <>
    <iframe
      src={post.map_url}
      width="100%"
      height="250"
      style={{
        border: 0,
        borderRadius: "12px",
        marginTop: "10px"
      }}
      loading="lazy"
    />

    <div style={{ marginBottom: "12px" }}>
      <a
        href={post.map_url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#2563eb",
          textDecoration: "underline",
        }}
      >
        地図で見る
      </a>
    </div>
    
  </>
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