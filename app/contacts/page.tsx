import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title: "Контакты JETKIZ" };
export default function Page() { return <LegalPage documentKey="contacts" />; }
