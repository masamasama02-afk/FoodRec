export default function TermsPage() {
  return (
    <main style={{ padding: "24px", maxWidth: "700px", margin: "0 auto", paddingBottom: "80px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>利用規約</h1>

      <p style={{ fontSize: "12px", color: "#999", marginBottom: "24px" }}>最終更新日：2026年4月17日</p>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>第1条（適用）</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>本規約は、FoodRec（以下「本サービス」）の利用に関する条件を定めるものです。ユーザーは本規約に同意した上で本サービスを利用するものとします。</p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>第2条（禁止事項）</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>以下の行為を禁止します。</p>
        <ul style={{ fontSize: "13px", color: "#555", lineHeight: "1.8", paddingLeft: "20px" }}>
          <li>他のユーザーへの誹謗中傷</li>
          <li>虚偽の情報の投稿</li>
          <li>著作権を侵害するコンテンツの投稿</li>
          <li>スパム行為</li>
          <li>その他、運営が不適切と判断する行為</li>
        </ul>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>第3条（サービスの変更・停止）</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>運営は予告なくサービスの内容を変更・停止する場合があります。</p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>第4条（免責事項）</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>本サービスの利用により生じた損害について、運営は一切の責任を負いません。</p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>第5条（お問い合わせ）</h2>
        <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.8" }}>本規約に関するお問い合わせは、アプリ内のお問い合わせフォームよりご連絡ください。</p>
      </section>
    </main>
  );
}