import { LabelInput, ErrorText } from "@/components/common";
import {
  AdminUserDetailResponse,
  AdminUserUpdateState,
} from "@/lib/definition/admin/adminUserManagementSchema";
import RoleSelect from "../RoleSelect";

interface PageProps {
  state: AdminUserUpdateState;
  formAction: (payload: FormData) => void;
  userData: AdminUserDetailResponse;
}

export default function AdminUserEditForm({
  state,
  formAction,
  userData,
}: PageProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Edit User: {userData.nickname}
        </h1>

        <form action={formAction} className="space-y-4">
          {/* Name Field */}
          <div>
            <LabelInput
              name="name"
              defaultValue={userData.name}
              className="w-full px-3 py-2 border rounded"
            />
            <ErrorText elemName="name" errors={state.errors?.name} />
          </div>

          {/* Nickname Field */}
          <div>
            <LabelInput
              name="nickname"
              defaultValue={userData.nickname}
              className="w-full px-3 py-2 border rounded"
            />
            <ErrorText elemName="nickname" errors={state.errors?.nickname} />
          </div>

          <RoleSelect value={userData.role} errors={state?.errors?.role} />

          {/* Email Field (Read-only) */}
          <LabelInput
            name="email"
            defaultValue={userData.email}
            readOnly
            className="w-full px-3 py-2 border rounded bg-gray-100 cursor-not-allowed"
          />

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Update User
          </button>

          {/* Error Message */}
          {state.message && (
            <p className="mt-4 text-red-500 text-center">{state.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
