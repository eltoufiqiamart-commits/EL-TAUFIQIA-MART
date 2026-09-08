import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getProfile } from "@/lib/auth";
import CustomersClient from "./CustomersClient";

export default async function AdminCustomersPage() {
  const cookieStore = await cookies();
  const profile = await getProfile(cookieStore.get("toufiqia_session")?.value);
  if (!profile || profile.role !== "admin") redirect("/admin/login");
  return <CustomersClient />;
}
