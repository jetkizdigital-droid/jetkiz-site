import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title: "Согласие на обработку персональных данных — JETKIZ" };
export default function Page() { return <LegalPage documentKey="consent" />; }
