package vn.haiphong.campaign.result.application;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.springframework.stereotype.Component;

@Component
public final class XlsxExportService {
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss XXX");

    public byte[] create(FinalResultGateway.CampaignRow campaign,
                         FinalResultGateway.ResultHeader header,
                         List<FinalResultGateway.UnitSnapshot> units,
                         List<FinalResultGateway.SnapshotLine> lines) {
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
                entry(zip, "[Content_Types].xml", contentTypes());
                entry(zip, "_rels/.rels", rootRelationships());
                entry(zip, "docProps/core.xml", coreProperties(campaign.name()));
                entry(zip, "docProps/app.xml", appProperties());
                entry(zip, "xl/workbook.xml", workbook());
                entry(zip, "xl/_rels/workbook.xml.rels", workbookRelationships());
                entry(zip, "xl/styles.xml", styles());
                entry(zip, "xl/worksheets/sheet1.xml", unitSheet(header, units));
                entry(zip, "xl/worksheets/sheet2.xml", detailSheet(lines));
                entry(zip, "xl/worksheets/sheet3.xml", metadataSheet(campaign, header, units.size(), lines.size()));
            }
            return bytes.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể tạo tệp Excel đối soát.", exception);
        }
    }

    private static String unitSheet(FinalResultGateway.ResultHeader header,
                                    List<FinalResultGateway.UnitSnapshot> units) {
        List<List<Cell>> rows = new ArrayList<>();
        rows.add(List.of(text("KẾT QUẢ ĐỐI SOÁT CHIẾN DỊCH TNTN HÈ 2026", 1)));
        rows.add(List.of(text("Snapshot", 5), text("Phiên " + header.result().resultVersion(), 6),
                text("Trạng thái", 5), text(statusLabel(header.result().status().name()), 6),
                text("Checksum SHA-256", 5), text(header.result().checksum(), 6)));
        rows.add(List.of(text("Người lập", 5), text(header.preparedByName(), 6),
                text("Người duyệt", 5), text(value(header.approvedByName()), 6),
                text("Thời điểm lập", 5), text(time(header.preparedAt()), 6)));
        rows.add(List.of());
        rows.add(headers("STT", "Mã đơn vị", "Đơn vị", "Khối", "Điểm chính tối đa",
                "Điểm chính", "Điểm cộng thô", "Điểm cộng tính", "Tổng điểm", "Tỷ lệ điểm chính"));
        int index = 1;
        for (FinalResultGateway.UnitSnapshot unit : units) {
            rows.add(List.of(
                    number(index++, 3), text(unit.organizationCode(), 0), text(unit.organizationName(), 0),
                    text(unit.unitGroupCode(), 0), number(unit.applicableCoreMaximum(), 3),
                    number(unit.coreScore(), 3), number(unit.bonusRawScore(), 3),
                    number(unit.bonusCappedScore(), 3), number(unit.totalScore(), 3),
                    number(unit.completionRate(), 4)
            ));
        }
        String columns = "<cols>" + col(1, 7) + col(2, 16) + col(3, 42) + col(4, 16) +
                col(5, 18) + col(6, 14) + col(7, 16) + col(8, 16) + col(9, 14) + col(10, 18) + "</cols>";
        return worksheet(rows, columns, "A1:J" + rows.size(), "A5:J" + rows.size(),
                "<mergeCells count=\"1\"><mergeCell ref=\"A1:J1\"/></mergeCells>", 5, 2);
    }

    private static String detailSheet(List<FinalResultGateway.SnapshotLine> lines) {
        List<List<Cell>> rows = new ArrayList<>();
        rows.add(headers(
                "STT", "Mã đơn vị", "Đơn vị", "Khối", "Mã nhóm", "Mã dòng", "Nội dung", "Loại",
                "Điểm tối đa", "Tự chấm", "Điểm V1", "Lý do V1", "Giải trình cuối", "Link bổ sung",
                "Điểm V2", "Lý do V2", "Điểm chốt", "Link minh chứng", "Báo cáo", "Phiên hồ sơ",
                "Cán bộ V1", "Thời điểm V1", "Cán bộ V2", "Thời điểm V2"
        ));
        int index = 1;
        for (FinalResultGateway.SnapshotLine line : lines) {
            rows.add(List.of(
                    number(index++, 3), text(line.organizationCode(), 0), text(line.organizationName(), 0),
                    text(line.unitGroupCode(), 0), text(line.groupCode(), 0), text(line.lineCode(), 0),
                    text(line.lineTitle(), 0), text("CORE".equals(line.section()) ? "Điểm chính" : "Điểm cộng", 0),
                    number(line.maximumScore(), 3), number(line.selfScore(), 3), number(line.roundOneScore(), 3),
                    text(value(line.roundOneReason()), 0), text(value(line.explanationBody()), 0),
                    text(value(line.explanationEvidenceUrl()), 0), number(line.roundTwoScore(), 3),
                    text(value(line.roundTwoReason()), 0), number(line.effectiveScore(), 3),
                    text(line.submissionEvidenceUrl(), 0), text(line.submissionSummary(), 0),
                    number(line.submissionRevision(), 3), text(line.roundOneDecidedByName(), 0),
                    text(time(line.roundOneDecidedAt()), 0), text(line.roundTwoDecidedByName(), 0),
                    text(time(line.roundTwoDecidedAt()), 0)
            ));
        }
        StringBuilder columns = new StringBuilder("<cols>");
        double[] widths = {7,16,34,15,12,12,55,14,13,11,11,34,40,32,11,34,11,34,40,12,24,23,24,23};
        for (int i = 0; i < widths.length; i++) columns.append(col(i + 1, widths[i]));
        columns.append("</cols>");
        return worksheet(rows, columns.toString(), "A1:X" + rows.size(), "A1:X" + rows.size(), "", 1, 6);
    }

    private static String metadataSheet(FinalResultGateway.CampaignRow campaign,
                                        FinalResultGateway.ResultHeader header,
                                        int unitCount, int lineCount) {
        List<List<Cell>> rows = List.of(
                List.of(text("THÔNG TIN SNAPSHOT BẤT BIẾN", 1)),
                List.of(text("Chiến dịch", 5), text(campaign.name(), 6)),
                List.of(text("Mã chiến dịch", 5), text(campaign.id(), 6)),
                List.of(text("Phiên kết quả", 5), number(header.result().resultVersion(), 6)),
                List.of(text("Trạng thái", 5), text(statusLabel(header.result().status().name()), 6)),
                List.of(text("Số đơn vị", 5), number(unitCount, 6)),
                List.of(text("Số dòng đối soát", 5), number(lineCount, 6)),
                List.of(text("Tổng kiểm soát", 5), number(header.result().totalScore(), 6)),
                List.of(text("SHA-256", 5), text(header.result().checksum(), 6)),
                List.of(text("Người lập", 5), text(header.preparedByName(), 6)),
                List.of(text("Lập lúc", 5), text(time(header.preparedAt()), 6)),
                List.of(text("Người duyệt", 5), text(value(header.approvedByName()), 6)),
                List.of(text("Duyệt lúc", 5), text(time(header.approvedAt()), 6)),
                List.of(text("Người công bố", 5), text(value(header.publishedByName()), 6)),
                List.of(text("Công bố lúc", 5), text(time(header.publishedAt()), 6)),
                List.of(text("Nguyên tắc", 5), text("Điểm chốt = điểm vòng 2; điểm cộng được giới hạn theo bảng điểm đã ban hành.", 6))
        );
        return worksheet(rows, "<cols>" + col(1, 24) + col(2, 92) + "</cols>",
                "A1:B" + rows.size(), null,
                "<mergeCells count=\"1\"><mergeCell ref=\"A1:B1\"/></mergeCells>", 1, 0);
    }

    private static String worksheet(List<List<Cell>> rows, String columns, String dimension,
                                    String filter, String merges, int frozenRows, int frozenColumns) {
        StringBuilder xml = new StringBuilder(4096 + rows.size() * 256);
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>")
                .append("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">")
                .append("<dimension ref=\"").append(dimension).append("\"/>")
                .append("<sheetViews><sheetView workbookViewId=\"0\" showGridLines=\"0\">");
        if (frozenRows > 0 || frozenColumns > 0) {
            String topLeft = column(frozenColumns + 1) + (frozenRows + 1);
            xml.append("<pane state=\"frozen\" topLeftCell=\"").append(topLeft).append("\"")
                    .append(" xSplit=\"").append(frozenColumns).append("\"")
                    .append(" ySplit=\"").append(frozenRows).append("\" activePane=\"bottomRight\"/>");
        }
        xml.append("</sheetView></sheetViews><sheetFormatPr defaultRowHeight=\"18\"/>").append(columns)
                .append("<sheetData>");
        for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
            List<Cell> row = rows.get(rowIndex);
            int excelRow = rowIndex + 1;
            xml.append("<row r=\"").append(excelRow).append("\"");
            if (excelRow == 1) xml.append(" ht=\"30\" customHeight=\"1\"");
            xml.append('>');
            for (int columnIndex = 0; columnIndex < row.size(); columnIndex++) {
                Cell cell = row.get(columnIndex);
                String address = column(columnIndex + 1) + excelRow;
                if (cell.number != null) {
                    xml.append("<c r=\"").append(address).append("\" s=\"").append(cell.style)
                            .append("\"><v>").append(cell.number.toPlainString()).append("</v></c>");
                } else {
                    xml.append("<c r=\"").append(address).append("\" t=\"inlineStr\" s=\"")
                            .append(cell.style).append("\"><is><t xml:space=\"preserve\">")
                            .append(escape(cell.text)).append("</t></is></c>");
                }
            }
            xml.append("</row>");
        }
        xml.append("</sheetData>").append(merges);
        if (filter != null) xml.append("<autoFilter ref=\"").append(filter).append("\"/>");
        xml.append("<pageMargins left=\"0.25\" right=\"0.25\" top=\"0.5\" bottom=\"0.5\" header=\"0.2\" footer=\"0.2\"/>")
                .append("</worksheet>");
        return xml.toString();
    }

    private static List<Cell> headers(String... values) {
        List<Cell> cells = new ArrayList<>(values.length);
        for (String value : values) cells.add(text(value, 2));
        return List.copyOf(cells);
    }

    private static Cell text(String value, int style) { return new Cell(value(value), null, style); }
    private static Cell number(Number value, int style) {
        return new Cell(null, value == null ? BigDecimal.ZERO : new BigDecimal(value.toString()), style);
    }
    private static String value(String value) { return value == null ? "" : value; }
    private static String time(OffsetDateTime value) { return value == null ? "" : TIME.format(value); }
    private static String statusLabel(String value) {
        return switch (value) {
            case "PENDING_APPROVAL" -> "Chờ người thứ hai duyệt";
            case "APPROVED" -> "Đã duyệt bốn mắt";
            case "PUBLISHED" -> "Đã công bố";
            default -> value;
        };
    }

    private static String col(int index, double width) {
        return "<col min=\"" + index + "\" max=\"" + index + "\" width=\"" + width + "\" customWidth=\"1\"/>";
    }

    private static String column(int oneBased) {
        StringBuilder value = new StringBuilder();
        int current = oneBased;
        while (current > 0) {
            current--;
            value.insert(0, (char) ('A' + current % 26));
            current /= 26;
        }
        return value.toString();
    }

    private static String escape(String value) {
        StringBuilder safe = new StringBuilder(value.length());
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (character == '\t' || character == '\n' || character == '\r' || character >= 0x20) {
                safe.append(character);
            }
        }
        return safe.toString().replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static void entry(ZipOutputStream zip, String name, String content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private static String contentTypes() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
                "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
                "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
                "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
                "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>" +
                "<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
                "<Override PartName=\"/xl/worksheets/sheet2.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
                "<Override PartName=\"/xl/worksheets/sheet3.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
                "<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>" +
                "<Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>" +
                "</Types>";
    }

    private static String rootRelationships() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
                "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>" +
                "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>" +
                "</Relationships>";
    }

    private static String workbook() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" " +
                "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
                "<bookViews><workbookView/></bookViews><sheets>" +
                "<sheet name=\"Tổng hợp đơn vị\" sheetId=\"1\" r:id=\"rId1\"/>" +
                "<sheet name=\"Đối soát chi tiết\" sheetId=\"2\" r:id=\"rId2\"/>" +
                "<sheet name=\"Thông tin snapshot\" sheetId=\"3\" r:id=\"rId3\"/>" +
                "</sheets></workbook>";
    }

    private static String workbookRelationships() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
                "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
                "<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet2.xml\"/>" +
                "<Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet3.xml\"/>" +
                "<Relationship Id=\"rId4\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
                "</Relationships>";
    }

    private static String styles() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
                "<fonts count=\"3\"><font><sz val=\"10\"/><name val=\"Aptos\"/></font>" +
                "<font><b/><sz val=\"16\"/><color rgb=\"FF172033\"/><name val=\"Aptos Display\"/></font>" +
                "<font><b/><sz val=\"10\"/><color rgb=\"FFFFFFFF\"/><name val=\"Aptos\"/></font></fonts>" +
                "<fills count=\"4\"><fill><patternFill patternType=\"none\"/></fill>" +
                "<fill><patternFill patternType=\"gray125\"/></fill>" +
                "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FF0756C9\"/><bgColor indexed=\"64\"/></patternFill></fill>" +
                "<fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFF3F7FC\"/><bgColor indexed=\"64\"/></patternFill></fill></fills>" +
                "<borders count=\"2\"><border><left/><right/><top/><bottom/><diagonal/></border>" +
                "<border><left/><right/><top/><bottom style=\"thin\"><color rgb=\"FFD8E0EA\"/></bottom><diagonal/></border></borders>" +
                "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
                "<cellXfs count=\"7\">" +
                "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyAlignment=\"1\"><alignment vertical=\"top\" wrapText=\"1\"/></xf>" +
                "<xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment vertical=\"center\"/></xf>" +
                "<xf numFmtId=\"0\" fontId=\"2\" fillId=\"2\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment vertical=\"center\" wrapText=\"1\"/></xf>" +
                "<xf numFmtId=\"2\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"top\"/></xf>" +
                "<xf numFmtId=\"10\" fontId=\"0\" fillId=\"0\" borderId=\"1\" xfId=\"0\" applyNumberFormat=\"1\" applyAlignment=\"1\"><alignment horizontal=\"right\" vertical=\"top\"/></xf>" +
                "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"3\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment vertical=\"center\"/></xf>" +
                "<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyAlignment=\"1\"><alignment vertical=\"center\" wrapText=\"1\"/></xf>" +
                "</cellXfs><cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>" +
                "</styleSheet>";
    }

    private static String coreProperties(String title) {
        String now = OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" " +
                "xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" " +
                "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"><dc:title>" + escape(title) +
                "</dc:title><dc:creator>Hệ thống điều hành chiến dịch Hải Phòng</dc:creator>" +
                "<dcterms:created xsi:type=\"dcterms:W3CDTF\">" + now + "</dcterms:created></cp:coreProperties>";
    }

    private static String appProperties() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                "<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" " +
                "xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">" +
                "<Application>Neko Đoàn</Application></Properties>";
    }

    private record Cell(String text, BigDecimal number, int style) {}
}
