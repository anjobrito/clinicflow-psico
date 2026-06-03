"use client";

import { useEffect } from "react";

export default function SidebarProductLinks() {
  useEffect(() => {
    const sidebarNav = document.querySelector(".sidebar .nav-list");
    if (!sidebarNav || document.querySelector(".sidebar-submenu-reports")) return;

    const wrapper = document.createElement("details");
    wrapper.className = "sidebar-submenu sidebar-submenu-reports";
    wrapper.open = true;

    const summary = document.createElement("summary");
    summary.innerHTML = '<span class="nav-label"><span>▤</span>Gestão</span><span>⌄</span>';

    const links = document.createElement("div");
    links.className = "sidebar-submenu-links";
    links.innerHTML = `
      <a href="/relatorios">Relatórios gerenciais</a>
      <a href="/financeiro">Financeiro</a>
    `;

    wrapper.appendChild(summary);
    wrapper.appendChild(links);
    sidebarNav.appendChild(wrapper);
  }, []);

  return null;
}
