// STANDALONE: new self-registration is disabled. Redirect any /signup hit to sign-in.
import { redirect } from "next/navigation";

export default function SignupDisabled() {
  redirect("/");
}
