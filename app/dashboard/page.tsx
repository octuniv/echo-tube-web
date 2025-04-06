import Dashboard from "@/components/dashboard/Dashboard";
import { userStatus } from "@/lib/authState";
import { isValidUser } from "@/lib/util";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const userStatusInfo = await userStatus();

  if (!isValidUser(userStatusInfo)) {
    redirect(`/`);
  }
  return <Dashboard />;
};

export default DashboardPage;
