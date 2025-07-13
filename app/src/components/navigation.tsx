import { cn } from "@/lib/utils";
import { useContext, useState } from "react";
import { AppContext } from "@/context/AppContext";
import { useRouter } from "next/router";
import { ConnectModal } from "@mysten/dapp-kit";
import ConnectMenu from "./ui/connectMenu";
import "@mysten/dapp-kit/dist/index.css";
import { 
  Home, 
  User, 
  Trophy, 
  Settings, 
  Target, 
  Gamepad2,
  LayoutDashboard,
  Link as LinkIcon,
  ChevronDown,
  Wallet,
  LogOut,
  UserCircle,
  Bot
} from "lucide-react";

const Navigation = () => {
  const { walletAddress, suiName } = useContext(AppContext);
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navigationItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Gamepad2, label: "Challenges", path: "/challenges" },
    { icon: Trophy, label: "Bounties", path: "/bounties" },
    { icon: Bot, label: "AI Helpers", path: "/ai-helpers" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/profile" },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return router.pathname === "/";
    if (path === "/profile") return router.pathname === "/profile" || router.pathname === "/dashboard";
    return router.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-black cursor-pointer"
          >
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              VIVON
            </span>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActivePath(item.path)
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-4">
            {walletAddress ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/90 hover:bg-white/10 transition-all duration-200"
                >
                  <UserCircle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      {suiName || "Profile"}
                    </div>
                    <div className="text-xs text-white/60">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-white/80" />
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {suiName || "Anonymous"}
                          </div>
                          <div className="text-xs text-white/60">
                            {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push("/profile");
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          router.push("/profile");
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          router.push("/settings");
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <ConnectModal
                trigger={
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium text-white hover:from-blue-500 hover:to-purple-500 transition-all duration-200">
                    <LinkIcon className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </button>
                }
              />
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm",
                  isActivePath(item.path)
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 