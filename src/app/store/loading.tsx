import { storeShowsSamples } from "@/lib/store";
import { StoreListingSkeleton } from "./store-listing";

export default function StoreLoading() {
  return (
    <StoreListingSkeleton samples={storeShowsSamples(process.env.VERCEL_ENV)} />
  );
}
