-- Generated from the customer workbook. Do not hand-edit scoring rows.
-- Source SHA-256: 8D29B213907C00D5314C5D9B5FD27E4F09019F013B6A2D5A3DADE44361531653

insert into source_document (id, file_name, sha256, received_scope, imported_at) values (
  'source-scorecard-dhcd-2026', '2. (ĐHCĐ) Bảng điểm Chiến dịch TNTN Hè 2026.xlsx',
  '8D29B213907C00D5314C5D9B5FD27E4F09019F013B6A2D5A3DADE44361531653', 'Đại học, Cao đẳng!A1:L40; Điểm thưởng!A1:J30', current_timestamp
);

insert into campaign (id, name, phase, scorecard_version_id, version) values (
  'campaign-summer-2026', 'Chiến dịch Thanh niên tình nguyện Hè 2026',
  'PREPARATION', 'scorecard-dhcd-v1', 0
);

insert into scorecard_version (id, campaign_id, title, audience, status, source_document_id, core_maximum, bonus_raw_maximum, bonus_cap, version) values (
  'scorecard-dhcd-v1', 'campaign-summer-2026', 'Bảng điểm khối Đại học, Cao đẳng',
  'Đoàn các trường Đại học, Cao đẳng trực thuộc Thành đoàn Hải Phòng', 'DRAFT',
  'source-scorecard-dhcd-2026', 83.00, 69.00, 25.00, 0
);

insert into unit_group (code, name, documented_unit_count, source_reference) values ('COMMUNE', 'Xã, phường, đặc khu', 114, 'duananhCuong.pdf');
insert into unit_group (code, name, documented_unit_count, source_reference) values ('UNIVERSITY', 'Đại học, cao đẳng', 16, 'duananhCuong.pdf; workbook ĐHCĐ 2026');
insert into unit_group (code, name, documented_unit_count, source_reference) values ('CIVIL_SERVICE', 'Khối công chức', 2, 'duananhCuong.pdf');
insert into unit_group (code, name, documented_unit_count, source_reference) values ('ARMED_FORCES', 'Khối lực lượng vũ trang', 2, 'duananhCuong.pdf');

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-01', 'scorecard-dhcd-v1', 'I.01', '100% Đoàn các trường Đại học, Cao đẳng có hoạt động trồng mới cây xanh trên địa bàn', 'CORE', 1);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.01-1', 'scorecard-dhcd-v1', 'group-i-01', 'I.01', '100% Đoàn các trường Đại học, Cao đẳng có hoạt động trồng mới cây xanh trên địa bàn', 'Link minh chứng tổ chức hoạt động (khuyến khích đơn vị có maket/standee/băng zon,...)
 - Có hoạt động: 03 điểm
 - Không có hoạt động: 0 điểm', '', '', 'LINK', 3.00, 'Đại học, Cao đẳng', 5, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-02', 'scorecard-dhcd-v1', 'I.02', '100% Đoàn các trường Đại học, Cao đẳng triển khai hiệu quả Phong trào "Bình dân học vụ số"; tham gia hỗ trợ chuyển đổi số tại địa phương (duy trì, thành lập các đội hình "Gia đình số", "Tổ công nghệ số cộng đồng")', 'CORE', 2);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.02-1', 'scorecard-dhcd-v1', 'group-i-02', 'I.02', '100% Đoàn các trường Đại học, Cao đẳng triển khai hiệu quả Phong trào "Bình dân học vụ số"; tham gia hỗ trợ chuyển đổi số tại địa phương (duy trì, thành lập các đội hình "Gia đình số", "Tổ công nghệ số cộng đồng")', 'Link minh chứng tổ chức hoạt động 
 - Có hoạt động: 03 điểm
 - Không có hoạt động: 0 điểm', '', '', 'LINK', 3.00, 'Đại học, Cao đẳng', 6, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-03', 'scorecard-dhcd-v1', 'I.03', '100% Đoàn các trường Đại học, Cao đẳng đồng loạt tổ chức Ngày Chủ nhật xanh vào ngày 26/7', 'CORE', 3);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.03-1', 'scorecard-dhcd-v1', 'group-i-03', 'I.03', '100% Đoàn các trường Đại học, Cao đẳng đồng loạt tổ chức Ngày Chủ nhật xanh vào ngày 26/7', '- Link minh chứng tổ chức đồng loạt Ngày chủ nhật xanh (Yêu cầu link minh chứng thể hiện rõ hình ảnh, nội dung maket hoặc standee rõ ngày tháng): 03 điểm
