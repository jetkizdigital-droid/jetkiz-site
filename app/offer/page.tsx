import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title: "Публичная оферта JETKIZ" };
export default function Page() { return <LegalPage documentKey="offer" />; }
