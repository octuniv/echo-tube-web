import Dashboard from "@/components/dashboard/Dashboard";
import { FetchDashboardSummary } from "@/lib/action/dashboardActions";
import { userStatus } from "@/lib/authState";
import { isValidUser } from "@/lib/util";
import { redirect } from "next/navigation";

const Page = async () => {
  const userStatusInfo = await userStatus();

  if (!isValidUser(userStatusInfo)) {
    redirect(`/login`);
  }

  const dashboardData = await FetchDashboardSummary();

  return <Dashboard user={userStatusInfo} data={dashboardData} />;
};

export default Page;
