export const CAMPAIGN_ID = "campaign-summer-2026-university";

export const unitGroups = [
  { code: "LOCAL", name: "Xã, phường, đặc khu", sortOrder: 1 },
  { code: "UNIVERSITY", name: "Đại học, cao đẳng", sortOrder: 2 },
  { code: "CIVIL", name: "Công nhân viên chức", sortOrder: 3 },
  { code: "ARMED", name: "Lực lượng vũ trang", sortOrder: 4 },
] as const;

const localUnits = [
  "An Hưng", "An Khánh", "An Lão", "An Phú", "An Quang", "An Thành",
  "An Trường", "Bắc Thanh Miện", "Bình Giang", "Cẩm Giang", "Cẩm Giàng",
  "Chấn Hưng", "Chí Minh", "Đại Sơn", "Đường An", "Gia Lộc", "Gia Phúc",
  "Hà Bắc", "Hà Đông", "Hà Nam", "Hà Tây", "Hải Hưng", "Hồng Châu",
  "Hợp Tiến", "Hùng Thắng", "Kẻ Sặt", "Khúc Thừa Dụ", "Kiến Hưng",
  "Kiến Minh", "Kiến Thụy", "Kim Thành", "Lạc Phượng", "Lai Khê",
  "Mao Điền", "Nam An Phụ", "Nam Sách", "Nam Thanh Miện", "Nghi Dương",
  "Nguyễn Bỉnh Khiêm", "Nguyên Giáp", "Nguyễn Lương Bằng", "Ninh Giang",
  "Phú Thái", "Quyết Thắng", "Tân Kỳ", "Thanh Hà", "Thượng Hồng", "Tân An",
  "Tân Minh", "Thái Tân", "Thanh Miện", "Tiên Lãng", "Tiên Minh", "Trần Phú",
  "Trường Tân", "Tuệ Tĩnh", "Tứ Kỳ", "Vĩnh Am", "Vĩnh Bảo", "Vĩnh Hải",
  "Vĩnh Hòa", "Vĩnh Lại", "Vĩnh Thịnh", "Vĩnh Thuận", "Việt Khê", "Yết Kiêu",
  "Ái Quốc", "An Biên", "An Dương", "An Hải", "An Phong", "Bạch Đằng",
  "Bắc An Phụ", "Chí Linh", "Chu Văn An", "Dương Kinh", "Đồ Sơn", "Đông Hải",
  "Gia Viên", "Hải An", "Hải Dương", "Hòa Bình", "Hồng An", "Hồng Bàng",
  "Hưng Đạo", "Kiến An", "Kiến Hải", "Kinh Môn", "Lê Chân", "Lê Đại Hành",
  "Lê Ích Mộc", "Lê Thanh Nghị", "Lưu Kiếm", "Ngô Quyền", "Nam Đồ Sơn",
  "Nam Đồng", "Nam Triệu", "Nguyễn Đại Năng", "Nguyễn Trãi", "Nhị Chiểu",
  "Phạm Sư Mạnh", "Phù Liễn", "Tân Hưng", "Thạch Khôi", "Thành Đông",
  "Thiên Hương", "Trần Hưng Đạo", "Trần Liễu", "Trần Nhân Tông", "Thủy Nguyên",
  "Tứ Minh", "Việt Hòa", "Cát Hải", "Bạch Long Vĩ",
];

const universityUnits = [
  "ĐH Hàng hải Việt Nam", "ĐH Sao Đỏ", "ĐH Hải Phòng", "ĐH Hải Dương",
  "ĐH Y Dược Hải Phòng", "ĐH Kỹ thuật Y tế Hải Dương",
  "ĐH Quản lý và Công nghệ Hải Phòng", "ĐH Thành Đông",
  "CĐ Dược Trung ương Hải Dương", "CĐ Nghề Hải Dương",
  "CĐ Bách Nghệ Hải Phòng", "CĐ GTVT Trung ương II",
  "CĐ Hàng hải và Đường thuỷ I", "CĐ Du lịch và Công thương",
  "CĐ Cơ giới Xây dựng", "CĐ Y tế Hải Phòng",
];

