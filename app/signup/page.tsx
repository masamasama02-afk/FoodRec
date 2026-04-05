"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const router = useRouter();

  const handleSignup = async () => {
    // ★入力チェック
    if (!email.trim() || !password.trim() || !username.trim()) {
      alert("すべて入力してください");
      return;
    }

    // ① ユーザー登録
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    // ② ログイン（これ超重要）
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (signInError) {
      alert("ログイン失敗");
      return;
    }

    // ③ ユーザー取得
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert("ユーザー取得失敗");
      return;
    }

    // ④ プロフィール作成
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userData.user.id,
        username: username.trim(),
      });

    if (profileError) {
      console.error(profileError);
      alert("プロフィール作成失敗");
      return;
    }

    // ★⑤ 成功後に遷移（ここが一番重要）
    router.push("/profile");
  };

  return (
    <main style={{ padding: "24px" }}>
      <h1>新規登録</h1>

      <input
        type="email"
        placeholder="メール"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <input
        type="text"
        placeholder="ユーザー名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", marginBottom: "10px" }}
      />

      <button onClick={handleSignup}>
        登録
      </button>
    </main>
  );
}