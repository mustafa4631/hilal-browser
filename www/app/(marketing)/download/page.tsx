import type { Metadata } from "next";
import DownloadClient from "@/components/sections/DownloadClient";

export const metadata: Metadata = {
  title: "İndir — Hüma Browser",
  description:
    "Hüma Browser'ı Windows, macOS ve Linux için ücretsiz indirin.",
};

export default function DownloadPage() {
  return <DownloadClient />;
}
