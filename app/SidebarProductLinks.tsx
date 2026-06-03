"use client";

import { useEffect } from "react";

export default function SidebarProductLinks() {
  useEffect(() => {
    const sidebarNav = document.querySelector(".sidebar .nav-list");
    if (!sidebarNav) return;

    document.querySelectorAll(".sidebar-submenu-reports").forEach((node) => node.remove());
    if (document.querySelector(".sidebar-finance-link")) return;

    const link = document.createElement("a");
    link.className = "nav-button sidebar-direct-link sidebar-finance-link";
    link.href = "/financeiro";
    link.innerHTML = '<span class="nav-label"><span>◈</span>Financeiro</span><span>›</span>';

    const settingsButton = Array.from(sidebarNav.children).find((child) => child.textContent?.includes("Configurações"));
    if (settingsButton) {
      sidebarNav.insertBefore(link, settingsButton);
    } else {
      sidebarNav.appendChild(link);
    }
  }, []);

  return null;
}
