import dayjs from 'dayjs'; // Khuyên dùng dayjs cho nhẹ, hoặc dùng Date gốc

/**
 * Tính số ngày làm việc thực tế giữa 2 mốc thời gian
 * @param startDate - Ngày bắt đầu
 * @param endDate - Ngày kết thúc
 * @param dbHolidays - Danh sách các ngày lễ từ database
 * @returns Số ngày làm việc (không bao gồm cuối tuần và ngày lễ)
 */
export const calculateWorkingDays = (startDate: Date, endDate: Date, dbHolidays: Date[]): number => {
  // Khởi tạo biến đếm số ngày làm việc
  let count = 0;
  
  // Chuyển đổi startDate và endDate sang dayjs object để xử lý dễ dàng
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  // Chuyển mảng Date thành mảng String 'YYYY-MM-DD' để so sánh cho dễ
  // Tránh phải so sánh trực tiếp object Date (có thể bị sai do timezone hoặc giờ phút giây)
  const holidayStrings = dbHolidays.map(h => dayjs(h).format('YYYY-MM-DD'));

  // Duyệt qua từng ngày từ startDate đến endDate (bao gồm cả 2 ngày biên)
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    // Lấy thứ trong tuần: 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    const dayOfWeek = current.day();
    
    // Định dạng ngày hiện tại thành string để so sánh với danh sách ngày lễ
    const dateStr = current.format('YYYY-MM-DD');

    // Kiểm tra xem có phải cuối tuần không (Thứ 7 hoặc Chủ nhật)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Kiểm tra xem có phải ngày lễ không
    const isHoliday = holidayStrings.includes(dateStr);

    // Chỉ tính những ngày KHÔNG phải cuối tuần và KHÔNG phải ngày lễ
    if (!isWeekend && !isHoliday) {
      count++;
    }
    
    // Tăng ngày hiện tại lên 1 ngày để tiếp tục vòng lặp
    current = current.add(1, 'day');
  }
  
  // Trả về tổng số ngày làm việc
  return count;
};