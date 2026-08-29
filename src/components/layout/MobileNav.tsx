"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, X, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationGroup {
  title: string;
  items: Array<{ name: string; href: string; icon: React.ElementType }>;
}

export function MobileNav({ groups }: { groups: NavigationGroup[] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md text-restro-600 hover:bg-restro-100 transition-colors"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-restro-900/40 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-50 w-72 max-w-full bg-surface h-full shadow-dialog flex flex-col p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-restro-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-md bg-brand-500 flex items-center justify-center text-white">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
                <span className="font-extrabold text-base text-restro-900">
                  RESTRO <span className="text-brand-500">OS</span>
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-sm text-restro-400 hover:text-restro-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-6">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-restro-400 mb-2">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-semibold transition-all",
                            isActive
                              ? "bg-brand-50 text-brand-700 font-bold border-l-2 border-brand-500"
                              : "text-restro-600 hover:bg-restro-50 hover:text-restro-900"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              isActive ? "text-brand-600" : "text-restro-400"
                            )}
                          />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
