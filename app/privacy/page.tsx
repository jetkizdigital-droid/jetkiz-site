import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title: "Политика конфиденциальности JETKIZ" };
export default function Page() { return <LegalPage documentKey="privacy" />; }
