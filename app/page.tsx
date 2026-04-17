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
  images?: string[];
  genres?: string[];
  area?: string;
  created_at?: string;
  user_id?: string;
  username?: string;
  map_url?: string;
  profiles?: { avatar_url?: string; rank_badge?: string };
  lat?: number;
  lng?: number;
  place_id?: string;
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
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
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
const [images, setImages] = useState<string[]>([]);
const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
const [price, setPrice] = useState<number>(3000)
  const [rating, setRating] = useState(5.0);
  const [mapUrl, setMapUrl] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [sortBy, setSortBy] = useState("new");
  const [timelineType, setTimelineType] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
const [showShareModal, setShowShareModal] = useState(false);
const [lastPostedRestaurant, setLastPostedRestaurant] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [wishlistPostIds, setWishlistPostIds] = useState<number[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [rankingPosts, setRankingPosts] = useState<Post[]>([]);
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [area, setArea] = useState("");
  const [placeId, setPlaceId] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
const [showResults, setShowResults] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);
const [followingIds, setFollowingIds] = useState<string[]>([]);
const [likeUsers, setLikeUsers] = useState<Record<number, {user_id: string, username: string}[]>>({});

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
  if (!agreedToTerms) {
    toast("利用規約とプライバシーポリシーに同意してください");
    return;
  }
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
  const since = new Date();
  since.setDate(since.getDate() - 5);

  const { data } = await supabase
    .from("posts")
    .select("user_id, username, profiles(avatar_url)")
    .gte("created_at", since.toISOString());

  if (!data) return;

  const counts: Record<string, { username: string; count: number; avatar_url: string }> = {};

  data.forEach((post: any) => {
    if (!counts[post.user_id]) {
      counts[post.user_id] = {
        username: post.username || "不明",
        count: 0,
        avatar_url: post.profiles?.avatar_url || "",
      };
    }
    counts[post.user_id].count++;
  });

  const ranking = Object.entries(counts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([user_id, val]) => ({ user_id, ...val }));

  setRankingPosts(ranking as any);
};
  const fetchPosts = async () => {

  const column = sortBy === "rating" ? "rating" : "created_at";

  if (timelineType === "all") {

    const { data, error } = await supabase
  .from("posts")
 .select("*, profiles(avatar_url, rank_badge)")
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
  .select("*, profiles(avatar_url, rank_badge)")
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
    .select("*, profiles(username)")
    .in("post_id", postIds)
    .not("post_id", "is", null);

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

    const likeUsersMap: Record<number, {user_id: string, username: string}[]> = {};
    likes.forEach((like: any) => {
      if (!likeUsersMap[like.post_id]) likeUsersMap[like.post_id] = [];
      likeUsersMap[like.post_id].push({
        user_id: like.user_id,
        username: like.profiles?.username || "ユーザー",
      });
    });
    setLikeUsers(likeUsersMap);

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

  const fetchWishlist = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("post_id")
    .eq("user_id", data.user.id);

  setWishlistPostIds((wishlist || []).map((w) => w.post_id));
};
const fetchNotifications = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  const { data: notifs } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  setNotifications(notifs || []);
  setUnreadCount((notifs || []).filter(n => !n.is_read).length);
};
  const toggleWishlist = async (postId: number) => {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    toast("ログインしてください");
    return;
  }

  const alreadyAdded = wishlistPostIds.includes(postId);

  if (alreadyAdded) {
    await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", data.user.id)
      .eq("post_id", postId);

    setWishlistPostIds(wishlistPostIds.filter((id) => id !== postId));
  } else {
    await supabase.from("wishlists").insert({
      user_id: data.user.id,
      post_id: postId,
    });

    setWishlistPostIds([...wishlistPostIds, postId]);

    // 投稿者に通知
    const post = posts.find(p => p.id === postId);
    if (post && post.user_id && post.user_id !== data.user.id) {
      const displayName = username || data.user.email?.split("@")[0] || "user";
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        from_user_id: data.user.id,
        from_username: displayName,
        post_id: postId,
        restaurant: post.restaurant,
        type: "wishlist",
        message: `${displayName}さんが「${post.restaurant}」を行きたいリストに追加しました`,
      });
    }
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

  // 投稿者に通知を送る
  const post = posts.find(p => p.id === postId);
  if (post && post.user_id && post.user_id !== data.user.id) {
    await supabase.from("notifications").insert({
      user_id: post.user_id,
      from_user_id: data.user.id,
      from_username: displayName,
      post_id: postId,
      restaurant: post.restaurant,
      type: "comment",
      message: text,
    });
  }

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
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", data.user.id);
      setFollowingIds((follows || []).map((f) => f.following_id));
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
  const handler = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
  };
  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}, []);

