import type { Metadata } from "next";
import { PartnerPage } from "../components/PartnerPage";

export const metadata: Metadata = {
  title: "JETKIZ для ресторанов — подключение доставки в Щучинске",
  description: "Низкая комиссия, гибкие условия, автоматизация заказов и доставка JETKIZ для ресторанов Щучинска и Бурабайского района.",
};

export default function RestaurantsPage() {
  return <PartnerPage kind="restaurants" />;
}
