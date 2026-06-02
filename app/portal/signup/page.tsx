// STANDALONE: new self-registration is disabled. Redirect any /portal/signup hit to portal sign-in.
import { redirect } from "next/navigation";

export default function PortalSignupDisabled() {
  redirect("/portal/join");
}
