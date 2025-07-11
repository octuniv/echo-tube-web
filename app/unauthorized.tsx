import LoginPage from "@/components/login/LoginPage";

export default function Unauthorized() {
  return (
    <main>
      <h1>401 - Unauthorized</h1>
      <p>Please log in to access this page.</p>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoginPage />
      </div>
    </main>
  );
}
