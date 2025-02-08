import { LogoutAction } from "@/lib/actions";
import { MakeFormButton } from "../common";

function LogoutShape() {
  return (
    <button className="text-gray-600 hover:text-blue-500 transition">
      Logout
    </button>
  );
}

function LogoutButton() {
  return <MakeFormButton action={LogoutAction} ButtonShape={LogoutShape} />;
}

export default LogoutButton;