useEffect(() => {
  const initAuth = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
   if (data.user) {
      await fetchProfile(data.user.id);
      await fetchLikes(data.user.id);
      await fetchWishlist();
      await fetchNotifications();
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", data.user.id);
      setFollowingIds((follows || []).map((f) => f.following_id));
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


   const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    if (typeof google === "undefined") return

    const service = new google.maps.places.PlacesService(
      document.createElement("div")
    )

    service.textSearch(
      { query, type: "restaurant" },
      (results: any[], status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setSearchResults(results.slice(0, 10))
          setShowResults(true)
        } else {
          setSearchResults([])
          setShowResults(false)
        }
      }
    )
  }

  const selectPlace = (place: any) => {
    setRestaurant(place.name)
    setPlaceId(place.place_id ?? "")
    setLat(place.geometry.location.lat())
    setLng(place.geometry.location.lng())

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: place.geometry.location }, (results: any, status: any) => {
      if (status === "OK" && results[0]) {
        const components = results[0].address_components
        const area =
          components.find((c: any) => c.types.includes("sublocality_level_2"))?.long_name ||
          components.find((c: any) => c.types.includes("sublocality_level_1"))?.long_name ||
          components.find((c: any) => c.types.includes("locality"))?.long_name ||
          ""
        setArea(area)
      }
    })
    setShowResults(false)
  }

    useEffect(() => {}, []);

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
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const remaining = 3 - images.length;
  if (remaining <= 0) {
    toast("画像は最大3枚までです");
    return;
  }

  const filesToUpload = files.slice(0, remaining);
  setUploading(true);

  const uploadedUrls: string[] = [];

  for (const file of filesToUpload) {
    let uploadFile: File | Blob = file;
    let fileName = `${Date.now()}_${file.name}`;

    // 画像を圧縮する
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
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
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

   // HEICファイルをJPEGに変換（動的インポート）
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      try {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.8,
        });
        uploadFile = Array.isArray(converted) ? converted[0] : converted;
        fileName = `${Date.now()}_converted.jpg`;
        toast("HEICをJPEGに変換しました");
      } catch (e) {
        console.error("HEIC変換エラー:", e);
        toast("画像の変換に失敗しました");
        continue;
      }
    }

    // 圧縮実行
    if (uploadFile.type !== "image/heic") {
      uploadFile = await compressImage(uploadFile);
      fileName = `${Date.now()}_compressed.jpg`;
    }

   const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("fileName", fileName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      toast("画像アップロードに失敗しました");
      continue;
    }

    const { url } = await res.json();
    uploadedUrls.push(url);
  }

  setImages((prev) => [...prev, ...uploadedUrls]);
  if (uploadedUrls.length > 0) setImage(uploadedUrls[0]);
  setUploading(false);
};

  const updateBadges = async (userId: string) => {
  // 投稿データを取得
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId);

  if (!posts) return;

  const totalPosts = posts.length;
  const totalLikes = await supabase
    .from("likes")
    .select("id", { count: "exact" })
    .in("post_id", posts.map((p) => p.id));
  const likeCount = totalLikes.count ?? 0;

  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("id", { count: "exact" })
    .in("post_id", posts.map((p) => p.id));
  const wishlistCount = wishlists?.length ?? 0;

  const areas = [...new Set(posts.map((p) => p.area).filter(Boolean))];
  const areaCount = areas.length;

  // ランクバッジ
  let rankBadge = "First Bite";
  if (totalPosts >= 300) rankBadge = "食の探求者";
  else if (totalPosts >= 100) rankBadge = "グルメ通";
  else if (totalPosts >= 50) rankBadge = "フーディー";
  else if (totalPosts >= 10) rankBadge = "ビギナーグルメ";
  else if (totalPosts >= 1) rankBadge = "First Bite";

  // 実績バッジ
  const newBadges: string[] = [];

  if (totalPosts >= 1) newBadges.push("🍴 First Bite");
  if (likeCount >= 10) newBadges.push("🍽️❤️ 人気の一皿");
  if (likeCount >= 30) newBadges.push("🔥 バズグルメ");
  if (wishlistCount >= 50) newBadges.push("🤖 行きたい製造機");
  if (areaCount >= 3) newBadges.push("📍 街歩きビギナー");
  if (areaCount >= 10) newBadges.push("👣 エリアハンター");
  if (areaCount >= 30) newBadges.push("🧭 探検家");

  // 価格系
  const highEnd = posts.filter((p) => p.price >= 8001).length;
  const premium = posts.filter((p) => p.price >= 15001).length;
  const cheap = posts.filter((p) => p.price <= 1000).length;
  if (highEnd >= 5) newBadges.push("🍷 ブルジョワジー");
  if (premium >= 20) newBadges.push("💎 ラグジュアリーマスター");
  if (cheap >= 20) newBadges.push("🪙 コスパ神");

  // ジャンル系
  const lunchPosts = posts.filter((p) => p.genres?.includes("🌞 ランチ")).length;
  const sushiPosts = posts.filter((p) => p.genres?.includes("🍣 和食")).length;
  const ramenPosts = posts.filter((p) => p.genres?.includes("🍜 ラーメン")).length;
  const yakinikuPosts = posts.filter((p) => p.genres?.includes("🍖 焼肉")).length;
  const cafePosts = posts.filter((p) => p.genres?.includes("☕ カフェ")).length;
  const italianPosts = posts.filter((p) => p.genres?.includes("🍕 イタリアン")).length;
  const izakayaPosts = posts.filter((p) => p.genres?.includes("🍺 飲み")).length;

  if (lunchPosts >= 20) newBadges.push("☀️ ランチハンター");
  if (sushiPosts >= 10) newBadges.push("🍣 寿司狂い");
  if (ramenPosts >= 15) newBadges.push("🍜 ラーメン中毒");
  if (yakinikuPosts >= 10) newBadges.push("🥩 焼肉奉行");
  if (cafePosts >= 20) newBadges.push("☕ カフェ巡礼者");
  if (italianPosts >= 10) newBadges.push("🍝 パスタ貴族");
  if (izakayaPosts >= 20) newBadges.push("🍺 飲み歩き職人");

  // 現在のバッジを取得して新しいバッジだけ通知
  const { data: profile } = await supabase
    .from("profiles")
    .select("badges, rank_badge")
    .eq("id", userId)
    .single();

  const currentBadges = profile?.badges ?? [];
  const currentRank = profile?.rank_badge ?? "";
  const addedBadges = newBadges.filter((b) => !currentBadges.includes(b));

  // バッジ更新
  await supabase
    .from("profiles")
    .update({ rank_badge: rankBadge, badges: newBadges })
    .eq("id", userId);

  // 通知送信
  for (const badge of addedBadges) {
    await supabase.from("notifications").insert({
      user_id: userId,
      from_user_id: userId,
      from_username: "システム",
      type: "badge",
      message: `🎉 バッジ「${badge}」を獲得しました！`,
      is_read: false,
    });
  }
  if (rankBadge !== currentRank) {
    await supabase.from("notifications").insert({
      user_id: userId,
      from_user_id: userId,
      from_username: "システム",
      type: "badge",
      message: `🏅 ランクが「${rankBadge}」になりました！`,
      is_read: false,
    });
  }
};

