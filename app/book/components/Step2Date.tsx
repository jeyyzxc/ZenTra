import ClientAvailabilityCalendar from '@/components/booking/ClientAvailabilityCalendar';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

export default function Step2Date({ data, updateData }: Props) {
  return (
    <ClientAvailabilityCalendar
      selectedDate={data.date}
      onSelectDate={(date) => updateData({ date })}
    />
  );
}
