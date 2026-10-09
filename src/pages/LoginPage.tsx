import { useEffect } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Sign in — SPG CargoOS";
    window.scrollTo(0, 0);
    return () => { document.title = "SPG CargoOS — The Operating System for Global Logistics"; };
  }, []);
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
