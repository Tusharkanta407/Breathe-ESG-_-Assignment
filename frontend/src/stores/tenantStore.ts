import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isValidTenantId } from "@/lib/tenant-id";

interface TenantState {
  tenantId: string;
  setTenantId: (id: string) => void;
  clearTenantId: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenantId: "",
      setTenantId: (id: string) => {
        if (id && !isValidTenantId(id)) {
          set({ tenantId: "" });
          return;
        }
        set({ tenantId: id });
      },
      clearTenantId: () => set({ tenantId: "" }),
    }),
    {
      name: "breathesg-tenant",
      onRehydrateStorage: () => (state) => {
        if (state && state.tenantId && !isValidTenantId(state.tenantId)) {
          state.tenantId = "";
        }
      },
    },
  ),
);
