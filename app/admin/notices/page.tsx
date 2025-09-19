// app/admin/notices/page.tsx
import AdminNoticeForm from "@/components/Message/AdminNoticeForm";

export default function NoticePage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📢 공지 메시지 전송</h1>
      <p className="text-gray-600 mb-6">
        이 메시지는 모든 사용자에게 전달됩니다. 수신자 선택은 필요 없습니다.
      </p>
      <AdminNoticeForm />
    </div>
  );
}
