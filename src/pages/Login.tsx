import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import useAuthStore from "../store/authStore";
import { getFirstAccessibleRoute } from "../services/permissionService";
import toast from "react-hot-toast";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedId = employeeId.trim();
    if (!trimmedId) {
      toast.error(isSignUp ? "Please choose an Employee ID" : "Please enter your Employee ID");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    if (isSignUp) {
      if (password.length < 4) {
        toast.error("Password must be at least 4 characters long");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setSubmitting(true);
      try {
        const res = await register(trimmedId, password);
        setSubmitting(false);

        if (res && res.success) {
          toast.success(
            res.message || "Account created successfully! Please sign in with your credentials."
          );
          setIsSignUp(false);
          setPassword("");
          setConfirmPassword("");
        } else {
          const errorMsg =
            res && res.message
              ? res.message
              : "Registration failed. Please choose another Employee ID.";
          toast.error(errorMsg);
        }
      } catch (regErr: any) {
        setSubmitting(false);
        console.error("[REGISTRATION-CLIENT] Error:", regErr);
        toast.error("Unable to complete registration. Please try again.");
      }
      return;
    }

    // Standard Login Flow
    setSubmitting(true);
    console.log(`[LOGIN-CLIENT] Submitting authentication for Employee ID: ${trimmedId}`);
    try {
      const res = await login(trimmedId, password);
      setSubmitting(false);

      if (res === true || (typeof res === "object" && res.success)) {
        const loggedUser = useAuthStore.getState().user;
        const targetRoute = getFirstAccessibleRoute(loggedUser);
        console.log(`[LOGIN-CLIENT] Authentication successful for ${loggedUser?.employeeCode || loggedUser?.username}. Redirecting to ${targetRoute}`);
        toast.success(`Welcome back, ${loggedUser?.employeeName || loggedUser?.username || 'User'}!`);
        navigate(targetRoute, { replace: true });
      } else {
        const errorMsg =
          typeof res === "object" && res.message
            ? res.message
            : "Invalid Employee ID or password";
        console.warn(`[LOGIN-CLIENT] Authentication rejected: ${errorMsg}`);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      setSubmitting(false);
      console.error("[LOGIN-CLIENT] Unexpected submission error:", err);
      toast.error(err?.message || "Unable to connect to authentication server. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements - Premium Sky Blue pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-200/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] opacity-[0.03] rotate-12 bg-[radial-gradient(circle,theme(colors.sky.500)_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        {/* Main card - High contrast Sky Blue */}
        <div className="bg-white p-8 sm:px-10 sm:py-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(186,230,253,0.5)] border border-sky-100">

          {/* Header section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-sky-400/20 rounded-3xl blur-2xl group-hover:opacity-40 transition-opacity" />
                <div className="relative h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border-[1px] border-sky-100 mx-auto overflow-hidden">
                  <img
                    src="/botivate-logo.jpg"
                    alt="Botivate Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-sky-900 mb-2 tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-[11px] text-sky-500 font-bold uppercase tracking-[0.3em]">
              {isSignUp ? "Self-Registration Portal" : "Maintenance Intelligence"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee ID field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-sky-800/80 uppercase tracking-widest ml-1">
                {isSignUp ? "Unique Employee ID" : "Employee ID"}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                  <div className="h-10 w-10 flex items-center justify-center text-sky-400 group-focus-within:text-sky-600 transition-colors">
                    <User size={19} strokeWidth={2.5} />
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  onFocus={() => setFocusedField("employeeId")}
                  onBlur={() => setFocusedField(null)}
                  className={`block w-full pl-11 pr-4 py-3 bg-sky-50/50 border rounded-2xl text-sky-900 placeholder-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:bg-white transition-all duration-300 ${
                    focusedField === "employeeId" ? "border-sky-500/50 shadow-sm" : "border-sky-100/80"
                  }`}
                  placeholder={isSignUp ? "e.g. EMP105 or TECH020" : "Enter Employee ID"}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-sky-800/80 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                  <div className="h-10 w-10 flex items-center justify-center text-sky-400 group-focus-within:text-sky-600 transition-colors">
                    <Lock size={19} strokeWidth={2.5} />
                  </div>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`block w-full pl-11 pr-12 py-3 bg-sky-50/50 border rounded-2xl text-sky-900 placeholder-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:bg-white transition-all duration-300 ${
                    focusedField === "password" ? "border-sky-500/50 shadow-sm" : "border-sky-100/80"
                  }`}
                  placeholder={isSignUp ? "Create password (min 4 chars)" : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-sky-300 hover:text-sky-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password field (Only on Sign Up) */}
            {isSignUp && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-[11px] font-bold text-sky-800/80 uppercase tracking-widest ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                    <div className="h-10 w-10 flex items-center justify-center text-sky-400 group-focus-within:text-sky-600 transition-colors">
                      <Lock size={19} strokeWidth={2.5} />
                    </div>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    className={`block w-full pl-11 pr-12 py-3 bg-sky-50/50 border rounded-2xl text-sky-900 placeholder-sky-300 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:bg-white transition-all duration-300 ${
                      focusedField === "confirmPassword" ? "border-sky-500/50 shadow-sm" : "border-sky-100/80"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-sky-300 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 bg-sky-600 hover:bg-sky-500 disabled:opacity-75 disabled:cursor-not-allowed text-white text-sm font-black rounded-2xl shadow-xl shadow-sky-200 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] active:translate-y-0 focus:outline-none tracking-[0.2em] uppercase cursor-pointer"
              >
                {submitting
                  ? isSignUp
                    ? "Creating Account..."
                    : "Signing In..."
                  : isSignUp
                  ? "Create Account"
                  : "Sign In"}
              </button>
            </div>

            {/* Create Account / Sign In Switch Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-sky-700/80 font-medium">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-sky-600 font-bold hover:text-sky-800 hover:underline cursor-pointer transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-sky-600 font-bold hover:text-sky-800 hover:underline cursor-pointer transition-colors"
                    >
                      Create Account / Sign Up
                    </button>
                  </>
                )}
              </p>
            </div>
          </form>

          {/* Divider line & Footer */}
          <div className="mt-8 pt-6 border-t border-sky-100 text-center">
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">
              Powered by <span className="text-sky-600 font-black">Botivate</span>
            </p>
          </div>
        </div>
      </div>
    </div>




  );
};

export default Login;