import type { ProductId } from "./config";
import type { CodePrefix } from "@/lib/server/gen-code";

export type ManualCodeType = "fc27" | "normal" | "mods";

export interface ManualCodeOption {
  prefix: CodePrefix;
  productId: ProductId;
  label: string;
  hint: string;
}

export const MANUAL_CODE_OPTIONS: Record<ManualCodeType, ManualCodeOption> = {
  fc27: {
    prefix: "FC27",
    productId: "fc27-standard",
    label: "FC27-XXXX-XXXX",
    hint: "FC 27 Standard — hiệu lực 24h",
  },
  normal: {
    prefix: "DUNG",
    productId: "fc26-normal",
    label: "DUNG-XXXX-XXXX",
    hint: "FC 26 Standard — hiệu lực 24h",
  },
  mods: {
    prefix: "MODS",
    productId: "fc26-mods",
    label: "MODS-XXXX-XXXX",
    hint: "FC 26 Full Mods — hiệu lực 24h",
  },
};

export function getManualCodeOption(type: unknown): ManualCodeOption | null {
  if (type !== "fc27" && type !== "normal" && type !== "mods") return null;
  return MANUAL_CODE_OPTIONS[type];
}
