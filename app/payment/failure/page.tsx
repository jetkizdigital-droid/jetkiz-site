import type { Metadata } from "next";
import { PaymentReturnClient } from "../PaymentReturnClient";

export const metadata: Metadata = { title: "Оплата — JETKIZ" };

export default function Page() {
  return <PaymentReturnClient result="failure" />;
}
