export default function PrivacyPage() {
  return (
    <main style={{ padding: "24px", maxWidth: "700px", margin: "0 auto", paddingBottom: "80px" }}>
      <button
        onClick={() => window.history.back()}
        style={{
          marginBottom: "16px",
          background: "none",
          border: "none",
          fontSize: "14px",
          color: "#2563eb",
          cursor: "pointer",
          padding: 0,
        }}
      >
        ← 戻る
      </button>
      <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>プライバシーポリシー</h1>

      <p style={{ fontSize: "12px", color: "#999", marginBottom: "24px" }}>最終更新日：2026年4月17日</p>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>取得する情報</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>本サービスでは以下の情報を取得します。</p>
        <ul style={{ fontSize: "13px", color: "#555", lineHeight: "1.8", paddingLeft: "20px" }}>
          <li>メールアドレス</li>
          <li>表示名・自己紹介・プロフィール画像</li>
          <li>投稿内容（店名・コメント・画像・評価など）</li>
          <li>位置情報（投稿時のみ）</li>
        </ul>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>情報の利用目的</h2>
        <ul style={{ fontSize: "13px", color: "#555", lineHeight: "1.8", paddingLeft: "20px" }}>
          <li>サービスの提供・運営</li>
          <li>ユーザーサポート</li>
          <li>サービスの改善</li>
        </ul>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>第三者への提供</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>法令に基づく場合を除き、取得した個人情報を第三者に提供することはありません。</p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>情報の管理</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>取得した情報はSupabaseにより安全に管理されます。不正アクセスや漏洩防止のため適切なセキュリティ対策を講じています。</p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>お問い合わせ</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>プライバシーポリシーに関するお問い合わせは、アプリ内のお問い合わせフォームよりご連絡ください。</p>
      </section>
    </main>
  );
}