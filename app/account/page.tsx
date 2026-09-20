import type { Metadata } from "next";
import { PageShell, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { AccountClient } from "./AccountClient";

export const metadata: Metadata = {
  title: "Профиль",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <AccountClient />
      <SiteFooter />
    </PageShell>
  );
}
