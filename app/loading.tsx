export default function Loading() {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "#f2f2f7",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <img
        src="/icon-192-v2.png"
        alt="FoodRec"
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "14px",
          marginBottom: "16px",
          opacity: 0.8,
        }}
      />
      <p style={{ fontSize: "14px", color: "#999", fontWeight: "500" }}>読み込み中...</p>
    </div>
  );
}