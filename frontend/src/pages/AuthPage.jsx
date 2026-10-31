import React, { useState } from "react";
import { Headphones, LockKeyhole, Mail } from "lucide-react";

import { useAuth } from "../context/AuthContext";


function AuthPage() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const authenticate = isRegistering ? register : login;
      await authenticate({ email, password });
    } catch (requestError) {
      setError(requestError.userMessage || "Unable to authenticate. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <section className="glass-card rounded-[32px] p-8 sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="glow-cyan rounded-2xl border border-cyan/20 bg-cyan/10 p-3 text-cyan">
            <Headphones size={24} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-secondary">Private account</p>
            <h1 className="mt-1 font-syne text-3xl font-bold">
              {isRegistering ? "Create your account" : "Welcome back"}
            </h1>
          </div>
        </div>
        <p className="mb-6 text-secondary">
          Sign in to analyze audio and access only your own saved reports.
        </p>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-primary">
            Email address
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-base/70 px-4">
              <Mail size={17} className="text-secondary" />
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent py-3.5 text-primary outline-none"
                placeholder="you@example.com"
              />
            </span>
          </label>
          <label className="block text-sm font-medium text-primary">
            Password
            <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-base/70 px-4">
              <LockKeyhole size={17} className="text-secondary" />
              <input
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                required
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent py-3.5 text-primary outline-none"
                placeholder="At least 12 characters"
              />
            </span>
          </label>
          {error ? (
            <p role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="glow-cyan w-full rounded-full bg-gradient-to-r from-cyan to-purple px-6 py-3.5 font-semibold text-base transition hover:scale-[1.01] disabled:opacity-50"
          >
            {submitting ? "Please wait..." : isRegistering ? "Create Account" : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-secondary">
          {isRegistering ? "Already have an account?" : "New to ALM?"}{" "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setIsRegistering((current) => !current);
            }}
            className="font-semibold text-cyan hover:underline"
          >
            {isRegistering ? "Sign in" : "Create an account"}
          </button>
        </p>
      </section>
    </div>
  );
}


export default AuthPage;
