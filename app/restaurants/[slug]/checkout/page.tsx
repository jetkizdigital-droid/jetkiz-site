import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, SiteFooter, SiteHeader } from "../../../components/SiteChrome";
import { getPublicRestaurantBySlug } from "../../../lib/jetkiz-api";
import { DemoCheckoutClient } from "./DemoCheckoutClient";

export const metadata: Metadata = {
  title: "Оформление самовывоза — JETKIZ",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ slug: string }> };

export default async function CheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) notFound();

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <DemoCheckoutClient restaurant={restaurant} />
      <SiteFooter />
    </PageShell>
  );
}
