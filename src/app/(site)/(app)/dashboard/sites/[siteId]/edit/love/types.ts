import type { LoveContent } from "@/templates/lovestory/schema";
import type { LibraryAsset } from "../upload";

export type Edit = (fn: (d: LoveContent) => void) => void;
export type Lib = { siteId: string; library: LibraryAsset[]; onUploaded: () => Promise<void> };
export type PanelProps = { c: LoveContent; edit: Edit; lib: Lib };
