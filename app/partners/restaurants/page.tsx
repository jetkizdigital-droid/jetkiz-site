import type { Metadata } from "next";
import { PartnerPage } from "../../components/PartnerPage";

export const metadata: Metadata = {
  title: "JETKIZ для ресторанов — подключение доставки в Щучинске",
  description:
    "Низкая комиссия, гибкие условия, автоматизация заказов и доставка JETKIZ для ресторанов Щучинска и Бурабайского района.",
  alternates: { canonical: "/partners/restaurants" },
};

export default function RestaurantPartnersPage() {
  return <PartnerPage kind="restaurants" />;
}