const civilUnits = [
  "Đoàn Uỷ ban nhân dân thành phố",
  "Đoàn Các cơ quan Đảng thành phố",
];

const armedUnits = [
  "Ban Thanh niên Công an thành phố",
  "Đoàn Bộ Chỉ huy Quân sự thành phố",
];

export const units = [
  ...localUnits.map((name) => ({ name, groupCode: "LOCAL" })),
  ...universityUnits.map((name) => ({ name, groupCode: "UNIVERSITY" })),
  ...civilUnits.map((name) => ({ name, groupCode: "CIVIL" })),
  ...armedUnits.map((name) => ({ name, groupCode: "ARMED" })),
].map((unit, index) => ({
  id: `unit-${String(index + 1).padStart(3, "0")}`,
  code: `DV-${String(index + 1).padStart(3, "0")}`,
  ...unit,
}));

type CriterionSeed = {
  code: string;
  section: "CORE" | "BONUS";
  title: string;
  instructions: string;
  teamCode: "PT" | "TH" | "TG" | "TCKT" | "VP";
  maximum: number;
};

export const criteria: CriterionSeed[] = [
  { code: "I.01", section: "CORE", teamCode: "PT", maximum: 3, title: "Có hoạt động trồng mới cây xanh", instructions: "Có hoạt động và link minh chứng: 3 điểm; không có: 0 điểm." },
  { code: "I.02", section: "CORE", teamCode: "PT", maximum: 3, title: "Triển khai hiệu quả phong trào Bình dân học vụ số", instructions: "Có hoạt động hỗ trợ chuyển đổi số tại địa phương: 3 điểm; không có: 0 điểm." },
  { code: "I.03", section: "CORE", teamCode: "PT", maximum: 3, title: "Đồng loạt tổ chức Ngày Chủ nhật xanh 26/7", instructions: "Minh chứng phải thể hiện rõ nội dung và ngày tháng: 3 điểm; không có: 0 điểm." },
  { code: "I.04", section: "CORE", teamCode: "PT", maximum: 3, title: "Có hồ sơ dự thi Ươm mầm khởi nghiệp 2026", instructions: "Ba hồ sơ: 3; hai hồ sơ: 2; một hồ sơ: 1; không có: 0." },
  { code: "I.05", section: "CORE", teamCode: "PT", maximum: 3, title: "Có video giới thiệu mô hình hoặc sản phẩm khởi nghiệp", instructions: "Có video/clip gửi theo yêu cầu: 3 điểm; không có: 0 điểm." },
  { code: "I.06", section: "CORE", teamCode: "PT", maximum: 3, title: "Có hồ sơ dự thi Nét đẹp thanh lịch Hải Phòng 2026", instructions: "Có hồ sơ: 3 điểm; không có: 0 điểm." },
  { code: "I.07", section: "CORE", teamCode: "PT", maximum: 3, title: "Tham gia Olympic tiếng Anh dành cho Cán bộ trẻ", instructions: "Đạt 100% phân bổ: 3; đạt 50%: 2; dưới 50%: 0." },
  { code: "I.08", section: "CORE", teamCode: "TH", maximum: 2, title: "Trao ít nhất 5 suất học bổng cho học sinh khó khăn", instructions: "Có hoạt động và minh chứng: 2 điểm; không có: 0 điểm." },
  { code: "I.09", section: "CORE", teamCode: "TH", maximum: 2, title: "Hỗ trợ học sinh trước kỳ thi trong Tiếp sức mùa thi", instructions: "Hoạt động phải khác nội dung trao học bổng: có 2 điểm; không có 0 điểm." },
  { code: "I.10", section: "CORE", teamCode: "TH", maximum: 7.5, title: "Triển khai Chiến dịch sinh viên tình nguyện Mùa hè xanh", instructions: "Chấm theo số đội hình, thời điểm, chuyên môn, chuyển đổi số và địa bàn; tối đa 7,5 điểm." },
  { code: "I.11", section: "CORE", teamCode: "TH", maximum: 3, title: "Tham gia Vietnamese Student HackAIthon 2026", instructions: "Điểm được tính theo tỷ lệ hoàn thành chỉ tiêu phân bổ." },
  { code: "I.12", section: "CORE", teamCode: "TG", maximum: 6, title: "Hoàn thành học tập Nghị quyết Đại hội XIV của Đảng", instructions: "100%: 6; 80–<100%: 5; 60–<80%: 4; 40–<60%: 3; 10–<40%: 2; không đạt: 0." },
  { code: "I.13", section: "CORE", teamCode: "TG", maximum: 3, title: "Tổ chức ít nhất một hoạt động chính trị trọng điểm", instructions: "Chọn hoạt động kỷ niệm hoặc học tập nghị quyết; minh chứng rõ thời gian và đơn vị tổ chức." },
  { code: "I.14", section: "CORE", teamCode: "TG", maximum: 4, title: "Tổ chức hoạt động phòng, chống ma túy", instructions: "Có hoạt động và minh chứng: 4 điểm; không có: 0 điểm." },
  { code: "I.15", section: "CORE", teamCode: "TG", maximum: 3, title: "Thực hiện lệnh lan tỏa bảo vệ nền tảng tư tưởng của Đảng", instructions: "Minh chứng thể hiện việc chia sẻ theo chỉ đạo của Thành đoàn." },
  { code: "I.16", section: "CORE", teamCode: "TG", maximum: 3, title: "Hưởng ứng trào lưu tích cực trên không gian mạng", instructions: "Có tham gia hưởng ứng: 3 điểm; không có: 0 điểm." },
  { code: "I.17", section: "CORE", teamCode: "TCKT", maximum: 4, title: "Ban hành tài liệu sinh hoạt Chi đoàn tháng 5–8/2026", instructions: "Ban hành đúng hạn: 1 điểm/tháng; muộn hoặc không ban hành: 0." },
  { code: "I.18", section: "CORE", teamCode: "TCKT", maximum: 3, title: "Cử đại diện tham gia Hội thi Cán bộ Đoàn giỏi", instructions: "Tổ chuyên môn đối chiếu kế hoạch triệu tập; không yêu cầu đơn vị tải minh chứng." },
  { code: "I.19", section: "CORE", teamCode: "TCKT", maximum: 4, title: "Chuẩn hoá dữ liệu đoàn viên", instructions: "Tổ chuyên môn theo dõi trên Phần mềm Quản lý đoàn viên." },
  { code: "I.20", section: "CORE", teamCode: "TCKT", maximum: 3, title: "Giới thiệu đoàn viên ưu tú cho Đảng", instructions: "5–10 người: 1; 11–20: 2; từ 21: 3. Danh sách gửi trước 15/8/2026." },
  { code: "I.21.1", section: "CORE", teamCode: "TH", maximum: 1, title: "Ban hành kế hoạch Chiến dịch", instructions: "Nộp kế hoạch Chiến dịch Thanh niên tình nguyện hè." },
  { code: "I.21.2", section: "CORE", teamCode: "TH", maximum: 5.5, title: "Phụ lục số liệu hằng tuần", instructions: "Chấm theo việc gửi phụ lục số liệu đầy đủ, đúng hạn; tối đa 5,5 điểm." },
  { code: "I.21.3", section: "CORE", teamCode: "TH", maximum: 1, title: "Báo cáo kết quả đợt 1", instructions: "Báo cáo kèm phụ lục số liệu đợt 1." },
  { code: "I.21.4", section: "CORE", teamCode: "TH", maximum: 1, title: "Báo cáo kết quả đợt 2", instructions: "Báo cáo kèm phụ lục số liệu đợt 2." },
  { code: "I.21.5", section: "CORE", teamCode: "TH", maximum: 1, title: "Báo cáo tổng kết", instructions: "Báo cáo tổng kết kèm phụ lục số liệu." },
  { code: "I.22.TH", section: "CORE", teamCode: "TH", maximum: 1, title: "Tham dự hoạt động thành phố — Tổ Trường học", instructions: "Tổ chuyên môn theo dõi việc tham dự đầy đủ." },
  { code: "I.22.PT", section: "CORE", teamCode: "PT", maximum: 1, title: "Tham dự hoạt động thành phố — Tổ Phong trào", instructions: "Tổ chuyên môn theo dõi việc tham dự đầy đủ." },
  { code: "I.22.TG", section: "CORE", teamCode: "TG", maximum: 1, title: "Tham dự hoạt động thành phố — Tổ Tuyên giáo", instructions: "Tổ chuyên môn theo dõi việc tham dự đầy đủ." },
  { code: "I.22.TCKT", section: "CORE", teamCode: "TCKT", maximum: 1, title: "Tham dự hoạt động thành phố — Tổ Tổ chức–Kiểm tra", instructions: "Tổ chuyên môn theo dõi việc tham dự đầy đủ." },
  { code: "I.22.VP", section: "CORE", teamCode: "VP", maximum: 1, title: "Tham dự hoạt động thành phố — Tổ Văn phòng", instructions: "Tổ chuyên môn theo dõi việc tham dự đầy đủ." },
  { code: "II.1", section: "BONUS", teamCode: "VP", maximum: 9, title: "Đăng cai tổ chức hoạt động cấp thành phố", instructions: "Tối đa 3 hoạt động, mỗi hoạt động tối đa 3 điểm." },
  { code: "II.2", section: "BONUS", teamCode: "VP", maximum: 2, title: "Tham gia nguồn lực chương trình ra quân cấp thành phố", instructions: "Tổng điểm không quá 2." },
  { code: "II.3", section: "BONUS", teamCode: "VP", maximum: 10, title: "Tham gia nguồn lực các hoạt động do Thành đoàn tổ chức", instructions: "Không tính hoạt động đã ghi nhận ở II.1 và II.2; tối đa 10 điểm." },
  { code: "II.4", section: "BONUS", teamCode: "VP", maximum: 13, title: "Hoạt động ngoài nội dung chỉ đạo hoặc vượt chỉ tiêu", instructions: "Hội đồng ghi nhận theo minh chứng và thang điểm chi tiết; tối đa 13 điểm." },
  { code: "II.5", section: "BONUS", teamCode: "VP", maximum: 14, title: "Mô hình, hoạt động sáng tạo được Hội đồng ghi nhận", instructions: "Mỗi mô hình tối đa 2 điểm, tối đa 7 mô hình; tổng không quá 14 điểm." },
];

export const demoUsers = [
  { id: "user-demo-admin", email: "admin@doan.local", displayName: "Quản trị chiến dịch", role: "SUPER_ADMIN", teamCode: null, unitId: null },
  { id: "user-demo-reviewer-pt", email: "reviewer.pt@doan.local", displayName: "Chuyên viên Tổ Phong trào", role: "REVIEWER", teamCode: "PT", unitId: null },
  { id: "user-demo-reviewer-vp", email: "reviewer.vp@doan.local", displayName: "Chuyên viên Tổ Văn phòng", role: "REVIEWER", teamCode: "VP", unitId: null },
  { id: "user-demo-unit", email: "unit@doan.local", displayName: "ĐH Hàng hải Việt Nam", role: "UNIT", teamCode: null, unitId: "unit-115" },
  { id: "user-demo-auditor", email: "auditor@doan.local", displayName: "Kiểm tra viên", role: "AUDITOR", teamCode: null, unitId: null },
] as const;
