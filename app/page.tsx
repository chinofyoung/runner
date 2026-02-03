"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard on load
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
          <span className="text-white font-bold text-2xl">Cb</span>
        </div>
        <p className="text-gray-400 animate-pulse">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
