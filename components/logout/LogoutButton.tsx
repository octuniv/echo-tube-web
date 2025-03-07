"use client";
import { LogoutAction } from "@/lib/actions";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/solid";

function LogoutButton() {
  return (
    <button
      className="flex items-center text-red-600 hover:bg-red-50 rounded-full p-2"
      onClick={LogoutAction}
      aria-label="Logout"
    >
      <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
      <span className="ml-2 hidden md:block">Logout</span>
    </button>
  );
}

export default LogoutButton;
