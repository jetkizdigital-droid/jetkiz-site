import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title: "Лицензии и разрешения — JETKIZ" };
export default function Page() { return <LegalPage documentKey="licenses" />; }
