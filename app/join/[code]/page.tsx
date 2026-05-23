"use client";

import { supabase } from "../../../lib/supabase";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [user, setUser] = useState<any>(null);
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      // コミュニティ取得
      const { data: communityData } = await supabase
        .from("communities")
        .select("*")
        .eq("invite_code", code)
        .maybeSingle();

      if (!communityData) {
        setLoading(false);
        return;
      }

      setCommunity(communityData);

      // ログインユーザー確認
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        setUser(auth.user);

        // 既に参加済みか確認
        const { data: member } = await supabase
          .from("community_members")
          .select("*")
          .eq("community_id", communityData.id)
          .eq("user_id", auth.user.id)
          .maybeSingle();

        if (member) setAlreadyJoined(true);
      }

      setLoading(false);
    };
    init();
  }, [code]);

  const joinCommunity = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    setJoining(true);

    const { error } = await supabase.from("community_members").insert({
      community_id: community.id,
      user_id: user.id,
    });

    if (error) {
      alert("参加に失敗しました");
      setJoining(false);
      return;
    }

    router.push(`/communities/${community.id}`);
  };

  if (loading) return (
    <main style={{ padding: "24px", textAlign: "center" }}>読み込み中...</main>
  );

  if (!community) return (
    <main style={{ padding: "24px", textAlign: "center" }}>
      <p style={{ fontSize: "15px", color: "#999" }}>招待リンクが無効です</p>
    </main>
  );

  return (
    <main style={{
      padding: "24px",
      maxWidth: "400px",
      margin: "0 auto",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "20px",
        padding: "36px 28px",
        width: "100%",
        textAlign: "center",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <p style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</p>
        <p style={{ fontSize: "13px", color: "#999", marginBottom: "8px", letterSpacing: "1px" }}>
          コミュニティへの招待
        </p>
        <p style={{ fontSize: "22px", fontWeight: "700", color: "#111", marginBottom: "12px" }}>
          {community.name}
        </p>
        {community.description && (
          <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
            {community.description}
          </p>
        )}

        {!user && (
          <p style={{ fontSize: "13px", color: "#e74c3c", marginBottom: "16px" }}>
            参加するにはログインが必要です
          </p>
        )}

        {alreadyJoined ? (
          <button
            onClick={() => router.push(`/communities/${community.id}`)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            コミュニティを開く →
          </button>
        ) : (
          <button
            onClick={user ? joinCommunity : () => router.push("/")}
            disabled={joining}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: joining ? "#ccc" : "#111",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "600",
              cursor: joining ? "not-allowed" : "pointer",
              marginBottom: "12px",
            }}
          >
            {joining ? "参加中..." : user ? "参加する" : "ログインして参加する"}
          </button>
        )}

        <button
          onClick={() => router.push("/")}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "transparent",
            color: "#999",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ホームに戻る
        </button>
      </div>
    </main>
  );
}