const addPost = async () => {
    if (posting) return;
    setPosting(true);
    if (!restaurant.trim()) {
      toast("レストラン名を入力してください");
      setPosting(false);
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
 const mapLink = lat && lng
  ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant)}`;

  const { error } = await supabase.from("posts").insert([
    {
      restaurant: restaurant,
      comment: comment,
      rating: rating,
      image: images[0] ?? "",
      images: images,
      genres: selectedGenres,
      area: area,
      price: price,
      place_id: placeId,
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
    await updateBadges(userData.user.id);

    // ★4以上の場合フォロワーに通知
    if (rating >= 4) {
      const genreText = selectedGenres.length > 0 ? selectedGenres[0].replace(/^[^\s]+\s/, "") : "飲食店";
      const areaText = area || "近くのエリア";

      const { data: followers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userData.user.id);

      if (followers && followers.length > 0) {
        const notifications = followers.map((f) => ({
          user_id: f.follower_id,
          from_user_id: userData.user.id,
          from_username: displayName,
          type: "new_post",
          message: `${displayName}さんが${areaText}でお気に入りの${genreText}のお店を見つけました！`,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    setRestaurant("");
    setComment("");
    setImage(null);
    setImages([]);
    setSelectedGenres([]);
    setArea("");
    setPlaceId("");
    setRating(5);
    setMapUrl("");

   setPosting(false);
    setLastPostedRestaurant(restaurant);
    setShowShareModal(true);
  };

  const toggleFollowFromCard = async (targetUserId: string) => {
  if (!user) return;
  const isFollowing = followingIds.includes(targetUserId);
  if (isFollowing) {
    await supabase.from("follows").delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);
    setFollowingIds(followingIds.filter((id) => id !== targetUserId));
  } else {
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
    setFollowingIds([...followingIds, targetUserId]);

    // フォロー通知
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    const myName = myProfile?.username || "ユーザー";
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      from_user_id: user.id,
      from_username: myName,
      type: "follow",
      message: `${myName}さんがフォローしました`,
    });
  }
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

      // 投稿者に通知
      const post = posts.find(p => p.id === postId);
      if (post && post.user_id && post.user_id !== data.user.id) {
        const displayName = username || data.user.email?.split("@")[0] || "user";
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          from_user_id: data.user.id,
          from_username: displayName,
          post_id: postId,
          restaurant: post.restaurant,
          type: "like",
          message: `${displayName}さんが「${post.restaurant}」にいいねしました`,
        });
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
    maxWidth: "100%",
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
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}}>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <img
      src="/icon-192.png"
      alt="FoodRec"
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
      }}
    />
    <div>
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
  </div>

  {/* 通知ベル */}
  {user && (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications && unreadCount > 0) {
            supabase
              .from("notifications")
              .update({ is_read: true })
              .eq("user_id", user.id)
              .eq("is_read", false)
              .then(() => setUnreadCount(0));
          }
        }}
        style={{
          background: "none",
          border: "none",
          fontSize: "22px",
          cursor: "pointer",
          position: "relative",
          padding: "4px",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            background: "#e74c3c",
            color: "#fff",
            borderRadius: "50%",
            width: "16px",
            height: "16px",
            fontSize: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "700",
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* 通知一覧 */}
      {showNotifications && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "40px",
          width: "280px",
          backgroundColor: "#fff",
          border: "0.5px solid #eee",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100,
          maxHeight: "300px",
          overflowY: "auto",
        }}>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "#111", padding: "12px 14px", borderBottom: "0.5px solid #eee" }}>
            通知
          </p>
          {notifications.length === 0 && (
            <p style={{ fontSize: "13px", color: "#999", padding: "12px 14px" }}>通知はありません</p>
          )}
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                padding: "10px 14px",
                borderBottom: "0.5px solid #f0f0f0",
                backgroundColor: notif.is_read ? "#fff" : "#f0f7ff",
              }}
            >
              {notif.type === "badge" ? (
                <p style={{ fontSize: "13px", color: "#111", marginBottom: "2px" }}>
                  {notif.message}
                </p>
              ) : notif.type === "like" ? (
                <p style={{ fontSize: "13px", color: "#111", marginBottom: "2px" }}>
                  ❤️ <strong>{notif.from_username}</strong> が <strong>{notif.restaurant}</strong> にいいねしました
                </p>
              ) : notif.type === "wishlist" ? (
                <p style={{ fontSize: "13px", color: "#111", marginBottom: "2px" }}>
                  🔖 <strong>{notif.from_username}</strong> が <strong>{notif.restaurant}</strong> を行きたいリストに追加しました
                </p>
              ) : notif.type === "follow" ? (
                <p style={{ fontSize: "13px", color: "#111", marginBottom: "2px" }}>
                  👤 <strong>{notif.from_username}</strong> がフォローしました
                </p>
                   ) : notif.type === "new_post" ? (
                <p style={{ fontSize: "13px", color: "#111", marginBottom: "2px" }}>
                  🍽️ {notif.message}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: "13px", color: "#111", marginBottom: "2px" }}>
                    💬 <strong>{notif.from_username}</strong> が <strong>{notif.restaurant}</strong> にコメントしました
                  </p>
                  <p style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>
                    「{notif.message}」
                  </p>
                </>
              )}
              <p style={{ fontSize: "11px", color: "#bbb" }}>
                {new Date(notif.created_at).toLocaleString("ja-JP")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )}
</div>

    {!user && (
  <section style={{
    backgroundColor: "#fff",
    border: "0.5px solid #eee",
    borderRadius: "20px",
    padding: "28px 24px",
    marginBottom: "24px",
  }}>
   <div style={{ textAlign: "center", marginBottom: "24px" }}>
      <p style={{ fontSize: "18px", fontWeight: "700", color: "#111", marginBottom: "6px" }}>FoodRec</p>
      <p style={{ fontSize: "13px", color: "#999", marginBottom: "16px" }}>グルメ情報をRecordして、友達にRecommend</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left", backgroundColor: "#f8f8f8", borderRadius: "12px", padding: "14px 16px", marginBottom: "8px" }}>
        <p style={{ fontSize: "13px", color: "#444", margin: 0 }}>📍 友達がどこで何を食べたかが一目でわかる</p>
        <p style={{ fontSize: "13px", color: "#444", margin: 0 }}>❤️ お気に入りの店をいいね・行きたいリストに保存できる</p>
        <p style={{ fontSize: "13px", color: "#444", margin: 0 }}>🏅 投稿するたびにバッジを獲得しよう</p>
      </div>
    </div>

    <div style={{
      display: "flex",
      background: "#f0f0f0",
      borderRadius: "12px",
      padding: "4px",
      marginBottom: "24px",
    }}>
      <button
        onClick={() => setAuthTab("login")}
        style={{
          flex: 1, padding: "8px", borderRadius: "8px", border: "none",
          backgroundColor: authTab === "login" ? "#fff" : "transparent",
          color: authTab === "login" ? "#111" : "#888",
          fontSize: "13px", fontWeight: "500", cursor: "pointer",
          boxShadow: authTab === "login" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
        }}
      >ログイン</button>
      <button
        onClick={() => setAuthTab("signup")}
        style={{
          flex: 1, padding: "8px", borderRadius: "8px", border: "none",
          backgroundColor: authTab === "signup" ? "#fff" : "transparent",
          color: authTab === "signup" ? "#111" : "#888",
          fontSize: "13px", fontWeight: "500", cursor: "pointer",
          boxShadow: authTab === "signup" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
        }}
      >新規登録</button>
    </div>

    <div style={{ marginBottom: "12px" }}>
      <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px", fontWeight: "500" }}>メールアドレス</label>
      <input
        placeholder="example@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "0.5px solid #e0e0e0", backgroundColor: "#fafafa", boxSizing: "border-box", fontSize: "14px", color: "#111" }}
      />
    </div>

    <div style={{ marginBottom: "16px" }}>
      <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px", fontWeight: "500" }}>パスワード</label>
      <input
        type="password"
        placeholder={authTab === "login" ? "パスワードを入力" : "8文字以上"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "0.5px solid #e0e0e0", backgroundColor: "#fafafa", boxSizing: "border-box", fontSize: "14px", color: "#111" }}
      />
    </div>

    {authTab === "signup" && (
      <>
        <hr style={{ border: "none", borderTop: "0.5px solid #eee", margin: "16px 0" }} />
        <p style={{ fontSize: "12px", color: "#888", marginBottom: "14px" }}>プロフィールを設定しましょう</p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
          <div
            onClick={() => document.getElementById("avatar-input")?.click()}
            style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#f0f0f0", border: "0.5px solid #ddd", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", marginBottom: "6px" }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" 
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "28px" }}>🍽️</span>
            )}
          </div>
          <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatar} style={{ display: "none" }} />
          <span style={{ fontSize: "11px", color: "#bbb" }}>タップして画像を選択</span>
        </div>

        <div style={{ marginBottom: "4px" }}>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px", fontWeight: "500" }}>
            表示名 <span style={{ color: "#e74c3c", fontSize: "10px" }}>必須</span>
          </label>
          <input
            placeholder="例: 食いしん坊たろう"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "0.5px solid #e0e0e0", backgroundColor: "#fafafa", boxSizing: "border-box", fontSize: "14px", color: "#111" }}
          />
        </div>
        <p style={{ fontSize: "11px", color: "#bbb", textAlign: "right", marginBottom: "12px" }}>{username.length} / 20</p>

        <div style={{ marginBottom: "4px" }}>
          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px", fontWeight: "500" }}>自己紹介</label>
          <textarea
            placeholder={"自己紹介（任意）\n食べログより友達の味覚を信じています"}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={100}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "0.5px solid #e0e0e0", backgroundColor: "#fafafa", boxSizing: "border-box", resize: "none", height: "70px", fontSize: "14px", color: "#111" }}
          />
        </div>
        <p style={{ fontSize: "11px", color: "#bbb", textAlign: "right", marginBottom: "16px" }}>{bio.length} / 100</p>
      </>
    )}

    {authTab === "signup" && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "16px" }}>
        <input
          type="checkbox"
          id="agree"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          style={{ marginTop: "2px", cursor: "pointer" }}
        />
        <label htmlFor="agree" style={{ fontSize: "12px", color: "#666", lineHeight: "1.6", cursor: "pointer" }}>
          <a href="/terms" target="_blank" style={{ color: "#2563eb" }}>利用規約</a>
          {" "}および{" "}
          <a href="/privacy" target="_blank" style={{ color: "#2563eb" }}>プライバシーポリシー</a>
          に同意します
        </label>
      </div>
    )}

    <button
      onClick={authTab === "login" ? signIn : signUp}
      style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", backgroundColor: "#111", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
    >
      {authTab === "login" ? "ログイン" : "アカウントを作成"}
    </button>

    {deferredPrompt && (
      <button
        onClick={async () => {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
        }}
        style={{
          marginTop: "12px",
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "0.5px solid #ddd",
          backgroundColor: "#fff",
          color: "#111",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
        }}
      >
        📱 ホーム画面に追加する
      </button>
    )}
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

        <div style={{ position: "relative", marginBottom: "12px" }}>
  <input
    ref={restaurantInputRef}
    placeholder="レストラン名を検索"
    value={restaurant}
    onChange={(e) => {
      setRestaurant(e.target.value)
      searchPlaces(e.target.value)
    }}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      boxSizing: "border-box",
      color: "#111",
    }}
  />
  {showResults && searchResults.length > 0 && (
    <div style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "8px",
      maxHeight: "240px",
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
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f8f8")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
        >
          <span style={{ fontSize: "16px" }}>📍</span>
          <div>
            <p style={{ margin: 0, fontSize: "13px", color: "#111", fontWeight: "500" }}>
              {place.name}
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#999" }}>
              {place.formatted_address}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

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
             color: "#111",
          }}
        />

        <div style={{ marginTop: "10px", marginBottom: "16px" }}>
  <p style={{ marginBottom: "8px",color:"#111" }}>評価：</p>
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
{/* ジャンル選択 */}
<div style={{ marginBottom: "16px" }}>
  <p style={{ fontSize: "13px", color: "#111", marginBottom: "8px" }}>シーン</p>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
    {["🌞 ランチ", "🌙 ディナー", "☕ カフェ", "🍺 飲み", "👫 デート", "👥 グループ", "🥂 2次会"].map((genre) => (
      <button
        key={genre}
        onClick={() => setSelectedGenres(
          selectedGenres.includes(genre)
            ? selectedGenres.filter(g => g !== genre)
            : [...selectedGenres, genre]
        )}
        style={{
          padding: "6px 14px",
          borderRadius: "20px",
          border: "0.5px solid #ddd",
          backgroundColor: selectedGenres.includes(genre) ? "#111" : "#fff",
          color: selectedGenres.includes(genre) ? "#fff" : "#666",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
        }}
      >
        {genre}
      </button>
    ))}
  </div>
  <p style={{ fontSize: "13px", color: "#111", marginBottom: "8px" }}>料理ジャンル</p>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
    {["🍣 和食", "🍜 ラーメン", "🍝 つけ麺", "🫕 うどん", "🍜 蕎麦", "🍱 鮨", "🦞 海鮮", "🍝 洋食", "🍕 イタリアン", "🍷 ビストロ", "🍜 中華", "🌮 エスニック", "🍖 焼肉", "🦌 ジビエ", "🥗 ヘルシー", "🍔 ファストフード", "🍰 スイーツ", "🍺 クラフトビール"].map((genre) => (
      <button
        key={genre}
        onClick={() => setSelectedGenres(
          selectedGenres.includes(genre)
            ? selectedGenres.filter(g => g !== genre)
            : [...selectedGenres, genre]
        )}
        style={{
          padding: "6px 14px",
          borderRadius: "20px",
          border: "0.5px solid #ddd",
          backgroundColor: selectedGenres.includes(genre) ? "#111" : "#fff",
          color: selectedGenres.includes(genre) ? "#fff" : "#666",
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
        }}
      >
        {genre}
      </button>
    ))}
  </div>
</div>
       {/* 価格帯 */}
<div style={{ marginBottom: "16px" }}>
  <p style={{ fontSize: "13px", color: "#111", marginBottom: "8px" }}>
    💰 価格帯（1人あたり）
  </p>
  <div style={{ padding: "0 4px" }}>
    <input
      type="range"
      min={1000}
      max={30000}
      step={1000}
      value={price}
      onChange={(e) => setPrice(Number(e.target.value))}
      style={{ width: "100%", accentColor: "#111" }}
    />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
      <span style={{ fontSize: "12px", color: "#999" }}>¥500</span>
      <span style={{ fontSize: "15px", fontWeight: "600", color: "#111" }}>
        {price >= 30000 ? "¥30,000+" : `¥${price.toLocaleString()}`}
      </span>
      <span style={{ fontSize: "12px", color: "#999" }}>¥30,000+</span>
    </div>
    <div style={{ display: "flex", justifyContent: "center", marginTop: "4px" }}>
      <span style={{ fontSize: "12px", color: "#999" }}>
        {price <= 1000 ? "コスパ飯" : price <= 3000 ? "普通" : price <= 8000 ? "ちょっと良い" : price <= 15000 ? "高め" : "プレミアム"}
      </span>
    </div>
  </div>
</div>

        <label style={{
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  borderRadius: "20px",
  border: "0.5px solid #ddd",
  backgroundColor: "#fff",
  color: "#555",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
}}>
  📷 写真を追加
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={handleImage}
    style={{ display: "none" }}
  />
</label>
<p style={{ fontSize: "11px", color: "#aaa", marginTop: "6px" }}>
  最大3枚まで選択できます（{images.length}/3）
</p>

{uploading && (
  <p style={{ color: "#666", marginTop: "8px" }}>
    画像をアップロード中...
  </p>
)}

{images.length > 0 && (
  <div style={{ marginTop: "16px" }}>
    <p style={{ marginBottom: "8px", color: "#111" }}>画像プレビュー</p>
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {images.map((url, index) => (
        <div key={index} style={{ position: "relative" }}>
          <img
            src={url}
            alt={`preview-${index}`}
            style={{
              width: "100px",
              height: "100px",
              objectFit: "cover",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <button
            onClick={() => setImages(images.filter((_, i) => i !== index))}
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "#fff",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}

        <button
          onClick={addPost}
          disabled={posting}
          style={{
            marginTop: "20px",
            padding: "12px 20px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: posting ? "#888" : "#111",
            color: "#fff",
            cursor: posting ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {posting ? "投稿中..." : "投稿"}
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
   📝 投稿数/5日
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
        <p style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>{post.username}</p>
        <p style={{ fontSize: "11px", color: "#999" }}>📝 {(post as any).count}件投稿</p>
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
  <div style={{ position: "relative", flexShrink: 0 }}>
  <div
    style={{
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      backgroundColor: "#f0f0f0",
      border: "1px solid #eee",
      overflow: "hidden",
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
        loading="lazy"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      "🍽️"
    )}
  </div>
  {post.profiles?.rank_badge && (
    <div style={{
      position: "absolute",
      bottom: "-2px",
      right: "-2px",
      fontSize: "10px",
      backgroundColor: "#fff",
      borderRadius: "50%",
      width: "16px",
      height: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid #eee",
    }}>
      {post.profiles.rank_badge === "First Bite" ? "🍴" :
       post.profiles.rank_badge === "ビギナーグルメ" ? "🍽️" :
       post.profiles.rank_badge === "フーディー" ? "🥘" :
       post.profiles.rank_badge === "グルメ通" ? "🥇" :
       post.profiles.rank_badge === "食の探求者" ? "👑" : "🍴"}
    </div>
  )}
  </div>

  {/* ユーザー名 */}
  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
    {user && post.user_id && post.user_id !== user.id && (
      followingIds.includes(post.user_id) ? (
        <span style={{ fontSize: "11px", color: "#999" }}>✓ フォロー中</span>
      ) : (
        <button
          onClick={() => toggleFollowFromCard(post.user_id!)}
          style={{
            padding: "2px 8px",
            borderRadius: "20px",
            border: "0.5px solid #ddd",
            backgroundColor: "#fff",
            fontSize: "11px",
            color: "#111",
            cursor: "pointer",
          }}
        >
          フォロー
        </button>
      )
    )}
  </div>
</div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
 <a href={post.place_id
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}&query_place_id=${post.place_id}`
    : post.lat && post.lng
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}&center=${post.lat},${post.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.restaurant)}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: "none" }}
  >
    <h3 style={{ margin: 0, color: "#2563eb", textDecoration: "underline" }}>{post.restaurant}</h3>
  </a>
  {post.area && (
    <span style={{
      padding: "2px 8px",
      borderRadius: "4px",
      backgroundColor: "#f0f0f0",
      color: "#555",
      fontSize: "11px",
      fontWeight: "500",
      whiteSpace: "nowrap",
    }}>
      📍 {post.area}
    </span>
  )}