- Không có hoạt động: 0 điểm', '', '', 'LINK', 3.00, 'Đại học, Cao đẳng', 7, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-04', 'scorecard-dhcd-v1', 'I.04', '100% Đoàn các trường Đại học, Cao đẳng có hồ sơ tham gia Cuộc thi "Ươm mầm khởi nghiệp" năm 2026 do Thành đoàn tổ chức', 'CORE', 4);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.04-1', 'scorecard-dhcd-v1', 'group-i-04', 'I.04', '100% Đoàn các trường Đại học, Cao đẳng có hồ sơ tham gia Cuộc thi "Ươm mầm khởi nghiệp" năm 2026 do Thành đoàn tổ chức', '- Có 03 hồ sơ tham gia: 03 điểm
- Có 02 hồ sơ tham gia: 02 điểm
- Có 01 hồ sơ tham gia: 01 điểm', '', '', 'GUIDED', 3.00, 'Đại học, Cao đẳng', 8, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-05', 'scorecard-dhcd-v1', 'I.05', '100% Đoàn các trường Đại học, Cao đẳng có video/clip giới thiệu mô hình/sản phẩm khởi nghiệp của sinh viên gửi về Tổ Phong trào để đăng tải trên kênh tiktok "Bản tin số Thanh niên Hải Phòng khởi nghiệp"', 'CORE', 5);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.05-1', 'scorecard-dhcd-v1', 'group-i-05', 'I.05', '100% Đoàn các trường Đại học, Cao đẳng có video/clip giới thiệu mô hình/sản phẩm khởi nghiệp của sinh viên gửi về Tổ Phong trào để đăng tải trên kênh tiktok "Bản tin số Thanh niên Hải Phòng khởi nghiệp"', '- Có video/clip: 03 điểm
- Không có video/clip: 0 điểm', '', '', 'GUIDED', 3.00, 'Đại học, Cao đẳng', 9, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-06', 'scorecard-dhcd-v1', 'I.06', 'Có hồ sơ thí sinh tham gia Cuộc thi Nét đẹp thanh lịch Hải Phòng - Năm 2026', 'CORE', 6);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.06-1', 'scorecard-dhcd-v1', 'group-i-06', 'I.06', 'Có hồ sơ thí sinh tham gia Cuộc thi Nét đẹp thanh lịch Hải Phòng - Năm 2026', 'Có hồ sơ tham gia: 03 điểm
Không có hồ sơ: 0 điểm', '', '', 'GUIDED', 3.00, 'Đại học, Cao đẳng', 10, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-07', 'scorecard-dhcd-v1', 'I.07', 'Có thí sinh tham gia Cuộc thi Olympic tiếng Anh dành cho Cán bộ trẻ lần thứ VIII năm 2026 (Các đơn vị thực hiện theo văn bản hướng dẫn của Thành đoàn)', 'CORE', 7);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.07-1', 'scorecard-dhcd-v1', 'group-i-07', 'I.07', 'Có thí sinh tham gia Cuộc thi Olympic tiếng Anh dành cho Cán bộ trẻ lần thứ VIII năm 2026 (Các đơn vị thực hiện theo văn bản hướng dẫn của Thành đoàn)', 'Không yêu cầu đăng tải minh chứng các đơn vị chủ động kiểm tra số lượng trên website Cuộc thi. Các đơn vị thực hiện theo phân bổ của Thành đoàn
- Đạt 100%: 03 điểm
- Đạt 50%: 02 điểm
- Đạt dưới 50% theo số lượng phân bổ: 0 điểm', '', '', 'INTERNAL', 3.00, 'Đại học, Cao đẳng', 11, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-08', 'scorecard-dhcd-v1', 'I.08', 'Trao tặng ít nhất 05 suất học bổng cho học sinh có hoàn cảnh khó khăn chuẩn bị tham gia các kỳ thi vào lớp 10, kỳ thi tốt nghiệp THPT', 'CORE', 8);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.08-1', 'scorecard-dhcd-v1', 'group-i-08', 'I.08', 'Trao tặng ít nhất 05 suất học bổng cho học sinh có hoàn cảnh khó khăn chuẩn bị tham gia các kỳ thi vào lớp 10, kỳ thi tốt nghiệp THPT', 'Link minh chứng tổ chức hoạt động
Có hoạt động: 02 điểm
Không có hoạt động: 0 điểm', '', '', 'LINK', 2.00, 'Đại học, Cao đẳng', 12, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-09', 'scorecard-dhcd-v1', 'I.09', 'Có hoạt động hỗ trợ trước kỳ thi cho học sinh trong Chương trình Tiếp sức mùa thi (Khác nội dung trao học bổng ở trên)', 'CORE', 9);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.09-1', 'scorecard-dhcd-v1', 'group-i-09', 'I.09', 'Có hoạt động hỗ trợ trước kỳ thi cho học sinh trong Chương trình Tiếp sức mùa thi (Khác nội dung trao học bổng ở trên)', 'Link minh chứng
- Có hoạt động 2 điểm
- Không có hoạt động 0 điểm', '', '', 'LINK', 2.00, 'Đại học, Cao đẳng', 13, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-10', 'scorecard-dhcd-v1', 'I.10', 'Triển khai Chiến dịch sinh viên tình nguyện Mùa hè xanh', 'CORE', 10);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.10-1', 'scorecard-dhcd-v1', 'group-i-10', 'I.10', 'Triển khai Chiến dịch sinh viên tình nguyện Mùa hè xanh', 'Link minh chứng từng đội hình
- Tổ chức từ 02 đội hình ở 02 địa phương khác nhau trở lên: 02 điểm
- Tổ chức được 01 đội hình: 01 điểm
- Không triển khai: 0 điểm
- Có đội hình triển khai trước ngày 10/6: +0,5 điểm
- Có hoạt động gắn với kiến thức chuyên môn, kỹ năng chuyên ngành của sinh viên: +01 điểm
- Có hoạt động hỗ trợ thúc đẩy chuyển đổi số toàn dân: +01 điểm
- Địa bàn thực hiện nhiệm vụ của Chiến dịch tại khu vực xây dựng nông thôn mới kiểu mẫu, nông thôn mói nâng cao; vùng đặc biệt khó khăn, biên giới, biển đảo: +02 điểm', '', '', 'LINK', 7.50, 'Đại học, Cao đẳng', 14, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-11', 'scorecard-dhcd-v1', 'I.11', 'Tham gia Cuộc thi "Vietnamese Student HackAIthon 2026" đảm bảo chỉ tiêu phân bổ', 'CORE', 11);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.11-1', 'scorecard-dhcd-v1', 'group-i-11', 'I.11', 'Tham gia Cuộc thi "Vietnamese Student HackAIthon 2026" đảm bảo chỉ tiêu phân bổ', 'Điểm được tính theo tỉ lệ % so với chỉ tiêu phân bổ', '', '', 'GUIDED', 3.00, 'Đại học, Cao đẳng', 15, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-12', 'scorecard-dhcd-v1', 'I.12', '100% cán bộ đoàn, đoàn viên hoàn thành kiểm tra việc nghiên cứu, học tập, quán triệt Nghị quyết Đại hội đại biểu toàn quốc lần thứ XIV của Đảng và Chương trình hành động của Đoàn TNCS Hồ Chí Minh thực hiện Nghị quyết Đại hội XIV của Đảng trên ứng dụng Thanh niên Việt Nam', 'CORE', 12);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.12-1', 'scorecard-dhcd-v1', 'group-i-12', 'I.12', '100% cán bộ đoàn, đoàn viên hoàn thành kiểm tra việc nghiên cứu, học tập, quán triệt Nghị quyết Đại hội đại biểu toàn quốc lần thứ XIV của Đảng và Chương trình hành động của Đoàn TNCS Hồ Chí Minh thực hiện Nghị quyết Đại hội XIV của Đảng trên ứng dụng Thanh niên Việt Nam', 'Không yêu cầu đăng tải minh chứng các đơn vị chủ động kiểm tra số lượng trên phần mềm quản lý đoàn viên
Đạt 100%: 6 điểm;
Từ 80% - dưới 100%: 5 điểm;
Từ 60% - dưới 80%: 4 điểm;
Từ 40% - dưới 60%: 3 điểm;
Từ 10% - dưới 40%: 2 điểm;
Không đạt yêu cầu: 0 điểm', '', '', 'INTERNAL', 6.00, 'Đại học, Cao đẳng', 16, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-13', 'scorecard-dhcd-v1', 'I.13', 'Đơn vị chủ động lựa chọn ít nhất 01 hoạt động trong các nội dung sau:

