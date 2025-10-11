"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { loginAsDemoUser } from "@/lib/demo";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface FormValues {
  email: string;
  password: string;
  confirmPassword?: string;
}

export default function LoginPage() {
  const {
    user,
    signIn,
    signInWithGoogle,
    signUp,
    loading,
    configError,
    missingEnv,
  } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const methods = useForm<FormValues>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setError,
  } = methods;

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

  const onGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch {
      // Error handling can be added here if needed
      // Currently, Firebase auth errors are handled by the auth context
    }
  };

  const onDemoLogin = async () => {
    try {
      await loginAsDemoUser();
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError("email", {
        message: err.message || "Demo access failed. Please try again.",
      });
    }
  };

  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Configuration Error
            </CardTitle>
            <CardDescription className="text-neutral-600">
              The application is not configured correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive whitespace-pre-line mb-3">
              {configError}
            </p>
            {missingEnv.length > 0 && (
              <ul className="mb-4 list-disc list-inside text-xs">
                {missingEnv.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Add the missing environment variables and reload the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-neutral-600">
            {isSignUp
              ? "Join DEADLINE to manage your development artifacts"
              : "Sign in to access your DEADLINE workspace"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Demo Mode CTA - Primary for recruiters */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 className="font-semibold text-blue-900">
                Try Demo (No Signup Required)
              </h3>
            </div>
            <p className="mb-3 text-sm text-blue-800">
              Experience DEADLINE instantly with pre-populated sample workspaces
              and artifacts. Perfect for recruiters and evaluators.
            </p>
            <Button
              onClick={onDemoLogin}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              type="button"
            >
              {isSubmitting ? "Launching..." : "🎯 Launch Demo"}
            </Button>
            <p className="mt-2 text-xs text-blue-700">
              Demo data is shared and reset daily
            </p>
          </div>

          <div className="mb-4 flex items-center">
            <span className="flex-1 border-t border-dashed" />
            <span className="mx-2 text-xs text-muted-foreground whitespace-nowrap">
              Or sign in with your account
            </span>
            <span className="flex-1 border-t border-dashed" />
          </div>

          <Form {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={methods.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="password"
                rules={{
                  required: "Password is required",
                  ...(isSignUp && {
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }),
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete={
                            isSignUp ? "new-password" : "current-password"
                          }
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 px-3 text-neutral-500 hover:text-neutral-700"
                        >
                          {showPassword ? (
                            // eye-off icon
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.49 1.7-3.03 3.11-4.35" />
                              <path
                                d="M10.58 5.08A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-.
                                32.75-.78 1.47-1.35 2.13"
                              />
                              <path d="M14 14a4 4 0 0 1-5.66-5.66" />
                              <path d="M1 1l22 22" />
                            </svg>
                          ) : (
                            // eye icon
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSignUp && (
                <FormField
                  control={methods.control}
                  name="confirmPassword"
                  rules={{
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === methods.getValues("password") ||
                      "Passwords do not match",
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 px-3 text-neutral-500 hover:text-neutral-700"
                          >
                            {showConfirmPassword ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.64-1.49 1.7-3.03 3.11-4.35" />
                                <path d="M10.58 5.08A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8-.32.75-.78 1.47-1.35 2.13" />
                                <path d="M14 14a4 4 0 0 1-5.66-5.66" />
                                <path d="M1 1l22 22" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full h-10 border border-neutral-300"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Please wait..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="my-6 flex items-center">
            <span className="flex-1 border-t border-dashed" />
            <span className="mx-2 text-xs text-muted-foreground whitespace-nowrap">
              Or continue with
            </span>
            <span className="flex-1 border-t border-dashed" />
          </div>

          <Button
            variant="outline"
            onClick={onGoogleSignIn}
            className="w-full h-10"
            disabled={isSubmitting}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Need an account? Sign up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
