"use client";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { user, signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>();

  if (!loading && user) {
    redirect("/dashboard");
  }

  const onSubmit = async (data: FormValues) => {
    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
      } else {
        await signIn(data.email, data.password);
      }
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      // Handle auth errors
      if (firebaseError.code === "auth/email-already-in-use") {
        setError("email", { message: "Email already in use" });
      } else if (firebaseError.code === "auth/weak-password") {
        setError("password", { message: "Password too weak" });
      } else if (
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password"
      ) {
        setError("email", { message: "Invalid email or password" });
      } else {
        setError("email", {
          message: firebaseError.message || "Authentication failed",
        });
      }
    }
  };

  return (
    <main className="max-w-sm mx-auto mt-16 p-6 card">
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold mb-2">
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>
        <p className="text-sm text-gray-600">
          {isSignUp
            ? "Join DEADLINE to manage your artifacts"
            : "Welcome back to DEADLINE"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="username"
            {...register("email", {
              required: "Email required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
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
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            {...register("password", {
              required: "Password required",
              minLength: isSignUp
                ? {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  }
                : undefined,
            })}
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
          {isSubmitting
            ? "Please wait..."
            : isSignUp
            ? "Create Account"
            : "Sign In"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </main>
  );
}
