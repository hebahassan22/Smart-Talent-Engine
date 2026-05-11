import axios from "axios";

export async function getDashboardStats(recruiterId) {
  const res = await axios.get("/dashboard/stats", {
    params: { recruiterId },
  });
  return res.data;
}