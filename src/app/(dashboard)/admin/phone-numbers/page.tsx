import { PhoneNumberList } from '@/components/admin/phone-number-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPhoneNumbersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Phone Numbers</h1>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground">Number Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <PhoneNumberList />
        </CardContent>
      </Card>
    </div>
  );
}
