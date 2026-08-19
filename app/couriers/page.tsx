import type { Metadata } from "next";
import { PartnerPage } from "../components/PartnerPage";

export const metadata: Metadata = {
  title: "Работа курьером JETKIZ в Щучинске",
  description: "Гибкий график, понятные маршруты и прозрачный заработок для курьеров JETKIZ в Щучинске и Бурабайском районе.",
};

export default function CouriersPage() {
  return <PartnerPage kind="couriers" />;
}
