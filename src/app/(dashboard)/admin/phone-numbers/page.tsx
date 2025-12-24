import { PhoneNumberList } from '@/components/admin/phone-number-list';

export default function AdminPhoneNumbersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Phone Numbers</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PhoneNumberList />
      </div>
    </div>
  );
}
