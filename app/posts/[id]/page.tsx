"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams } from "next/navigation";

export default function PostDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<any>(null);
  const [likes, setLikes] = useState<number>(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [user, setUser] = useState<any>(null);

  // ===== 投稿取得 =====
  const fetchPost = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    setPost(data);
  };

  // ===== ユーザー取得 =====
  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  };

  // ===== いいね取得 =====
  const fetchLikes = async () => {
    const { data } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", id);

    if (!data) return;

    setLikes(data.length);

    if (user) {
      const mine = data.find((l: any) => l.user_id === user.id);
      setLiked(!!mine);
    }
  };

  // ===== いいねトグル =====
  const toggleLike = async () => {
    if (!user) return;

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", id)
        .eq("user_id", user.id);
    } else {
      await supabase.from("likes").insert({
        post_id: id,
        user_id: user.id,
      });
    }

    fetchLikes();
  };

  // ===== コメント取得 =====
  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  // ===== コメント投稿 =====
  const addComment = async () => {
    if (!user || !commentInput) return;

    await supabase.from("comments").insert({
      post_id: id,
      user_id: user.id,
      username: user.email,
      comment: commentInput,
    });

    setCommentInput("");
    fetchComments();
  };

  // ===== 初期化 =====
  useEffect(() => {
    if (!id) return;

    const init = async () => {
      await fetchUser();
      await fetchPost();
      await fetchComments();
    };

    init();
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchLikes();
    }
  }, [user]);

  if (!post) return <p style={{ padding: "24px" }}>読み込み中...</p>;

  return (
    <main style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>{post.restaurant}</h1>

      <p>{"★".repeat(post.rating)}</p>

      <p>{post.comment}</p>

      {post.image && (
        <img
          src={post.image}
          style={{ width: "100%", borderRadius: "12px" }}
        />
      )}

      <div style={{ marginTop: "20px" }}>
        <button onClick={toggleLike}>
          {liked ? "❤️" : "🤍"}
        </button>
        <span> {likes}</span>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3>コメント</h3>

      <input
        value={commentInput}
        onChange={(e) => setCommentInput(e.target.value)}
        placeholder="コメントを書く"
      />
      <button onClick={addComment}>投稿</button>

      {comments.map((c) => (
        <div key={c.id}>
          <p>{c.username}</p>
          <p>{c.comment}</p>
        </div>
      ))}
    </main>
  );
}