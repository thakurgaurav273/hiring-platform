import { redirect } from "next/navigation";

/** Password changes now live in Settings → Password & security. */
export default function ChangePasswordPage() {
  redirect("/settings?tab=security");
}