- Tổ chức hoạt động kỷ niệm 136 năm ngày sinh của Chủ tịch Hồ Chí Minh (19/5/1890 - 19/5/2026)
- Tổ chức hoạt động kỷ niệm 81 năm cách mạng Tháng 8 thành công (19/8/1945 - 19/8/2026) và và Quốc khánh 2/9 (02/9/1945 - 02/9/2026)
- Tổ chức hội nghị học tập, quán triệt Nghị quyết Đại hội Đảng các cấp, Đại hội Đoàn', 'CORE', 13);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.13-1', 'scorecard-dhcd-v1', 'group-i-13', 'I.13', 'Đơn vị chủ động lựa chọn ít nhất 01 hoạt động trong các nội dung sau:

- Tổ chức hoạt động kỷ niệm 136 năm ngày sinh của Chủ tịch Hồ Chí Minh (19/5/1890 - 19/5/2026)
- Tổ chức hoạt động kỷ niệm 81 năm cách mạng Tháng 8 thành công (19/8/1945 - 19/8/2026) và và Quốc khánh 2/9 (02/9/1945 - 02/9/2026)
- Tổ chức hội nghị học tập, quán triệt Nghị quyết Đại hội Đảng các cấp, Đại hội Đoàn', 'Link minh chứng tổ chức hoạt động rõ maket, thời gian tổ chức, là hoạt động của đoàn trường
Có hoạt động: 03 điểm
Không có hoạt động: 0 điểm', '', '', 'LINK', 3.00, 'Đại học, Cao đẳng', 17, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-14', 'scorecard-dhcd-v1', 'I.14', 'Đơn vị chủ động lựa chọn ít nhất 01 hoạt động trong các nội dung sau:
- Tổ chức hoạt động hưởng ứng Ngày hội thanh niên Hải Phòng chung tay đẩy lùi ma tuý năm 2026 (có KH riêng)
- Tổ chức hoạt động tuyên truyền phòng chống ma tuý của CLB Tuổi trẻ phòng chống ma tuý trong nhà trường', 'CORE', 14);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.14-1', 'scorecard-dhcd-v1', 'group-i-14', 'I.14', 'Đơn vị chủ động lựa chọn ít nhất 01 hoạt động trong các nội dung sau:
- Tổ chức hoạt động hưởng ứng Ngày hội thanh niên Hải Phòng chung tay đẩy lùi ma tuý năm 2026 (có KH riêng)
- Tổ chức hoạt động tuyên truyền phòng chống ma tuý của CLB Tuổi trẻ phòng chống ma tuý trong nhà trường', 'Link minh chứng tổ chức hoạt động rõ maket, thời gian tổ chức
Có hoạt động: 4 điểm
Không có hoạt động: 0 điểm', '', '', 'LINK', 4.00, 'Đại học, Cao đẳng', 18, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-15', 'scorecard-dhcd-v1', 'I.15', 'Thực hiện lệnh lan tỏa, chia sẻ trong công tác bảo vệ nền tảng tư tưởng của Đảngh theo chỉ đạo của Thành Đoàn', 'CORE', 15);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.15-1', 'scorecard-dhcd-v1', 'group-i-15', 'I.15', 'Thực hiện lệnh lan tỏa, chia sẻ trong công tác bảo vệ nền tảng tư tưởng của Đảngh theo chỉ đạo của Thành Đoàn', 'Link minh chứng thể hiện việc chia sẻ theo chỉ đạo của Thành đoàn', '', '', 'LINK', 3.00, 'Đại học, Cao đẳng', 19, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-16', 'scorecard-dhcd-v1', 'I.16', 'Tham gia hưởng ứng hoạt động tạo trào lưu, xu hướng tích cực trên không gian mạng do Thành đoàn triển khai', 'CORE', 16);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.16-1', 'scorecard-dhcd-v1', 'group-i-16', 'I.16', 'Tham gia hưởng ứng hoạt động tạo trào lưu, xu hướng tích cực trên không gian mạng do Thành đoàn triển khai', 'Link minh chứng 
Có tham gia hưởng ứng: 03 điểm
Không có hoạt động: 0 điểm', '', '', 'LINK', 3.00, 'Đại học, Cao đẳng', 20, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-17', 'scorecard-dhcd-v1', 'I.17', 'Ban hành Tài liệu Sinh hoạt Chi đoàn tháng 5,6,7,8/2026 do Thành đoàn đăng tải trên Phần mềm Quản lý đoàn viên trong tuần đầu tiên của tháng', 'CORE', 17);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.17-1', 'scorecard-dhcd-v1', 'group-i-17', 'I.17', 'Ban hành Tài liệu Sinh hoạt Chi đoàn tháng 5,6,7,8/2026 do Thành đoàn đăng tải trên Phần mềm Quản lý đoàn viên trong tuần đầu tiên của tháng', 'Không yêu cầu đăng tải minh chứng. Tổ TC-KT theo dõi qua Phần mềm.
- Có ban hành: 01 điểm/01 tháng
- Ban hành muộn/Không ban hành: 0 điểm', '', '', 'INTERNAL', 4.00, 'Đại học, Cao đẳng', 21, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-18', 'scorecard-dhcd-v1', 'I.18', 'Cử đại diện tham gia Hội thi Cán bộ Đoàn giỏi đảm bảo theo Kế hoạch', 'CORE', 18);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.18-1', 'scorecard-dhcd-v1', 'group-i-18', 'I.18', 'Cử đại diện tham gia Hội thi Cán bộ Đoàn giỏi đảm bảo theo Kế hoạch', 'Không yêu cầu minh chứng', '', '', 'INTERNAL', 3.00, 'Đại học, Cao đẳng', 22, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-19', 'scorecard-dhcd-v1', 'I.19', 'Thực hiện việc chuẩn hoá dữ liệu đoàn viên trên Phần mềm Quản lý đoàn viên', 'CORE', 19);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.19-1', 'scorecard-dhcd-v1', 'group-i-19', 'I.19', 'Thực hiện việc chuẩn hoá dữ liệu đoàn viên trên Phần mềm Quản lý đoàn viên', 'Không yêu cầu đăng tải minh chứng. Tổ TC-KT theo dõi qua Phần mềm.', '', '', 'INTERNAL', 4.00, 'Đại học, Cao đẳng', 23, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-20', 'scorecard-dhcd-v1', 'I.20', 'Có danh sách giới thiệu đoàn viên ưu tú cho Đảng xem xét kết nạp', 'CORE', 20);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.20-1', 'scorecard-dhcd-v1', 'group-i-20', 'I.20', 'Có danh sách giới thiệu đoàn viên ưu tú cho Đảng xem xét kết nạp', 'Có danh sách (theo mẫu gửi kèm) gửi về Tổ TC-KT trước ngày 15/8/2026
- Từ 5 - 10: 1 điểm
- Từ 11 - 20: 2 điểm
- Từ 21  trở lên: 3 điểm', '', '', 'DOCUMENT', 3.00, 'Đại học, Cao đẳng', 24, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-21', 'scorecard-dhcd-v1', 'I.21', 'Chế độ thông tin báo cáo theo quy định', 'CORE', 21);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.21-1', 'scorecard-dhcd-v1', 'group-i-21', 'I.21.1', 'Chế độ thông tin báo cáo theo quy định', 'Kế hoạch Chiến dịch TNTN Hè', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 25, 1);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.21-2', 'scorecard-dhcd-v1', 'group-i-21', 'I.21.2', 'Phụ lục số liệu hàng tuần: 05 điểm/tuần', 'Phụ lục số liệu hàng tuần: 05 điểm/tuần', '', '', 'GUIDED', 5.50, 'Đại học, Cao đẳng', 26, 2);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.21-3', 'scorecard-dhcd-v1', 'group-i-21', 'I.21.3', 'Báo cáo kết quả kèm PLSL đợt 1', 'Báo cáo kết quả kèm PLSL đợt 1', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 27, 3);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.21-4', 'scorecard-dhcd-v1', 'group-i-21', 'I.21.4', 'Báo cáo kết quả kèm PLSL đợt 2', 'Báo cáo kết quả kèm PLSL đợt 2', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 28, 4);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.21-5', 'scorecard-dhcd-v1', 'group-i-21', 'I.21.5', 'Báo cáo tổng kết kèm PLSL', 'Báo cáo tổng kết kèm PLSL', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 29, 5);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-i-22', 'scorecard-dhcd-v1', 'I.22', 'Cử cán bộ tham dự đầy đủ hoạt động thành phố triệu tập: tối đa 05 điểm', 'CORE', 22);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.22-1', 'scorecard-dhcd-v1', 'group-i-22', 'I.22.1', 'Cử cán bộ tham dự đầy đủ hoạt động thành phố triệu tập: tối đa 05 điểm', 'Các tổ tính điểm qua theo dõi các nội dung hoạt động', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 30, 1);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.22-2', 'scorecard-dhcd-v1', 'group-i-22', 'I.22.2', 'Phần việc do PT theo dõi', 'Các tổ tính điểm qua theo dõi các nội dung hoạt động', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 31, 2);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.22-3', 'scorecard-dhcd-v1', 'group-i-22', 'I.22.3', 'Phần việc do TG theo dõi', 'Các tổ tính điểm qua theo dõi các nội dung hoạt động', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 32, 3);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.22-4', 'scorecard-dhcd-v1', 'group-i-22', 'I.22.4', 'Phần việc do TCKT theo dõi', 'Các tổ tính điểm qua theo dõi các nội dung hoạt động', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 33, 4);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('I.22-5', 'scorecard-dhcd-v1', 'group-i-22', 'I.22.5', 'Phần việc do VP theo dõi', 'Các tổ tính điểm qua theo dõi các nội dung hoạt động', '', '', 'GUIDED', 1.00, 'Đại học, Cao đẳng', 34, 5);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-ii-1', 'scorecard-dhcd-v1', 'II.1', 'Đăng cai tổ chức hoạt động cấp thành phố
Mỗi đơn vị đăng cai không quá 03 hoạt động cấp thành phố', 'BONUS', 23);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-1', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.1', 'Hoạt động đăng cai 1', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 4, 1);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-2', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.2', 'Hoạt động đăng cai 2', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 5, 2);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-3', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.3', 'Hoạt động đăng cai 3', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 6, 3);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-4', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.4', 'Hoạt động đăng cai 4', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 7, 4);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-5', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.5', 'Hoạt động đăng cai 5', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 8, 5);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-6', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.6', 'Hoạt động đăng cai 6', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 9, 6);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-7', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.7', 'Hoạt động đăng cai 7', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 10, 7);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-8', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.8', 'Hoạt động đăng cai 8', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 11, 8);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-9', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.9', 'Hoạt động đăng cai 9', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 12, 9);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.1-10', 'scorecard-dhcd-v1', 'group-ii-1', 'II.1.10', 'Hoạt động đăng cai 10', '1. Đánh giá của hội đồng TĐKT: tối đa 2 điểm
2. Đánh giá chất lượng tổ chức hoạt động do Tổ chuyên môn theo dõi: tối đa 1 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ về nguồn lực vận động, số lượng đvtn tham gia chương trình:
1. Chương trình ...: kết quả ...
2. Chương trình ...: kết quả ...
3. Chương trình ...: kết quả ...', 'LINK', 3.00, 'Điểm thưởng', 13, 10);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-ii-2', 'scorecard-dhcd-v1', 'II.2', 'Tham gia nguồn lực cấp thành phố trong Chương trình ra quân Chiến dịch Thanh niên tình nguyện hè', 'BONUS', 24);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.2-1', 'scorecard-dhcd-v1', 'group-ii-2', 'II.2', 'Tham gia nguồn lực cấp thành phố trong Chương trình ra quân Chiến dịch Thanh niên tình nguyện hè', 'Tổng điểm không quá 02 điểm', '', 'Liệt kê hoạt động hưởng ứng
1. Chương trình: ... đvtn tham gia
2. Chương trình: ... đvtn tham gia
3. Chương trình: ... đvtn tham gia
4. Chương trình: ... đvtn tham gia
5. Chương trình: ... đvtn tham gia', 'GUIDED', 2.00, 'Điểm thưởng', 14, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-ii-3', 'scorecard-dhcd-v1', 'II.3', 'Tham gia nguồn lực các hoạt động do Thành đoàn tổ chức (không tính hoạt động đã ghi nhận ở mục II.1 và II.2)', 'BONUS', 25);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.3-1', 'scorecard-dhcd-v1', 'group-ii-3', 'II.3', 'Tham gia nguồn lực các hoạt động do Thành đoàn tổ chức (không tính hoạt động đã ghi nhận ở mục II.1 và II.2)', 'Tổng điểm không quá 10 điểm', '', 'Trong Chiến dịch huy động nguồn lực tham gia: ... triệu đồng, ... đvtn tham gia, cụ thể tại các chương trình
1. Chương trình ......: ... triệu đồng, ... đvtn tham gia
2. Chương trình ......: ... triệu đồng, ... đvtn tham gia
3. Chương trình ......: ... triệu đồng, ... đvtn tham gia
4. Chương trình ......: ... triệu đồng, ... đvtn tham gia
5. Chương trình ......: ... triệu đồng, ... đvtn tham gia
6. Chương trình ......: ... triệu đồng, ... đvtn tham gia
7. Chương trình ......: ... triệu đồng, ... đvtn tham gia
8. Chương trình ......: ... triệu đồng, ... đvtn tham gia
9. Chương trình ......: ... triệu đồng, ... đvtn tham gia
10. Chương trình ......: ... triệu đồng, ... đvtn tham gia
...', 'GUIDED', 10.00, 'Điểm thưởng', 15, 1);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-ii-4', 'scorecard-dhcd-v1', 'II.4', 'Hoạt động ngoài nội dung chỉ đạo, vượt chỉ tiêu', 'BONUS', 26);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.4-1', 'scorecard-dhcd-v1', 'group-ii-4', 'II.4.1', 'Tổ chức hoạt động tình nguyện tại các xã khu vực biên giới trong thời gian diễn ra Chiến dịch Thanh niên tình nguyện Hè 2026 đảm bảo nội dung đăng ký của Thành đoàn theo Đề án “Tuổi trẻ Việt Nam đồng hành với thanh thiếu nhi vùng biên giới” giai đoạn 2025 - 2030', 'Link minh chứng', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ', 'LINK', 3.00, 'Điểm thưởng', 17, 1);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.4-2', 'scorecard-dhcd-v1', 'group-ii-4', 'II.4.2', 'Có thí sinh tham gia Chung kết Nét đẹp thanh linh', 'Tổ PT chủ động theo dõi', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ', 'INTERNAL', 2.00, 'Điểm thưởng', 18, 2);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.4-3', 'scorecard-dhcd-v1', 'group-ii-4', 'II.4.3', 'Có thi sinh lọt vào Bán kết và Chung kết Cuộc thi Olympic tiếng Anh dành cho Cán bộ trẻ lần thứ VIII năm 2026', 'Tổ Phong trào chủ động theo dõi 
- Có thi sinh lọt vào vòng Bán kết: 01 điểm
- Có thi sinh lọt vào vòng Chung kết: 02 điểm', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ', 'INTERNAL', 2.00, 'Điểm thưởng', 19, 3);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.4-4', 'scorecard-dhcd-v1', 'group-ii-4', 'II.4.4', 'Tổ chức tặng từ 20 suất quà trở lên cho thiếu nhi có hoàn cảnh khó khăn hoặc học bổng cho học sinh có hoàn cảnh khó khăn chuẩn bị tham gia các kỳ thi vào lớp 10, kỳ thi tốt nghiệp THPT', 'Link minh chứng', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ', 'LINK', 1.00, 'Điểm thưởng', 20, 4);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.4-5', 'scorecard-dhcd-v1', 'group-ii-4', 'II.4.5', 'Triển khai 01 dự án tình nguyện cộng đồng, mang tính chuyên sâu, giải quyết vấn đề cụ thể tại 01 địa phương, nhà trường có tính bền vững, khả năng tự vận hành sau Chiến dịch', 'Link minh chứng', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ', 'LINK', 2.00, 'Điểm thưởng', 21, 5);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.4-6', 'scorecard-dhcd-v1', 'group-ii-4', 'II.4.6', 'Có đảng viên mới được kết nạp từ đoàn viên ưu tú do Đoàn giới thiệu cho Đảng bộ đơn vị.
- Từ 1 - 5: 1 điểm
- Từ 6 - 10: 2 điểm
- Từ 11 trở lên: 3 điểm', 'Văn bản xác nhận số liệu đảng viên mới được kết nạp từ đoàn viên ưu tú, có xác nhận của cấp uỷ đơn vị.', 'Đơn vị điền minh chứng link tổ chức hoạt động', 'Báo cáo tóm tắt kết quả không quá 100 từ', 'DOCUMENT', 3.00, 'Điểm thưởng', 22, 6);

