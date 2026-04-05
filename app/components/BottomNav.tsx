"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/map", label: "マップ", icon: "🗺️" },
  { href: "/search", label: "検索", icon: "🔍" },
  { href: "/follows", label: "フォロー", icon: "👥" },
  { href: "/profile", label: "マイページ", icon: "👤" },
];

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#fff",
      borderTop: "1px solid #eee",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      height: "60px",
      zIndex: 100,
    }}>
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              textDecoration: "none",
              flex: 1,
              padding: "8px 0",
            }}
          >
            <span style={{ fontSize: "22px" }}>{item.icon}</span>
            <span style={{
              fontSize: "10px",
              color: isActive ? "#111" : "#aaa",
              fontWeight: isActive ? "bold" : "normal",
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}