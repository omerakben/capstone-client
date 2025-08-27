"use client";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { useForm } from "react-hook-form";

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  if (!loading && user) {
    redirect("/dashboard");
  }

  const onSubmit = async (data: FormValues) => {
    await signIn(data.email, data.password);
  };

  return (
    <main className="max-w-sm mx-auto mt-16 p-6 card">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border rounded-md px-3 py-2"
            autoComplete="email"
            {...register("email", { required: "Email required" })}
          />
          {errors.email && (
            <p className="field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full border rounded-md px-3 py-2"
            autoComplete="current-password"
            {...register("password", { required: "Password required" })}
          />
          {errors.password && (
            <p className="field-error" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>
        <button
          disabled={isSubmitting}
          className="btn btn-primary w-full"
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </main>
  );
}
