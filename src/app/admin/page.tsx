import { AdminClient } from "./AdminClient";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Operations",
  description: "Plain Thread operations",
  path: "/admin",
  noIndex: true,
});

export default function AdminPage() {
  return (
    <div className="container-px py-10">
      <h1 className="font-serif text-3xl">Operations</h1>
      <p className="mt-2 text-sm text-secondary">Stock and fulfilment. Not linked from the storefront.</p>
      <div className="mt-8">
        <AdminClient />
      </div>
    </div>
  );
}
