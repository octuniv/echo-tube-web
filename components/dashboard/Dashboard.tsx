"use client";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 px-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>

      {/* Main Content */}
      {/* <main className="p-6">
            <div className="bg-white shadow-md rounded p-4">
              <h2 className="text-xl font-bold mb-4">Tasks</h2>
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 text-left">ID</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Task</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((task) => (
                    <tr key={task.id}>
                      <td className="border border-gray-200 px-4 py-2">{task.id}</td>
                      <td className="border border-gray-200 px-4 py-2">{task.name}</td>
                      <td className="border border-gray-200 px-4 py-2">{task.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main> */}
    </div>
  );
};

export default Dashboard;
