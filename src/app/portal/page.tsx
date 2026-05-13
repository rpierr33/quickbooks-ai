import { redirect } from "next/navigation";

/**
 * Bare /portal has no own UI — the portal is per-client at /portal/[clientId].
 * A staff user landing here should jump to the clients list to pick one.
 * Unauthenticated users hit the middleware first and are sent to /login.
 */
export default function PortalIndexPage() {
  redirect("/clients");
}
