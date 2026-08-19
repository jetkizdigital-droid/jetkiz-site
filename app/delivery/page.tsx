import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title: "Доставка и самовывоз — JETKIZ" };
export default function Page() { return <LegalPage documentKey="delivery" />; }
