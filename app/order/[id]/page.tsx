import type { Metadata } from "next";
import { PageShell, SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { DemoOrderStatusClient } from "./DemoOrderStatusClient";

export const metadata: Metadata = {
  title: "Статус заказа — JETKIZ",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ id: string }> };

export default async function DemoOrderPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <DemoOrderStatusClient id={decodeURIComponent(id)} />
      <SiteFooter />
    </PageShell>
  );
}
