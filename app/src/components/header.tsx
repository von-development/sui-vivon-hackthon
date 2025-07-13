import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useContext, useState, useEffect } from "react";
import { COIN } from "bucket-protocol-sdk";
import { ConnectModal } from "@mysten/dapp-kit";
import ConnectMenu from "./ui/connectMenu";
import "@mysten/dapp-kit/dist/index.css";
import { AppContext } from "@/context/AppContext";
import { Link as LinkIcon, LayoutDashboard, Home, Menu, X, Target } from "lucide-react";
import { useRouter } from "next/router";

// import SlideInMenu from "./slideInMenu";
// import RpcSetting from "./rpcSetting";

const Header = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="fixed top-0 left-0 w-full backdrop-blur-md"
      style={{
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <header className="w-full max-w-360 mx-auto h-20 flex items-center justify-between pt-5 pb-3 px-4 z-50">
        {/* Logo Link */}
        <button
          onClick={() => router.push("/")}
          className="text-xl lg:text-4xl font-extrabold cursor-pointer"
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
            JailbreakGuard
          </span>
        </button>
        
        {/* Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              router.pathname === "/" ? "bg-blue-500/20 text-blue-400" : "text-gray-300 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              router.pathname === "/dashboard" ? "bg-blue-500/20 text-blue-400" : "text-gray-300 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => router.push("/bounties")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              router.pathname === "/bounties" || router.pathname.startsWith("/bounty") ? "bg-blue-500/20 text-blue-400" : "text-gray-300 hover:text-white"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Bounties</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        {/* Connect Button */}
        {walletAddress ? (
          <ConnectMenu walletAddress={walletAddress} suiName={suiName} />
        ) : (
          <ConnectModal
            trigger={
              <button
                className="h-full rounded-[11px] outline-none ring-0 xl:button-animate-105 overflow-hidden p-[1px]"
                disabled={!!walletAddress}
              >
                <div className="h-full px-5 py-4 flex items-center gap-2 rounded-xl bg-white/10">
                  <span className="text-sm">
                    {walletAddress ? "Connected" : "Connect Wallet"}
                  </span>
                  <LinkIcon size={17} className="text-white" />
                </div>
              </button>
            }
          />
        )}
      </header>
      
      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800">
          <div className="max-w-360 mx-auto px-4 py-4 space-y-2">
            <button
              onClick={() => {
                router.push("/");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                router.pathname === "/" ? "bg-blue-500/20 text-blue-400" : "text-gray-300 hover:text-white"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                router.push("/dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                router.pathname === "/dashboard" ? "bg-blue-500/20 text-blue-400" : "text-gray-300 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => {
                router.push("/bounties");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                router.pathname === "/bounties" || router.pathname.startsWith("/bounty") ? "bg-blue-500/20 text-blue-400" : "text-gray-300 hover:text-white"
              }`}
            >
              <Target className="w-5 h-5" />
              <span>Bounties</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
