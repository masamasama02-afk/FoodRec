"use client";


import { supabase } from "../../lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CommunitiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const fetchCommunities = async (userId: string) => {
    const { data } = await supabase
      .from("community_members")
      .select("community_id, communities(id, name, description, invite_code, owner_id, created_at)")
      .eq("user_id", userId);

    setCommunities((data || []).map((d: any) => d.communities));
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/");
        return;
      }
      setUser(data.user);
      await fetchCommunities(data.user.id);
      setLoading(false);
    };
    init();
  }, []);

  const createCommunity = async () => {
    if (!name.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("communities")
      .insert({ name: name.trim(), description: description.trim(), owner_id: user.id, is_public: isPublic })
      .select()
      .single();

    if (error || !data) {
      alert("作成失敗");
      setCreating(false);
      return;
    }

    // 作成者を自動でメンバーに追加
    await supabase.from("community_members").insert({
      community_id: data.id,
      user_id: user.id,
    });

    setName("");
    setDescription("");
    setShowCreate(false);
    setCreating(false);
    await fetchCommunities(user.id);
  };

  if (loading) return <main style={{ padding: "24px" }}>読み込み中...</main>;

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
        <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>
          👥 コミュニティ
        </h1>
        <button
          onClick={() => setShowCreate(true)}
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
        >
          ＋ 作成
        </button>
      </div>
      {/* 公開コミュニティ一覧 */}
<PublicCommunities userId={user?.id} />

      {/* コミュニティ一覧 */}
      {communities.length === 0 && (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "40px 24px",
          textAlign: "center",
          border: "0.5px solid #eee",
        }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>🍽️</p>
          <p style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "8px" }}>
            まだコミュニティがありません
          </p>
          <p style={{ fontSize: "13px", color: "#999", marginBottom: "20px", lineHeight: 1.6 }}>
            グルメ仲間とコミュニティを作って<br />お互いのおすすめを共有しよう
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: "12px 28px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            コミュニティを作成する
          </button>
        </div>
      )}

      {communities.map((community) => (
        <div
          key={community.id}
          onClick={() => router.push(`/communities/${community.id}`)}
          style={{
            backgroundColor: "#fff",
            border: "0.5px solid #eee",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "12px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <p style={{ fontSize: "16px", fontWeight: "700", color: "#111" }}>
              {community.name}
            </p>
            <span style={{ fontSize: "12px", color: "#bbb" }}>→</span>
          </div>
          {community.description && (
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "10px", lineHeight: 1.5 }}>
              {community.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {community.owner_id === user?.id && (
  <button
    onClick={async (e) => {
      e.stopPropagation();
      if (!confirm("このコミュニティを削除しますか？")) return;
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", community.id);
      if (error) {
        alert("削除失敗");
        return;
      }
      await fetchCommunities(user.id);
    }}
    style={{
      padding: "6px 14px",
      borderRadius: "20px",
      border: "0.5px solid #ffcccc",
      backgroundColor: "#fff0f0",
      color: "#cc0000",
      fontSize: "12px",
      cursor: "pointer",
      marginBottom: "8px",
    }}
  >
    削除
  </button>
)}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
  <button
    onClick={(e) => {
      e.stopPropagation();
      const url = `https://foodrec.app/join/${community.invite_code}`;
      const text = `「${community.name}」のグルメコミュニティに招待します！FoodRecで友達のおすすめレストランをチェックしよう🍽️`;
      window.open(`https://line.me/R/share?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
    }}
    style={{
      padding: "8px 16px",
      borderRadius: "20px",
      border: "none",
      backgroundColor: "#06C755",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    LINE で招待
  </button>
  <button
    onClick={(e) => {
      e.stopPropagation();
      const url = `https://foodrec.app/join/${community.invite_code}`;
      const text = `「${community.name}」のグルメコミュニティに招待します！FoodRecで友達のおすすめレストランをチェックしよう🍽️`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    }}
    style={{
      padding: "8px 16px",
      borderRadius: "20px",
      border: "none",
      backgroundColor: "#000",
      color: "#fff",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    𝕏 で招待
  </button>
  <button
    onClick={(e) => {
      e.stopPropagation();
      const url = `https://foodrec.app/join/${community.invite_code}`;
      navigator.clipboard.writeText(url);
      alert("招待リンクをコピーしました！");
    }}
    style={{
      padding: "8px 16px",
      borderRadius: "20px",
      border: "0.5px solid #ddd",
      backgroundColor: "#fff",
      color: "#111",
      fontSize: "12px",
      cursor: "pointer",
    }}
  >
    🔗 リンクをコピー
  </button>
</div>
          </div>
        </div>
      ))}

      {/* 作成モーダル */}
      {showCreate && (
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
            padding: "28px 24px",
            width: "100%",
            maxWidth: "400px",
          }}>
            <p style={{ fontSize: "17px", fontWeight: "700", color: "#111", marginBottom: "20px" }}>
              コミュニティを作成
            </p>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "6px" }}>
                コミュニティ名 <span style={{ color: "#e74c3c" }}>*</span>
              </label>
              <input
                placeholder="例: 会社のグルメ部"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
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
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "6px" }}>
                説明（任意）
              </label>
              <div style={{ marginBottom: "20px" }}>
  <label style={{ fontSize: "13px", color: "#666", display: "block", marginBottom: "8px" }}>
    公開設定
  </label>
  <div style={{ display: "flex", gap: "8px" }}>
    <button
      onClick={() => setIsPublic(true)}
      style={{
        flex: 1, padding: "10px",
        borderRadius: "10px", border: "none",
        backgroundColor: isPublic ? "#111" : "#f0f0f0",
        color: isPublic ? "#fff" : "#666",
        fontSize: "13px", cursor: "pointer",
      }}
    >🌐 公開</button>
    <button
      onClick={() => setIsPublic(false)}
      style={{
        flex: 1, padding: "10px",
        borderRadius: "10px", border: "none",
        backgroundColor: !isPublic ? "#111" : "#f0f0f0",
        color: !isPublic ? "#fff" : "#666",
        fontSize: "13px", cursor: "pointer",
      }}
    >🔒 非公開</button>
  </div>
  <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
    {isPublic ? "コミュニティ名と人数が公開されます" : "招待された人だけが参加できます"}
  </p>
</div>
              <textarea
                placeholder="どんなコミュニティか説明しよう"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
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
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={createCommunity}
                disabled={creating || !name.trim()}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: creating || !name.trim() ? "#ccc" : "#111",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: creating || !name.trim() ? "not-allowed" : "pointer",
                }}
              >
                {creating ? "作成中..." : "作成する"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setName(""); setDescription(""); }}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "12px",
                  border: "0.5px solid #ddd",
                  backgroundColor: "#fff",
                  color: "#666",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
  function PublicCommunities({ userId }: { userId: string }) {
  const [publicCommunities, setPublicCommunities] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("communities")
        .select("id, name, description, invite_code")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      // 各コミュニティのメンバー数を取得
      const withCounts = await Promise.all((data || []).map(async (c: any) => {
        const { count } = await supabase
          .from("community_members")
          .select("*", { count: "exact", head: true })
          .eq("community_id", c.id);
        return { ...c, member_count: count || 0 };
      }));

      setPublicCommunities(withCounts);
    };
    fetch();
  }, []);

  if (publicCommunities.length === 0) return null;

  return (
    <div style={{ marginBottom: "24px" }}>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#111", marginBottom: "12px" }}>
        📊 みんなのコミュニティ
      </p>
      {publicCommunities.map((community) => (
        <div key={community.id} style={{
          backgroundColor: "#fff",
          border: "0.5px solid #eee",
          borderRadius: "16px",
          padding: "14px 16px",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: "15px", fontWeight: "600", color: "#111", marginBottom: "2px" }}>
              {community.name}
            </p>
            {community.description && (
              <p style={{ fontSize: "12px", color: "#999" }}>{community.description}</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <p style={{ fontSize: "12px", color: "#999" }}>👥 {community.member_count}人</p>
            <button
              onClick={() => window.location.href = `/join/${community.invite_code}`}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: "#111",
                color: "#fff",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >参加</button>
          </div>
        </div>
      ))}
    </div>
  );
}
}