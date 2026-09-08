import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CustomersClient from "./CustomersClient";

export default async function AdminCustomersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");
  return <CustomersClient />;
}
