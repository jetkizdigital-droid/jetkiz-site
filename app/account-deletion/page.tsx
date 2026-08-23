import type { Metadata } from "next";
import { AccountDeletionPage } from "./AccountDeletionPage";

export const metadata: Metadata = {
  title: "Удаление аккаунта JETKIZ",
  description:
    "Удаление аккаунта JETKIZ и связанных персональных данных из приложения или без установленного приложения.",
};

export default function Page() {
  return <AccountDeletionPage />;
}
