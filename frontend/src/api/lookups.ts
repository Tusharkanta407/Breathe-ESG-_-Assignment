import { apiFetch } from "./client";

export function registerPlant(body: {
  plant_code: string;
  plant_name?: string;
  country_code?: string;
}) {
  return apiFetch<{ id: string; plant_code: string; plant_name: string }>(
    "/lookups/plants/",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