insert into scorecard_group (id, scorecard_version_id, code, title, section, display_order) values ('group-ii-5', 'scorecard-dhcd-v1', 'II.5', 'Có mô hình, hoạt động sáng tạo trong Chiến dịch được Hội đồng TĐKT ghi nhận', 'BONUS', 27);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.5-1', 'scorecard-dhcd-v1', 'group-ii-5', 'II.5.1', 'Mô hình sáng tạo 1', 'Thành phố chỉ ghi nhận hoạt động sáng tạo đối với các nội dung:
- Đã đăng ký từ đầu Chiến dịch theo Kế hoạch của BTV Thành đoàn không quá 05 mô hình
- Các mô hình đăng ký thêm cuối Chiến dịch không quá 02 mô hình
Mỗi mô hình sáng tạo được tối đa 02 điểm. Mô hình được tính điểm phải đảm bảo tiêu chí', 'Đơn vị điền minh chứng link tổ chức hoạt động, nếu là mô hình, hoạt động triển khai thành nhiều chương trình, chuỗi các hoạt động thì phải gửi tin bài tổng hợp chung kết quả thực hiện', 'Mô hình 1: ...
Kết quả', 'LINK', 2.00, 'Điểm thưởng', 24, 1);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.5-2', 'scorecard-dhcd-v1', 'group-ii-5', 'II.5.2', 'Mô hình sáng tạo 2', 'Thành phố chỉ ghi nhận hoạt động sáng tạo đối với các nội dung:
- Đã đăng ký từ đầu Chiến dịch theo Kế hoạch của BTV Thành đoàn không quá 05 mô hình
- Các mô hình đăng ký thêm cuối Chiến dịch không quá 02 mô hình
Mỗi mô hình sáng tạo được tối đa 02 điểm. Mô hình được tính điểm phải đảm bảo tiêu chí', 'Đơn vị điền minh chứng link tổ chức hoạt động, nếu là mô hình, hoạt động triển khai thành nhiều chương trình, chuỗi các hoạt động thì phải gửi tin bài tổng hợp chung kết quả thực hiện', 'Mô hình 2: ...
Kết quả', 'LINK', 2.00, 'Điểm thưởng', 25, 2);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.5-3', 'scorecard-dhcd-v1', 'group-ii-5', 'II.5.3', 'Mô hình sáng tạo 3', 'Thành phố chỉ ghi nhận hoạt động sáng tạo đối với các nội dung:
- Đã đăng ký từ đầu Chiến dịch theo Kế hoạch của BTV Thành đoàn không quá 05 mô hình
- Các mô hình đăng ký thêm cuối Chiến dịch không quá 02 mô hình
Mỗi mô hình sáng tạo được tối đa 02 điểm. Mô hình được tính điểm phải đảm bảo tiêu chí', 'Đơn vị điền minh chứng link tổ chức hoạt động, nếu là mô hình, hoạt động triển khai thành nhiều chương trình, chuỗi các hoạt động thì phải gửi tin bài tổng hợp chung kết quả thực hiện', 'Mô hình 3: ...
Kết quả', 'LINK', 2.00, 'Điểm thưởng', 26, 3);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.5-4', 'scorecard-dhcd-v1', 'group-ii-5', 'II.5.4', 'Mô hình sáng tạo 4', 'Thành phố chỉ ghi nhận hoạt động sáng tạo đối với các nội dung:
- Đã đăng ký từ đầu Chiến dịch theo Kế hoạch của BTV Thành đoàn không quá 05 mô hình
- Các mô hình đăng ký thêm cuối Chiến dịch không quá 02 mô hình
Mỗi mô hình sáng tạo được tối đa 02 điểm. Mô hình được tính điểm phải đảm bảo tiêu chí', 'Đơn vị điền minh chứng link tổ chức hoạt động, nếu là mô hình, hoạt động triển khai thành nhiều chương trình, chuỗi các hoạt động thì phải gửi tin bài tổng hợp chung kết quả thực hiện', 'Mô hình 4: ...
Kết quả', 'LINK', 2.00, 'Điểm thưởng', 27, 4);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.5-5', 'scorecard-dhcd-v1', 'group-ii-5', 'II.5.5', 'Mô hình sáng tạo 5', 'Thành phố chỉ ghi nhận hoạt động sáng tạo đối với các nội dung:
- Đã đăng ký từ đầu Chiến dịch theo Kế hoạch của BTV Thành đoàn không quá 05 mô hình
- Các mô hình đăng ký thêm cuối Chiến dịch không quá 02 mô hình
Mỗi mô hình sáng tạo được tối đa 02 điểm. Mô hình được tính điểm phải đảm bảo tiêu chí', 'Đơn vị điền minh chứng link tổ chức hoạt động, nếu là mô hình, hoạt động triển khai thành nhiều chương trình, chuỗi các hoạt động thì phải gửi tin bài tổng hợp chung kết quả thực hiện', 'Mô hình 5: ...
Kết quả', 'LINK', 2.00, 'Điểm thưởng', 28, 5);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.5-6', 'scorecard-dhcd-v1', 'group-ii-5', 'II.5.6', 'Mô hình sáng tạo 6', 'Thành phố chỉ ghi nhận hoạt động sáng tạo đối với các nội dung:
- Đã đăng ký từ đầu Chiến dịch theo Kế hoạch của BTV Thành đoàn không quá 05 mô hình
- Các mô hình đăng ký thêm cuối Chiến dịch không quá 02 mô hình
Mỗi mô hình sáng tạo được tối đa 02 điểm. Mô hình được tính điểm phải đảm bảo tiêu chí', 'Đơn vị điền minh chứng link tổ chức hoạt động, nếu là mô hình, hoạt động triển khai thành nhiều chương trình, chuỗi các hoạt động thì phải gửi tin bài tổng hợp chung kết quả thực hiện', 'Mô hình 6: ...
Kết quả', 'LINK', 2.00, 'Điểm thưởng', 29, 6);
insert into scorecard_line (id, scorecard_version_id, group_id, code, title, requirement, evidence_hint, report_template, evidence_policy, maximum_score, source_sheet, source_row, display_order) values ('II.5-7', 'scorecard-dhcd-v1', 'group-ii-5', 'II.5.7', 'Mô hình sáng tạo 7', 'Thành phố chỉ ghi nhận hoạt động sáng tạo đối với các nội dung:
- Đã đăng ký từ đầu Chiến dịch theo Kế hoạch của BTV Thành đoàn không quá 05 mô hình
- Các mô hình đăng ký thêm cuối Chiến dịch không quá 02 mô hình
Mỗi mô hình sáng tạo được tối đa 02 điểm. Mô hình được tính điểm phải đảm bảo tiêu chí', 'Đơn vị điền minh chứng link tổ chức hoạt động, nếu là mô hình, hoạt động triển khai thành nhiều chương trình, chuỗi các hoạt động thì phải gửi tin bài tổng hợp chung kết quả thực hiện', 'Mô hình 7: ...
Kết quả', 'LINK', 2.00, 'Điểm thưởng', 30, 7);

