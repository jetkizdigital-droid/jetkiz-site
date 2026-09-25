import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageShell, SiteFooter, SiteHeader } from "../../../components/SiteChrome";
import {
  getPublicRestaurantBySlug,
  restaurantPublicSlug,
} from "../../../lib/jetkiz-api";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ slug: string }> };

export default async function CheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getPublicRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const publicSlug = restaurantPublicSlug(restaurant);
  const requestedSlug = decodeURIComponent(slug).trim().toLowerCase();
  if (requestedSlug !== publicSlug) {
    redirect(`/restaurants/${publicSlug}/checkout`);
  }

  return (
    <PageShell>
      <SiteHeader current="catalog" />
      <CheckoutClient restaurant={restaurant} />
      <SiteFooter />
    </PageShell>
  );
}