</div>

{post.genres && post.genres.length > 0 && (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
    {post.genres.map((genre) => (
      <span
        key={genre}
        style={{
          padding: "3px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          backgroundColor: "#f0f0f0",
          color: "#555",
        }}
      >
        {genre}
      </span>
    ))}
  </div>
)}

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

          <p style={{ marginBottom: "12px", lineHeight: 1.6, color: "#111" }}>
            {post.comment}
          </p>
{console.log("image:", post.image, "images:", post.images, "length:", post.images?.length)}
  <div style={{
  display: "flex",
  overflowX: "auto",
  gap: "8px",
  marginBottom: "8px",
  scrollbarWidth: "none",
}}>
  {(post.images && post.images.length > 0 ? post.images : (post.image && post.image !== "") ? [post.image] : []).map((url, index) => (
    <img
      key={index}
      src={url}
      alt={`${post.restaurant}-${index}`}
      loading="lazy"
      style={{
        width: post.images && post.images.length > 1 ? "260px" : "100%",
      minWidth: post.images && post.images.length > 1 ? "260px" : "auto",
      maxWidth: "100%",
      height: "200px",
      objectFit: "cover",
        borderRadius: "12px",
        border: "1px solid #eee",
        flexShrink: 0,
      }}
    />
  ))}
