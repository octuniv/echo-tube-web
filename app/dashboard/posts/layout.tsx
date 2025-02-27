export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center my-6">영상 게시판</h1>
      {children}
    </div>
  );
}
