import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title: "Возврат и отмена заказа — JETKIZ" };
export default function Page() { return <LegalPage documentKey="refund" />; }
