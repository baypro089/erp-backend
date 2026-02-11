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

/**
 * Tính số ngày công chuẩn trong một tháng
 * @param month Tháng (1-12)
 * @param year Năm (VD: 2026)
 * @param holidays Danh sách các ngày lễ trong tháng định dạng ['YYYY-MM-DD'] (Optional)
 * @param workOnSaturday Công ty có làm việc thứ 7 không? (Default: false)
 * @returns Số ngày công chuẩn
 */
export const getStandardWorkDays = (
  month: number,
  year: number,
  holidays: string[] = [],
  workOnSaturday: boolean = false,
): number => {
  let workDays = 0;
  
  // Ngày đầu tiên của tháng
  const startDate = new Date(year, month - 1, 1);
  // Ngày cuối cùng của tháng (Truyền 0 vào ngày của tháng tiếp theo sẽ lùi về ngày cuối tháng này)
  const endDate = new Date(year, month, 0); 

  // Lặp qua từng ngày trong tháng
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay(); // 0 là Chủ Nhật, 6 là Thứ Bảy

    // Tránh lỗi Timezone khi dùng toISOString(), ta tự build chuỗi YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

    // Kiểm tra cuối tuần
    let isWeekend = false;
    if (workOnSaturday) {
      isWeekend = dayOfWeek === 0; // Chỉ nghỉ Chủ Nhật
    } else {
      isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Nghỉ cả T7, CN
    }

    // Kiểm tra có trúng ngày lễ không
    const isHoliday = holidays.includes(dateString);

    // Nếu không phải cuối tuần và không phải ngày lễ -> Cộng 1 ngày công
    if (!isWeekend && !isHoliday) {
      workDays++;
    }
  }

  return workDays;
};