</div>
          <div
  style={{
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "12px",
  }}
>
  <button
    onClick={() => toggleLike(post.id)}
    style={{
      padding: "8px 14px",
      borderRadius: "20px",
      border: "0.5px solid #ffc0c5",
      backgroundColor: likedPostIds.includes(post.id) ? "#ffe4e6" : "#fff",
      cursor: "pointer",
      fontSize: "12px",
    }}
  >
    {likedPostIds.includes(post.id) ? "❤️ いいね済み" : "🤍 いいね"}
  </button>

  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
    <span style={{ fontSize: "13px", color: "#999" }}>
      {likeCounts[post.id] || 0}件
    </span>
    {likeUsers[post.id] && likeUsers[post.id].length > 0 && (
      <span style={{ fontSize: "11px", color: "#bbb" }}>
        {(() => {
          const users = likeUsers[post.id];
          const followingUsers = users.filter(u => followingIds.includes(u.user_id) && u.user_id !== user?.id);
          const displayUsers = followingUsers.length > 0 ? followingUsers : users.filter(u => u.user_id !== user?.id);
          if (displayUsers.length === 0) return null;
          const names = displayUsers.slice(0, 2).map(u => u.username).join("、");
          const rest = displayUsers.length - 2;
          return rest > 0 ? `${names}、他${rest}人` : names;
        })()}
      </span>
    )}
  </div>

  <button
    onClick={() => toggleWishlist(post.id)}
    style={{
      padding: "8px 14px",
      borderRadius: "20px",
      border: wishlistPostIds.includes(post.id) ? "0.5px solid #f5d060" : "0.5px solid #ddd",
      backgroundColor: wishlistPostIds.includes(post.id) ? "#fff8e1" : "#fff",
      color: wishlistPostIds.includes(post.id) ? "#f5a623" : "#666",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "500",
    }}
  >
    {wishlistPostIds.includes(post.id) ? "🔖 行きたい済み" : "🔖 行きたい"}
  </button>
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
    {showShareModal && (
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
      borderRadius: "16px",
      padding: "24px",
      width: "100%",
      maxWidth: "360px",
    }}>
      <p style={{ fontSize: "16px", fontWeight: "700", color: "#111", marginBottom: "8px", textAlign: "center" }}>
        🎉 投稿しました！
      </p>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px", textAlign: "center" }}>
        友達にシェアしますか？
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={() => {
            const text = `${lastPostedRestaurant}に行ってきました！お店の記録・おすすめができるグルメアプリ「FoodRec」で投稿しました🍽️ #FoodRec`;
            const url = `https://food-rec-rouge.vercel.app`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
            setShowShareModal(false);
            toast("投稿しました");
          }}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#000",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          𝕏 でシェア
        </button>
        <button
          onClick={() => {
            const text = `${lastPostedRestaurant}に行ってきました！お店の記録・おすすめができるグルメアプリ「FoodRec」で投稿しました🍽️ #FoodRec\nhttps://food-rec-rouge.vercel.app`;
            window.open(`https://line.me/R/share?text=${encodeURIComponent(text)}`, "_blank");
            setShowShareModal(false);
            toast("投稿しました");
          }}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#06C755",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          LINE でシェア
        </button>
        <button
          onClick={() => {
            setShowShareModal(false);
            toast("投稿しました");
          }}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "0.5px solid #ddd",
            backgroundColor: "#fff",
            color: "#666",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          スキップ
        </button>
      </div>
    </div>
  </div>
)}
</main>
  );
}