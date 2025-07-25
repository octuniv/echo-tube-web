"use server";

import { DashboardSummaryDto, DashboardSummaryDtoSchema } from "../definition";
import { BASE_API_URL } from "../util";

export async function FetchDashboardSummary(): Promise<DashboardSummaryDto> {
  // need to control caching later......
  const response = await fetch(`${BASE_API_URL}/dashboard/summary`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    // next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error("Failed to fetch DashboardSummary");
  const rawData = await response.json();

  const result = DashboardSummaryDtoSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Validation failed:", result.error);
    throw new Error("Invalid data format for DashboardSummary");
  }

  return result.data;
}
