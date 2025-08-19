import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: " Moo Beef Steak Prime",
  description: "Where Prime Cuts Meet Perfection",
  icons: "/images/logo/res.png",
};

export default function SignIn() {
  return <SignInForm />;
}
