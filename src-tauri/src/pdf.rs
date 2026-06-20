use crate::db::Database;
use printpdf::*;
use rusqlite::params;
use std::fs;

const PAGE_W: f32 = 210.0;
const PAGE_H: f32 = 297.0;
const MARGIN: f32 = 15.0;
const CONTENT_W: f32 = PAGE_W - 2.0 * MARGIN;
const PURPLE_R: f32 = 0.42;
const PURPLE_G: f32 = 0.27;
const PURPLE_B: f32 = 0.76;

fn rgb(r: f32, g: f32, b: f32) -> Rgb {
    Rgb {
        r,
        g,
        b,
        icc_profile: None,
    }
}

/// Per-1000-em-unit advance widths for the core Helvetica font (Adobe AFM
/// metrics). Using real metrics instead of a flat "characters * fudge
/// factor" estimate is what keeps right-aligned and centered text (titles,
/// the tagline, totals) from drifting off the page or overlapping other
/// elements — the single biggest source of misaligned-looking PDFs.
fn helvetica_char_width_units(c: char) -> f32 {
    match c {
        ' ' => 278.0,
        '!' => 278.0,
        '"' => 355.0,
        '#' => 556.0,
        '$' => 556.0,
        '%' => 889.0,
        '&' => 667.0,
        '\'' => 191.0,
        '(' => 333.0,
        ')' => 333.0,
        '*' => 389.0,
        '+' => 584.0,
        ',' => 278.0,
        '-' | '\u{2014}' | '\u{2013}' => 333.0,
        '.' => 278.0,
        '/' => 278.0,
        '0'..='9' => 556.0,
        ':' => 278.0,
        ';' => 278.0,
        '<' => 584.0,
        '=' => 584.0,
        '>' => 584.0,
        '?' => 556.0,
        '@' => 1015.0,
        'A' => 667.0,
        'B' => 667.0,
        'C' => 722.0,
        'D' => 722.0,
        'E' => 667.0,
        'F' => 611.0,
        'G' => 778.0,
        'H' => 722.0,
        'I' => 278.0,
        'J' => 500.0,
        'K' => 667.0,
        'L' => 556.0,
        'M' => 833.0,
        'N' => 722.0,
        'O' => 778.0,
        'P' => 667.0,
        'Q' => 778.0,
        'R' => 722.0,
        'S' => 667.0,
        'T' => 611.0,
        'U' => 722.0,
        'V' => 667.0,
        'W' => 944.0,
        'X' => 667.0,
        'Y' => 667.0,
        'Z' => 611.0,
        '[' => 278.0,
        '\\' => 278.0,
        ']' => 278.0,
        '^' => 469.0,
        '_' => 556.0,
        '`' => 333.0,
        'a' => 556.0,
        'b' => 556.0,
        'c' => 500.0,
        'd' => 556.0,
        'e' => 556.0,
        'f' => 278.0,
        'g' => 556.0,
        'h' => 556.0,
        'i' => 222.0,
        'j' => 222.0,
        'k' => 500.0,
        'l' => 222.0,
        'm' => 833.0,
        'n' => 556.0,
        'o' => 556.0,
        'p' => 556.0,
        'q' => 556.0,
        'r' => 333.0,
        's' => 500.0,
        't' => 278.0,
        'u' => 556.0,
        'v' => 500.0,
        'w' => 722.0,
        'x' => 500.0,
        'y' => 500.0,
        'z' => 500.0,
        '{' => 334.0,
        '|' => 260.0,
        '}' => 334.0,
        '~' => 584.0,
        '\u{2018}' | '\u{2019}' => 222.0,
        '\u{201c}' | '\u{201d}' => 333.0,
        _ => 556.0,
    }
}

/// Width of `text` in mm when rendered at `font_size` points. `bold` applies
/// a small widening factor since Helvetica-Bold glyphs run ~4-7% wider than
/// regular Helvetica (close enough for layout purposes — we don't need
/// sub-pixel accuracy, just to stop text overrunning the page edge).
fn text_width_mm(text: &str, font_size: f32, bold: bool) -> f32 {
    let units: f32 = text.chars().map(helvetica_char_width_units).sum();
    let factor = if bold { 1.06 } else { 1.0 };
    units / 1000.0 * font_size * 0.3528 * factor
}

fn calc_y(current_y: f32, offset: f32) -> f32 {
    current_y - offset
}

fn draw_header(ops: &mut Vec<Op>, shop_name: &str, tagline: &str, y: &mut f32) {
    let h = 22.0;
    *y = PAGE_H - MARGIN;

    // Dark header band (matches the shop's black/dark branding, not generic purple)
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.06, 0.06, 0.08)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(0.0).into(),
            Mm(*y - h).into(),
            Mm(PAGE_W).into(),
            Mm(h).into(),
        ),
    });

    // Thin purple accent strip under the header — the one place brand purple
    // carries through, instead of painting the whole bar purple.
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(0.0).into(),
            Mm(*y - h - 1.2).into(),
            Mm(PAGE_W).into(),
            Mm(1.2).into(),
        ),
    });

    // Shop wordmark — left aligned, accent-colored against the dark band
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.96, 0.30, 0.55)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(16.0),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN).into(),
            y: Mm(*y - h / 2.0 - 1.0).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(shop_name.to_string())],
    });
    ops.push(Op::EndTextSection);

    // Tagline — right-aligned, light italic, quoted (matches the printed template)
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.85, 0.85, 0.88)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaOblique),
        size: Pt(7.5),
    });
    let quoted = format!("\"{tagline}\"");
    let tag_w = text_width_mm(&quoted, 7.5, false);
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(PAGE_W - MARGIN - tag_w).into(),
            y: Mm(*y - h / 2.0 - 1.0).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(quoted)],
    });
    ops.push(Op::EndTextSection);

    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    *y = *y - h - 1.2 - 8.0;
}

fn draw_title(ops: &mut Vec<Op>, y: &mut f32) {
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(18.0),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN).into(),
            y: Mm(*y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text("REPAIR INTAKE FORM".to_string())],
    });
    ops.push(Op::EndTextSection);
    *y = calc_y(*y, 10.0);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(MARGIN).into(),
            Mm(*y).into(),
            Mm(CONTENT_W).into(),
            Mm(1.5).into(),
        ),
    });
    *y = calc_y(*y, 6.0);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
}

fn draw_repair_id_card(ops: &mut Vec<Op>, repair_id: &str, received_at: &str, y: &mut f32) {
    let card_h = 16.0;
    let card_y = *y - card_h;
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.95, 0.95, 0.95)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(MARGIN).into(),
            Mm(card_y).into(),
            Mm(CONTENT_W).into(),
            Mm(card_h).into(),
        ),
    });
    ops.push(Op::SetOutlineColor {
        col: Color::Rgb(rgb(0.8, 0.8, 0.8)),
    });
    ops.push(Op::SetOutlineThickness { pt: Pt(0.5) });
    let line_pts = vec![
        LinePoint {
            p: Point {
                x: Mm(MARGIN).into(),
                y: Mm(card_y).into(),
            },
            bezier: false,
        },
        LinePoint {
            p: Point {
                x: Mm(MARGIN + CONTENT_W).into(),
                y: Mm(card_y).into(),
            },
            bezier: false,
        },
        LinePoint {
            p: Point {
                x: Mm(MARGIN + CONTENT_W).into(),
                y: Mm(*y).into(),
            },
            bezier: false,
        },
        LinePoint {
            p: Point {
                x: Mm(MARGIN).into(),
                y: Mm(*y).into(),
            },
            bezier: false,
        },
        LinePoint {
            p: Point {
                x: Mm(MARGIN).into(),
                y: Mm(card_y).into(),
            },
            bezier: false,
        },
    ];
    ops.push(Op::DrawLine {
        line: Line {
            points: line_pts,
            is_closed: false,
        },
    });
    ops.push(Op::SetOutlineThickness { pt: Pt(0.0) });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(12.0),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN + 5.0).into(),
            y: Mm(card_y + 4.0).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(format!("Repair #: {}", repair_id))],
    });
    ops.push(Op::EndTextSection);
    let date_str = &received_at[..10.min(received_at.len())];
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(10.0),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(PAGE_W - MARGIN - 5.0 - 50.0).into(),
            y: Mm(card_y + 4.5).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(format!("Date: {}", date_str))],
    });
    ops.push(Op::EndTextSection);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    *y = card_y - 8.0;
}

fn draw_section_header(ops: &mut Vec<Op>, title: &str, y: &mut f32) {
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(10.0),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN).into(),
            y: Mm(*y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(title.to_string())],
    });
    ops.push(Op::EndTextSection);
    *y = calc_y(*y, 3.5);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(MARGIN).into(),
            Mm(*y).into(),
            Mm(CONTENT_W).into(),
            Mm(0.5).into(),
        ),
    });
    *y = calc_y(*y, 4.5);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
}

fn draw_field(ops: &mut Vec<Op>, label: &str, value: &str, x: f32, y: f32) {
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(7.0),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.4, 0.4, 0.4)),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(x).into(),
            y: Mm(y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(label.to_string())],
    });
    ops.push(Op::EndTextSection);
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(9.0),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(x).into(),
            y: Mm(y - 3.0).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(value.to_string())],
    });
    ops.push(Op::EndTextSection);
}

fn draw_text_block(
    ops: &mut Vec<Op>,
    text: &str,
    x: f32,
    y: f32,
    _max_w: f32,
    font_size: f32,
) -> f32 {
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(font_size),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    let line_h = font_size * 0.3528 * 1.5;
    let mut cur_y = y;
    if text.len() > 80 {
        let words: Vec<&str> = text.split(' ').collect();
        let mut line = String::new();
        for word in words {
            if line.len() + word.len() > 80 {
                ops.push(Op::StartTextSection);
                ops.push(Op::SetTextCursor {
                    pos: Point {
                        x: Mm(x).into(),
                        y: Mm(cur_y).into(),
                    },
                });
                ops.push(Op::ShowText {
                    items: vec![TextItem::Text(line.clone())],
                });
                ops.push(Op::EndTextSection);
                line = word.to_string();
                cur_y -= line_h;
            } else {
                if !line.is_empty() {
                    line.push(' ');
                }
                line.push_str(word);
            }
        }
        if !line.is_empty() {
            ops.push(Op::StartTextSection);
            ops.push(Op::SetTextCursor {
                pos: Point {
                    x: Mm(x).into(),
                    y: Mm(cur_y).into(),
                },
            });
            ops.push(Op::ShowText {
                items: vec![TextItem::Text(line)],
            });
            ops.push(Op::EndTextSection);
            cur_y -= line_h;
        }
    } else {
        ops.push(Op::StartTextSection);
        ops.push(Op::SetTextCursor {
            pos: Point {
                x: Mm(x).into(),
                y: Mm(cur_y).into(),
            },
        });
        ops.push(Op::ShowText {
            items: vec![TextItem::Text(text.to_string())],
        });
        ops.push(Op::EndTextSection);
        cur_y -= line_h;
    }
    cur_y
}

pub(crate) struct RepairPdfData {
    repair_id: String,
    status: String,
    device_type: String,
    device_brand: String,
    device_model: String,
    device_serial: String,
    device_color: String,
    reported_problem: String,
    received_at: String,
    customer_name: String,
    customer_phone: String,
    customer_email: String,
    customer_company: String,
    technician_name: String,
    shop_name: String,
    shop_phone: String,
    has_condition: bool,
    screen: String,
    keyboard: String,
    body: String,
    battery_present: String,
    charger_included: String,
    accessories_included: String,
    accessories_notes: String,
    extra_notes: String,
}

fn collect_repair_data(repair_id: &str, db: &Database) -> Result<RepairPdfData, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let rid = repair_id.to_string();

    let mut stmt = conn.prepare(
        "SELECT r.status, r.device_type, r.brand, r.model, r.serial_number, r.color_desc, r.reported_problem, r.received_at, c.name, c.phone, c.email, c.company_name, t.name as tech_name FROM repairs r JOIN customers c ON r.customer_id = c.id LEFT JOIN technicians t ON r.technician_id = t.id WHERE r.id = ?"
    ).map_err(|e| e.to_string())?;

    let result = stmt
        .query_row(params![rid], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, String>(7)?,
                row.get::<_, String>(8)?,
                row.get::<_, String>(9)?,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, Option<String>>(11)?,
                row.get::<_, Option<String>>(12)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    drop(stmt);

    let (
        status,
        device_type,
        brand,
        model,
        serial,
        color,
        problem,
        received,
        name,
        phone,
        email,
        company,
        tech,
    ) = result;

    let shop_name: String = match conn.query_row(
        "SELECT value FROM shop_settings WHERE key = 'shop_name'",
        [],
        |r| r.get(0),
    ) {
        Ok(v) => v,
        Err(rusqlite::Error::QueryReturnedNoRows) => String::new(),
        Err(e) => return Err(format!("failed to read shop_name: {e}")),
    };

    let shop_phone: String = match conn.query_row(
        "SELECT value FROM shop_settings WHERE key = 'shop_phone'",
        [],
        |r| r.get(0),
    ) {
        Ok(v) => v,
        Err(rusqlite::Error::QueryReturnedNoRows) => String::new(),
        Err(e) => return Err(format!("failed to read shop_phone: {e}")),
    };

    let cond_exists: bool = match conn.query_row(
        "SELECT COUNT(*) FROM repair_condition WHERE repair_id = ?",
        params![rid],
        |r| r.get::<_, i64>(0),
    ) {
        Ok(c) => c > 0,
        Err(e) => return Err(format!("failed to check condition existence: {e}")),
    };

    let mut data = RepairPdfData {
        repair_id: repair_id.to_string(),
        status,
        device_type: device_type.unwrap_or_default(),
        device_brand: brand,
        device_model: model.unwrap_or_default(),
        device_serial: serial.unwrap_or_default(),
        device_color: color.unwrap_or_default(),
        reported_problem: problem,
        received_at: received,
        customer_name: name,
        customer_phone: phone,
        customer_email: email.unwrap_or_default(),
        customer_company: company.unwrap_or_default(),
        technician_name: tech.unwrap_or_default(),
        shop_name,
        shop_phone,
        has_condition: cond_exists,
        screen: String::new(),
        keyboard: String::new(),
        body: String::new(),
        battery_present: String::new(),
        charger_included: String::new(),
        accessories_included: String::new(),
        accessories_notes: String::new(),
        extra_notes: String::new(),
    };

    if cond_exists {
        let mut cstmt = conn.prepare(
            "SELECT screen, keyboard, body, battery_present, charger_included, accessories_included, accessories_notes, extra_notes FROM repair_condition WHERE repair_id = ?"
        ).map_err(|e| e.to_string())?;

        let cond = cstmt
            .query_row(params![rid], |r| {
                Ok((
                    r.get::<_, Option<String>>(0)?,
                    r.get::<_, Option<String>>(1)?,
                    r.get::<_, Option<String>>(2)?,
                    r.get::<_, Option<i64>>(3)?,
                    r.get::<_, Option<i64>>(4)?,
                    r.get::<_, Option<i64>>(5)?,
                    r.get::<_, Option<String>>(6)?,
                    r.get::<_, Option<String>>(7)?,
                ))
            })
            .map_err(|e| format!("failed to read condition for {rid}: {e}"))?;

        if let Some(v) = cond.0 {
            data.screen = v;
        }
        if let Some(v) = cond.1 {
            data.keyboard = v;
        }
        if let Some(v) = cond.2 {
            data.body = v;
        }
        data.battery_present = if cond.3.unwrap_or(0) == 1 {
            "Yes".into()
        } else {
            "No".into()
        };
        data.charger_included = if cond.4.unwrap_or(0) == 1 {
            "Yes".into()
        } else {
            "No".into()
        };
        data.accessories_included = if cond.5.unwrap_or(0) == 1 {
            "Yes".into()
        } else {
            "No".into()
        };
        if let Some(v) = cond.6 {
            data.accessories_notes = v;
        }
        if let Some(v) = cond.7 {
            data.extra_notes = v;
        }
    }

    Ok(data)
}

pub fn generate_pdf(data: &RepairPdfData, output_path: &str) -> Result<(), String> {
    let mut doc = PdfDocument::new(&format!("Repair Intake - {}", data.repair_id));
    let mut ops = Vec::new();
    let mut y = PAGE_H - MARGIN;

    // Header bar
    draw_header(
        &mut ops,
        if data.shop_name.is_empty() {
            "SaraaTEK"
        } else {
            &data.shop_name
        },
        "",
        &mut y,
    );

    // Title
    draw_title(&mut ops, &mut y);

    // Repair ID card
    draw_repair_id_card(&mut ops, &data.repair_id, &data.received_at, &mut y);

    // Customer info section
    draw_section_header(&mut ops, "CUSTOMER INFORMATION", &mut y);
    let cust_fields = [
        ("Name", data.customer_name.as_str(), -1.0),
        ("Phone", data.customer_phone.as_str(), -1.0),
        ("Email", data.customer_email.as_str(), -1.0),
        ("Company", data.customer_company.as_str(), -1.0),
    ];
    for (i, (label, val, _)) in cust_fields.iter().enumerate() {
        let col = if i % 2 == 0 {
            MARGIN
        } else {
            MARGIN + CONTENT_W / 2.0
        };
        draw_field(&mut ops, label, val, col, y);
        if i % 2 == 1 || i == cust_fields.len() - 1 {
            y = calc_y(y, 9.0);
        }
    }
    y = calc_y(y, 2.0);

    // Device info section
    draw_section_header(&mut ops, "DEVICE INFORMATION", &mut y);
    let dev_fields = [
        ("Type", data.device_type.as_str(), -1.0),
        ("Brand", data.device_brand.as_str(), -1.0),
        ("Model", data.device_model.as_str(), -1.0),
        ("Serial", data.device_serial.as_str(), -1.0),
        ("Color", data.device_color.as_str(), -1.0),
    ];
    for (i, (label, val, _)) in dev_fields.iter().enumerate() {
        let col = if i % 2 == 0 {
            MARGIN
        } else {
            MARGIN + CONTENT_W / 2.0
        };
        draw_field(&mut ops, label, val, col, y);
        if i % 2 == 1 || i == dev_fields.len() - 1 {
            y = calc_y(y, 9.0);
        }
    }
    y = calc_y(y, 2.0);

    // Reported problem section
    draw_section_header(&mut ops, "REPORTED PROBLEM", &mut y);
    y = draw_text_block(&mut ops, &data.reported_problem, MARGIN, y, CONTENT_W, 9.0);
    y = calc_y(y, 4.0);

    // Condition section
    if data.has_condition {
        draw_section_header(&mut ops, "PHYSICAL CONDITION", &mut y);
        let cond_fields = [
            ("Screen", data.screen.as_str()),
            ("Keyboard", data.keyboard.as_str()),
            ("Body", data.body.as_str()),
            ("Battery", data.battery_present.as_str()),
            ("Charger", data.charger_included.as_str()),
            ("Accessories", data.accessories_included.as_str()),
        ];
        for (i, (label, val)) in cond_fields.iter().enumerate() {
            let col = if i % 2 == 0 {
                MARGIN
            } else {
                MARGIN + CONTENT_W / 2.0
            };
            draw_field(&mut ops, label, val, col, y);
            if i % 2 == 1 || i == cond_fields.len() - 1 {
                y = calc_y(y, 9.0);
            }
        }
        if !data.accessories_notes.is_empty() {
            y = draw_text_block(
                &mut ops,
                &format!("Accessories Notes: {}", data.accessories_notes),
                MARGIN,
                y,
                CONTENT_W,
                8.0,
            );
        }
        if !data.extra_notes.is_empty() {
            y = draw_text_block(
                &mut ops,
                &format!("Extra Notes: {}", data.extra_notes),
                MARGIN,
                y,
                CONTENT_W,
                8.0,
            );
        }
        y = calc_y(y, 4.0);
    }

    // Shop use only section
    draw_section_header(&mut ops, "SHOP USE ONLY", &mut y);
    let tech_name = if data.technician_name.is_empty() {
        "_________"
    } else {
        &data.technician_name
    };
    let shop_fields = [
        ("Technician", tech_name, -1.0),
        ("Status", data.status.as_str(), -1.0),
    ];
    for (i, (label, val, _)) in shop_fields.iter().enumerate() {
        let col = if i % 2 == 0 {
            MARGIN
        } else {
            MARGIN + CONTENT_W / 2.0
        };
        draw_field(&mut ops, label, val, col, y);
        if i % 2 == 1 || i == shop_fields.len() - 1 {
            y = calc_y(y, 9.0);
        }
    }
    y = calc_y(y, 4.0);

    // Signature lines
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(8.0),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.3, 0.3, 0.3)),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN).into(),
            y: Mm(y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(
            "Customer Signature: ___________________________".to_string(),
        )],
    });
    ops.push(Op::EndTextSection);
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN + CONTENT_W / 2.0).into(),
            y: Mm(y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text("Date: _______________".to_string())],
    });
    ops.push(Op::EndTextSection);
    y = calc_y(y, 8.0);
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN).into(),
            y: Mm(y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(
            "Staff Signature: ______________________________".to_string(),
        )],
    });
    ops.push(Op::EndTextSection);
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN + CONTENT_W / 2.0).into(),
            y: Mm(y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text("Date: _______________".to_string())],
    });
    ops.push(Op::EndTextSection);

    // Footer
    y = 15.0;
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(7.0),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.5, 0.5, 0.5)),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(MARGIN).into(),
            y: Mm(y).into(),
        },
    });
    let footer_text = if !data.shop_phone.is_empty() {
        format!("{} | {} | Page 1 of 1", data.shop_name, data.shop_phone)
    } else {
        format!("{} | Page 1 of 1", data.shop_name)
    };
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(footer_text)],
    });
    ops.push(Op::EndTextSection);

    let page = PdfPage::new(Mm(PAGE_W), Mm(PAGE_H), ops);
    doc.pages.push(page);

    let mut buf = Vec::new();
    let mut warnings = Vec::new();
    serialize_pdf(&doc, &PdfSaveOptions::default(), &mut buf, &mut warnings);
    fs::write(output_path, buf).map_err(|e| e.to_string())?;

    Ok(())
}

pub struct QuotationPdfItem {
    pub description: String,
    pub item_type: String,
    pub device_name: Option<String>,
    pub serial_number: Option<String>,
    pub quantity: i32,
    pub unit_price: f64,
    pub total: f64,
}

pub struct QuotationPdfData {
    pub quotation_id: String,
    pub created_at: String,
    pub valid_until: String,
    pub status: String,
    pub customer_name: String,
    pub customer_phone: String,
    pub customer_email: String,
    pub customer_address: String,
    pub device_type: String,
    pub device_brand: String,
    pub device_model: String,
    pub items: Vec<QuotationPdfItem>,
    pub subtotal: f64,
    pub tax: f64,
    pub grand_total: f64,
    pub shop_name: String,
    pub shop_address: String,
    pub shop_phone: String,
    pub shop_email: String,
    pub shop_whatsapp: String,
    pub shop_facebook: String,
    pub warranty_duration: String,
    pub warranty_expiry: String,
}

fn draw_item_table(ops: &mut Vec<Op>, items: &[QuotationPdfItem], y: &mut f32) -> f32 {
    let col_desc_x = MARGIN + 2.0;
    let col_price_x = MARGIN + 108.0;
    let col_qty_x = MARGIN + 140.0;
    let col_total_x = MARGIN + 160.0;
    let row_h = 7.0;
    let header_h = 8.0;

    let header_y = *y;

    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(MARGIN).into(),
            Mm(header_y - header_h).into(),
            Mm(CONTENT_W).into(),
            Mm(header_h).into(),
        ),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(1.0, 1.0, 1.0)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(7.0),
    });
    let headers = ["DESCRIPTION", "PRICE", "QTY", "TOTAL"];
    let hx = [col_desc_x, col_price_x, col_qty_x, col_total_x];
    for (i, h) in headers.iter().enumerate() {
        ops.push(Op::StartTextSection);
        ops.push(Op::SetTextCursor {
            pos: Point {
                x: Mm(hx[i]).into(),
                y: Mm(header_y - header_h + 2.0).into(),
            },
        });
        ops.push(Op::ShowText {
            items: vec![TextItem::Text(h.to_string())],
        });
        ops.push(Op::EndTextSection);
    }
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    let mut row_y = header_y - header_h - 2.0;

    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(7.0),
    });
    for (i, item) in items.iter().enumerate() {
        let device_line = item.device_name.is_some() || item.serial_number.is_some();
        let item_row_h = if device_line { row_h + 4.0 } else { row_h };

        if i % 2 == 0 {
            ops.push(Op::SetFillColor {
                col: Color::Rgb(rgb(0.97, 0.97, 0.97)),
            });
            ops.push(Op::DrawRectangle {
                rectangle: Rect::from_xywh(
                    Mm(MARGIN).into(),
                    Mm(row_y - item_row_h).into(),
                    Mm(CONTENT_W).into(),
                    Mm(item_row_h).into(),
                ),
            });
        }
        ops.push(Op::SetFillColor {
            col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
        });
        let type_tag = if item.item_type == "labour" {
            "[L]"
        } else {
            "[P]"
        };
        // Char-safe truncation (the description may contain multi-byte
        // UTF-8 characters, so slicing by byte index can panic).
        let desc: String = if item.description.chars().count() > 38 {
            let truncated: String = item.description.chars().take(36).collect();
            format!("{truncated}..")
        } else {
            item.description.clone()
        };
        ops.push(Op::SetFont {
            font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
            size: Pt(7.5),
        });
        ops.push(Op::StartTextSection);
        ops.push(Op::SetTextCursor {
            pos: Point {
                x: Mm(col_desc_x).into(),
                y: Mm(row_y - item_row_h + 2.0).into(),
            },
        });
        ops.push(Op::ShowText {
            items: vec![TextItem::Text(format!("{} {}", type_tag, desc))],
        });
        ops.push(Op::EndTextSection);

        if device_line {
            ops.push(Op::SetFont {
                font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
                size: Pt(6.0),
            });
            ops.push(Op::SetFillColor {
                col: Color::Rgb(rgb(0.4, 0.4, 0.4)),
            });
            let mut sub = String::new();
            if let Some(dn) = &item.device_name {
                sub.push_str(dn);
            }
            if let Some(sn) = &item.serial_number {
                if !sub.is_empty() {
                    sub.push_str(" | ");
                }
                sub.push_str(&format!("S/N: {}", sn));
            }
            ops.push(Op::StartTextSection);
            ops.push(Op::SetTextCursor {
                pos: Point {
                    x: Mm(col_desc_x + 4.0).into(),
                    y: Mm(row_y - item_row_h + 7.0).into(),
                },
            });
            ops.push(Op::ShowText {
                items: vec![TextItem::Text(sub)],
            });
            ops.push(Op::EndTextSection);
            ops.push(Op::SetFillColor {
                col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
            });
        }
        let vals = [
            format!("{:.2}", item.unit_price),
            item.quantity.to_string(),
            format!("{:.2}", item.total),
        ];
        let vx = [col_price_x, col_qty_x, col_total_x];
        ops.push(Op::SetFont {
            font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
            size: Pt(7.5),
        });
        for (j, val) in vals.iter().enumerate() {
            ops.push(Op::StartTextSection);
            ops.push(Op::SetTextCursor {
                pos: Point {
                    x: Mm(vx[j]).into(),
                    y: Mm(row_y - item_row_h + 2.0).into(),
                },
            });
            ops.push(Op::ShowText {
                items: vec![TextItem::Text(val.to_string())],
            });
            ops.push(Op::EndTextSection);
        }
        row_y -= item_row_h;
    }

    row_y - 2.0
}

fn draw_summary_box(ops: &mut Vec<Op>, subtotal: f64, tax: f64, grand_total: f64, y: f32) -> f32 {
    let box_x = MARGIN + CONTENT_W - 60.0;
    let box_w = 60.0;
    let line_h = 6.0;
    let mut cur_y = y;

    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(8.0),
    });

    let rows = [
        ("Subtotal", format!("{:.2}", subtotal)),
        ("Tax", format!("{:.2}", tax)),
    ];
    for (label, val) in &rows {
        ops.push(Op::SetFillColor {
            col: Color::Rgb(rgb(0.3, 0.3, 0.3)),
        });
        ops.push(Op::StartTextSection);
        ops.push(Op::SetTextCursor {
            pos: Point {
                x: Mm(box_x).into(),
                y: Mm(cur_y).into(),
            },
        });
        ops.push(Op::ShowText {
            items: vec![TextItem::Text(label.to_string())],
        });
        ops.push(Op::EndTextSection);
        ops.push(Op::StartTextSection);
        ops.push(Op::SetTextCursor {
            pos: Point {
                x: Mm(box_x + box_w - 5.0).into(),
                y: Mm(cur_y).into(),
            },
        });
        ops.push(Op::ShowText {
            items: vec![TextItem::Text(val.to_string())],
        });
        ops.push(Op::EndTextSection);
        cur_y -= line_h;
    }

    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(box_x).into(),
            Mm(cur_y - line_h).into(),
            Mm(box_w).into(),
            Mm(line_h).into(),
        ),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(1.0, 1.0, 1.0)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(9.0),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(box_x).into(),
            y: Mm(cur_y - line_h + 1.5).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text("Grand Total".to_string())],
    });
    ops.push(Op::EndTextSection);
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(box_x + box_w - 5.0).into(),
            y: Mm(cur_y - line_h + 1.5).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(format!("{:.2}", grand_total))],
    });
    ops.push(Op::EndTextSection);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });

    cur_y - line_h - 6.0
}

fn draw_right_text(ops: &mut Vec<Op>, text: &str, font_size: f32, y: f32, bold: bool) {
    let est_w = text_width_mm(text, font_size, bold);
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(PAGE_W - MARGIN - est_w).into(),
            y: Mm(y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(text.to_string())],
    });
    ops.push(Op::EndTextSection);
}

fn draw_bank_details(ops: &mut Vec<Op>, x: f32, y: f32) -> f32 {
    let lines = [
        "Payment via Commercial Bank",
        "Account Name: N.G.C.N Ariyarathna",
        "Account Number: 811701159B",
        "Branch: Pitakotte",
    ];
    let line_h = 3.8;
    let mut cur_y = y;
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(8.0),
    });
    draw_label(ops, "PAYMENT DETAILS", x, cur_y);
    cur_y -= line_h + 1.0;
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(7.5),
    });
    for line in &lines {
        ops.push(Op::StartTextSection);
        ops.push(Op::SetTextCursor {
            pos: Point {
                x: Mm(x).into(),
                y: Mm(cur_y).into(),
            },
        });
        ops.push(Op::ShowText {
            items: vec![TextItem::Text(line.to_string())],
        });
        ops.push(Op::EndTextSection);
        cur_y -= line_h;
    }
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    cur_y
}

fn draw_label(ops: &mut Vec<Op>, text: &str, x: f32, y: f32) {
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm(x).into(),
            y: Mm(y).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(text.to_string())],
    });
    ops.push(Op::EndTextSection);
}

/// Greedy word-wrap: splits `text` into lines that each fit within
/// `max_width_mm` at the given font size, using real glyph widths so
/// paragraphs (like the terms & conditions block) wrap cleanly instead of
/// overflowing the page edge.
fn wrap_text(text: &str, font_size: f32, bold: bool, max_width_mm: f32) -> Vec<String> {
    let mut lines = Vec::new();
    let mut current = String::new();
    for word in text.split_whitespace() {
        let candidate = if current.is_empty() {
            word.to_string()
        } else {
            format!("{current} {word}")
        };
        if text_width_mm(&candidate, font_size, bold) <= max_width_mm || current.is_empty() {
            current = candidate;
        } else {
            lines.push(current);
            current = word.to_string();
        }
    }
    if !current.is_empty() {
        lines.push(current);
    }
    lines
}

fn draw_terms_and_conditions(ops: &mut Vec<Op>, start_y: f32) -> f32 {
    let mut y = start_y;
    draw_section_header(ops, "TERMS & CONDITIONS", &mut y);
    let terms = [
        "60% advance payment is required before work begins.",
        "Warranty period is one year less 15 working days (1 yr = 350 days, 2 yr = 700 days, 3 yr = 1050 days).",
        "Warranty covers manufacturer's defects only. Damage from negligence, misuse, improper operation, power fluctuation, lightning, other natural disasters, sabotage, or accident is not covered.",
        "No warranty on: keyboard, mouse, speakers, power adapters, toners, ink cartridges, printer heads.",
        "No warranty applies if there are burn marks, physical damage, or corrosion on the item.",
        "Goods once sold are not returnable under any circumstances.",
    ];
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(7.5),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.2, 0.2, 0.2)),
    });
    let line_h = 3.6;
    let bullet_indent = 4.0;
    for term in &terms {
        let wrapped = wrap_text(term, 7.5, false, CONTENT_W - bullet_indent);
        for (i, line) in wrapped.iter().enumerate() {
            let prefix = if i == 0 { "•  " } else { "   " };
            ops.push(Op::StartTextSection);
            ops.push(Op::SetTextCursor {
                pos: Point {
                    x: Mm(MARGIN).into(),
                    y: Mm(y).into(),
                },
            });
            ops.push(Op::ShowText {
                items: vec![TextItem::Text(format!("{prefix}{line}"))],
            });
            ops.push(Op::EndTextSection);
            y -= line_h;
        }
    }

    // Bold warranty-claim summary line, matching the printed template
    y -= 1.5;
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(7.5),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    let claim = "WARRANTY CLAIM ONE YEAR LESS 17 DAYS. NO WARRANTY FOR CHIP BURNS OR PHYSICAL DAMAGE. PLEASE PRODUCE THE INVOICE FOR WARRANTY CLAIMS.";
    for line in wrap_text(claim, 7.5, true, CONTENT_W) {
        let line_w = text_width_mm(&line, 7.5, true);
        ops.push(Op::StartTextSection);
        ops.push(Op::SetTextCursor {
            pos: Point {
                x: Mm(MARGIN + (CONTENT_W - line_w) / 2.0).into(),
                y: Mm(y).into(),
            },
        });
        ops.push(Op::ShowText {
            items: vec![TextItem::Text(line)],
        });
        ops.push(Op::EndTextSection);
        y -= line_h;
    }

    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    y - 4.0
}

fn draw_signatures(ops: &mut Vec<Op>, start_y: f32) -> f32 {
    let y = start_y;
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(8.0),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.3, 0.3, 0.3)),
    });
    draw_label(ops, "SaraaTEK - Authorised Signature", MARGIN, y);
    draw_label(ops, "Customer Signature", MARGIN + CONTENT_W / 2.0, y);
    let line_y = y - 3.0;
    ops.push(Op::SetOutlineColor {
        col: Color::Rgb(rgb(0.6, 0.6, 0.6)),
    });
    ops.push(Op::SetOutlineThickness { pt: Pt(0.5) });
    let ll = vec![
        LinePoint {
            p: Point {
                x: Mm(MARGIN).into(),
                y: Mm(line_y).into(),
            },
            bezier: false,
        },
        LinePoint {
            p: Point {
                x: Mm(MARGIN + 55.0).into(),
                y: Mm(line_y).into(),
            },
            bezier: false,
        },
    ];
    ops.push(Op::DrawLine {
        line: Line {
            points: ll,
            is_closed: false,
        },
    });
    let rl = vec![
        LinePoint {
            p: Point {
                x: Mm(MARGIN + CONTENT_W / 2.0).into(),
                y: Mm(line_y).into(),
            },
            bezier: false,
        },
        LinePoint {
            p: Point {
                x: Mm(MARGIN + CONTENT_W / 2.0 + 55.0).into(),
                y: Mm(line_y).into(),
            },
            bezier: false,
        },
    ];
    ops.push(Op::DrawLine {
        line: Line {
            points: rl,
            is_closed: false,
        },
    });
    ops.push(Op::SetOutlineThickness { pt: Pt(0.0) });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    y - 10.0
}

fn generate_document_pdf(
    data: &QuotationPdfData,
    output_path: &str,
    doc_title: &str,
) -> Result<(), String> {
    let mut doc = PdfDocument::new(&format!("{} - {}", doc_title, data.quotation_id));
    let mut ops = Vec::new();
    let mut y = PAGE_H - MARGIN;

    draw_header(
        &mut ops,
        if data.shop_name.is_empty() {
            "SaraaTEK"
        } else {
            &data.shop_name
        },
        "YOUR DEAD DEVICE HAS A SECOND LIFE",
        &mut y,
    );

    // Document title — right-aligned
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
        size: Pt(18.0),
    });
    draw_right_text(&mut ops, doc_title, 18.0, y, true);
    y = calc_y(y, 10.0);

    // Repair ID — right-aligned below title
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.3, 0.3, 0.3)),
    });
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(9.0),
    });
    draw_right_text(
        &mut ops,
        &format!("Repair #: {}", data.quotation_id),
        9.0,
        y,
        false,
    );
    y = calc_y(y, 3.0);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });

    // Purple divider line
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(MARGIN).into(),
            Mm(y).into(),
            Mm(CONTENT_W).into(),
            Mm(1.5).into(),
        ),
    });
    y = calc_y(y, 6.0);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });

    // Top info block: date + shop contact info (left column)
    let date_str = &data.created_at[..10.min(data.created_at.len())];
    let left_pairs: [(&str, &str); 4] = [
        ("Date", date_str),
        ("Address", &data.shop_address),
        ("Email", &data.shop_email),
        ("Phone", &data.shop_phone),
    ];
    let info_top = y;
    let left_x = MARGIN;
    for (label, val) in &left_pairs {
        ops.push(Op::SetFont {
            font: PdfFontHandle::Builtin(BuiltinFont::HelveticaBold),
            size: Pt(7.0),
        });
        ops.push(Op::SetFillColor {
            col: Color::Rgb(rgb(0.4, 0.4, 0.4)),
        });
        draw_label(&mut ops, label, left_x, y);
        ops.push(Op::SetFillColor {
            col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
        });
        ops.push(Op::SetFont {
            font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
            size: Pt(8.0),
        });
        draw_label(&mut ops, val, left_x, y - 3.0);
        y = calc_y(y, 8.0);
    }

    // Bank details (right column) — start at same Y as left column
    draw_bank_details(&mut ops, MARGIN + CONTENT_W / 2.0 + 5.0, info_top);

    // Reset y after info block
    y = calc_y(y, 4.0);

    // CUSTOMER section
    draw_section_header(&mut ops, "CUSTOMER", &mut y);
    let cust_line = format!(
        "{} | {} | {}",
        data.customer_name, data.customer_phone, data.customer_address
    );
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(9.0),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });
    draw_label(&mut ops, &cust_line, MARGIN, y);
    y = calc_y(y, 8.0);

    // DEVICE section
    draw_section_header(&mut ops, "DEVICE", &mut y);
    draw_field(
        &mut ops,
        "Brand/Model",
        &format!("{} {}", data.device_brand, data.device_model),
        MARGIN,
        y,
    );
    if !data.device_type.is_empty() {
        draw_field(
            &mut ops,
            "Type",
            &data.device_type,
            MARGIN + CONTENT_W / 2.0,
            y,
        );
    }
    y = calc_y(y, 9.0);

    // ITEMS table
    draw_section_header(&mut ops, "ITEMS", &mut y);
    y = draw_item_table(&mut ops, &data.items, &mut y);
    y = calc_y(y, 4.0);

    // Summary box
    let after_summary = draw_summary_box(&mut ops, data.subtotal, data.tax, data.grand_total, y);

    // Warranty info (invoice only) — drawn between summary and terms
    let tc_y = if after_summary > 100.0 {
        after_summary
    } else {
        100.0
    };

    if !data.warranty_duration.is_empty() && doc_title == "INVOICE" {
        let mut wy = if after_summary > 60.0 {
            after_summary
        } else {
            60.0
        };
        wy = calc_y(wy, 2.0);
        draw_section_header(&mut ops, "WARRANTY", &mut wy);
        ops.push(Op::SetFont {
            font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
            size: Pt(8.0),
        });
        ops.push(Op::SetFillColor {
            col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
        });
        let warranty_text = format!(
            "Warranty: {}  |  Expires: {}",
            data.warranty_duration, data.warranty_expiry
        );
        draw_label(&mut ops, &warranty_text, MARGIN, wy);
        y = tc_y - 10.0;
    } else {
        y = tc_y;
    }
    y = draw_terms_and_conditions(&mut ops, y);

    // Signatures
    let _ = draw_signatures(&mut ops, y);

    // Footer — dark band mirroring the header, two centered contact rows
    let footer_h = 16.0;
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(PURPLE_R, PURPLE_G, PURPLE_B)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(0.0).into(),
            Mm(footer_h).into(),
            Mm(PAGE_W).into(),
            Mm(1.2).into(),
        ),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.06, 0.06, 0.08)),
    });
    ops.push(Op::DrawRectangle {
        rectangle: Rect::from_xywh(
            Mm(0.0).into(),
            Mm(0.0).into(),
            Mm(PAGE_W).into(),
            Mm(footer_h).into(),
        ),
    });

    let mut row1: Vec<&str> = Vec::new();
    if !data.shop_phone.is_empty() {
        row1.push(&data.shop_phone);
    }
    if !data.shop_email.is_empty() {
        row1.push(&data.shop_email);
    }
    if !data.shop_whatsapp.is_empty() {
        row1.push(&data.shop_whatsapp);
    }
    let mut row2: Vec<&str> = Vec::new();
    if !data.shop_address.is_empty() {
        row2.push(&data.shop_address);
    }
    if !data.shop_facebook.is_empty() {
        row2.push(&data.shop_facebook);
    }

    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(7.5),
    });
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.92, 0.92, 0.94)),
    });
    let row1_text = row1.join("   |   ");
    let row1_w = text_width_mm(&row1_text, 7.5, false);
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm((PAGE_W - row1_w) / 2.0).into(),
            y: Mm(9.5).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(row1_text)],
    });
    ops.push(Op::EndTextSection);

    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.65, 0.65, 0.7)),
    });
    let row2_text = row2.join("   |   ");
    let row2_w = text_width_mm(&row2_text, 7.0, false);
    ops.push(Op::SetFont {
        font: PdfFontHandle::Builtin(BuiltinFont::Helvetica),
        size: Pt(7.0),
    });
    ops.push(Op::StartTextSection);
    ops.push(Op::SetTextCursor {
        pos: Point {
            x: Mm((PAGE_W - row2_w) / 2.0).into(),
            y: Mm(4.5).into(),
        },
    });
    ops.push(Op::ShowText {
        items: vec![TextItem::Text(row2_text)],
    });
    ops.push(Op::EndTextSection);
    ops.push(Op::SetFillColor {
        col: Color::Rgb(rgb(0.0, 0.0, 0.0)),
    });

    let page = PdfPage::new(Mm(PAGE_W), Mm(PAGE_H), ops);
    doc.pages.push(page);

    let mut buf = Vec::new();
    let mut warnings = Vec::new();
    serialize_pdf(&doc, &PdfSaveOptions::default(), &mut buf, &mut warnings);
    fs::write(output_path, buf).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn generate_quotation_pdf(data: &QuotationPdfData, output_path: &str) -> Result<(), String> {
    generate_document_pdf(data, output_path, "QUOTATION")
}

pub fn generate_invoice_pdf(data: &QuotationPdfData, output_path: &str) -> Result<(), String> {
    generate_document_pdf(data, output_path, "INVOICE")
}

fn resolve_output_dir(
    db: &Database,
    app: &tauri::AppHandle,
    save_as: bool,
) -> Result<String, String> {
    let pdf_output_dir: String = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT value FROM shop_settings WHERE key = 'pdf_output_dir'",
            [],
            |r| r.get(0),
        )
        .unwrap_or_default()
    };

    let output_dir = if save_as || pdf_output_dir.is_empty() {
        use tauri_plugin_dialog::DialogExt;
        let path = app
            .dialog()
            .file()
            .set_title("Choose PDF output folder")
            .blocking_pick_folder();
        match path {
            Some(p) => {
                let dir = p
                    .as_path()
                    .and_then(|path| path.to_str())
                    .ok_or_else(|| "Invalid PDF output path — not valid UTF-8".to_string())?
                    .to_string();
                let conn = db.conn.lock().map_err(|e| e.to_string())?;
                conn.execute(
                    "INSERT OR REPLACE INTO shop_settings (key, value) VALUES ('pdf_output_dir', ?)",
                    params![dir],
                ).map_err(|e| e.to_string())?;
                dir
            }
            None => return Err("Save cancelled".to_string()),
        }
    } else {
        pdf_output_dir
    };

    fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
    Ok(output_dir)
}

#[tauri::command]
pub fn generate_intake_pdf(
    repair_id: String,
    save_as: bool,
    db: tauri::State<Database>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let data = collect_repair_data(&repair_id, db.inner())?;
    let output_dir = resolve_output_dir(db.inner(), &app, save_as)?;

    let safe_id = repair_id.replace('/', "-");
    let customer_path = format!("{}/{}_customer.pdf", output_dir, safe_id);
    let shop_path = format!("{}/{}_shop.pdf", output_dir, safe_id);

    generate_pdf(&data, &customer_path)?;
    generate_pdf(&data, &shop_path)?;

    Ok(format!("{}\n{}", customer_path, shop_path))
}

fn build_quotation_pdf_data(
    repair_id: &str,
    db: &Database,
    is_invoice: bool,
) -> Result<QuotationPdfData, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let (
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        device_type,
        device_brand,
        device_model,
    ): (
        String,
        String,
        Option<String>,
        Option<String>,
        Option<String>,
        String,
        Option<String>,
    ) = conn
        .query_row(
            "SELECT c.name, c.phone, c.email, c.address, r.device_type, r.brand, r.model
             FROM repairs r JOIN customers c ON r.customer_id = c.id WHERE r.id = ?",
            rusqlite::params![repair_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, Option<String>>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, Option<String>>(6)?,
                ))
            },
        )
        .map_err(|e| e.to_string())?;

    let shop_name: String = conn
        .query_row("SELECT COALESCE((SELECT value FROM shop_settings WHERE key = 'shop_name'), 'SaraaTEK')", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let shop_address: String = conn
        .query_row(
            "SELECT COALESCE((SELECT value FROM shop_settings WHERE key = 'shop_address'), '')",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let shop_phone: String = conn
        .query_row(
            "SELECT COALESCE((SELECT value FROM shop_settings WHERE key = 'shop_phone'), '')",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let shop_email: String = conn
        .query_row(
            "SELECT COALESCE((SELECT value FROM shop_settings WHERE key = 'shop_email'), '')",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let shop_whatsapp: String = conn
        .query_row(
            "SELECT COALESCE((SELECT value FROM shop_settings WHERE key = 'shop_whatsapp'), '')",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let shop_facebook: String = conn
        .query_row(
            "SELECT COALESCE((SELECT value FROM shop_settings WHERE key = 'shop_facebook'), '')",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let doctype = if is_invoice { "invoice" } else { "quotation" };
    let mut stmt = conn
        .prepare(
            "SELECT description, item_type, device_name, serial_number, qty, unit_price
             FROM quotation_items WHERE repair_id = ? AND document_type = ? ORDER BY sort_order",
        )
        .map_err(|e| e.to_string())?;

    let items_iter = stmt
        .query_map(rusqlite::params![repair_id, doctype], |row| {
            Ok(QuotationPdfItem {
                description: row.get(0)?,
                item_type: row.get(1)?,
                device_name: row.get(2)?,
                serial_number: row.get(3)?,
                quantity: row.get(4)?,
                unit_price: row.get(5)?,
                total: row.get::<_, f64>(4)? * row.get::<_, f64>(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items: Vec<QuotationPdfItem> = Vec::new();
    for item in items_iter {
        items.push(item.map_err(|e| e.to_string())?);
    }

    let subtotal: f64 = items.iter().map(|i| i.total).sum();
    let tax = subtotal * 0.0;
    let grand_total = subtotal + tax;

    drop(stmt);

    let id_str = repair_id.to_string();
    let now_str = chrono::Local::now().format("%Y-%m-%d").to_string();
    let valid_str = (chrono::Local::now() + chrono::Duration::days(30))
        .format("%Y-%m-%d")
        .to_string();

    let (warranty_duration, warranty_expiry) = if is_invoice {
        match conn.query_row(
            "SELECT duration_label, expiry_date FROM warranties WHERE repair_id = ?",
            rusqlite::params![repair_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        ) {
            Ok((d, e)) => (d, e),
            Err(_) => (String::new(), String::new()),
        }
    } else {
        (String::new(), String::new())
    };

    drop(conn);

    Ok(QuotationPdfData {
        quotation_id: id_str,
        created_at: now_str.clone(),
        valid_until: valid_str,
        status: String::new(),
        customer_name,
        customer_phone,
        customer_email: customer_email.unwrap_or_default(),
        customer_address: customer_address.unwrap_or_default(),
        device_type: device_type.unwrap_or_default(),
        device_brand,
        device_model: device_model.unwrap_or_default(),
        items,
        subtotal,
        tax,
        grand_total,
        shop_name,
        shop_address,
        shop_phone,
        shop_email,
        shop_whatsapp,
        shop_facebook,
        warranty_duration,
        warranty_expiry,
    })
}

/// Opens an arbitrary file with the OS-associated default application.
/// Used so "View Quotation" / "View Invoice" actually opens the PDF that
/// was just generated, instead of leaving the technician to dig through
/// the output folder manually.
#[tauri::command]
pub fn open_file_path(path: String) -> Result<(), String> {
    if !std::path::Path::new(&path).exists() {
        return Err(format!("File not found: {path}"));
    }
    std::process::Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn generate_quotation_pdf_file(
    repair_id: String,
    save_as: bool,
    db: tauri::State<Database>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let data = build_quotation_pdf_data(&repair_id, db.inner(), false)?;
    let output_dir = resolve_output_dir(db.inner(), &app, save_as)?;

    let safe_id = repair_id.replace('/', "-");
    let customer_path = format!("{}/QUO_{}_customer.pdf", output_dir, safe_id);
    let shop_path = format!("{}/QUO_{}_shop.pdf", output_dir, safe_id);

    generate_quotation_pdf(&data, &customer_path)?;
    generate_quotation_pdf(&data, &shop_path)?;

    Ok(format!("{}\n{}", customer_path, shop_path))
}

#[tauri::command]
pub fn generate_invoice_pdf_file(
    repair_id: String,
    save_as: bool,
    db: tauri::State<Database>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let data = build_quotation_pdf_data(&repair_id, db.inner(), true)?;
    let output_dir = resolve_output_dir(db.inner(), &app, save_as)?;
    let safe_id = repair_id.replace('/', "-");
    let customer_path = format!("{}/INV_{}_customer.pdf", output_dir, safe_id);
    let shop_path = format!("{}/INV_{}_shop.pdf", output_dir, safe_id);

    generate_invoice_pdf(&data, &customer_path)?;
    generate_invoice_pdf(&data, &shop_path)?;

    Ok(format!("{}\n{}", customer_path, shop_path))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn generate_pdf_should_create_valid_file() {
        let data = RepairPdfData {
            repair_id: "00001/06/18".into(),
            status: "Received".into(),
            device_type: "Laptop".into(),
            device_brand: "Dell".into(),
            device_model: "Inspiron 15".into(),
            device_serial: "SN001".into(),
            device_color: "Black".into(),
            reported_problem: "Device will not power on. No lights, no fan.".into(),
            received_at: "2025-06-18 10:00:00".into(),
            customer_name: "Alice".into(),
            customer_phone: "0123456789".into(),
            customer_email: String::new(),
            customer_company: String::new(),
            technician_name: String::new(),
            shop_name: "SaraaTEK".into(),
            shop_phone: "03-12345678".into(),
            has_condition: true,
            screen: "Fine".into(),
            keyboard: "Keys missing".into(),
            body: "Dented".into(),
            battery_present: "Yes".into(),
            charger_included: "No".into(),
            accessories_included: "Yes".into(),
            accessories_notes: "Carry bag".into(),
            extra_notes: "Sticker on lid".into(),
        };

        let tmp = std::env::temp_dir().join("saraatek_test_intake.pdf");
        let path = tmp.to_str().unwrap().to_string();

        generate_pdf(&data, &path).unwrap();

        assert!(Path::new(&path).exists(), "PDF file should exist");
        let meta = std::fs::metadata(&path).unwrap();
        assert!(meta.len() > 100, "PDF should be larger than 100 bytes");

        let _ = std::fs::remove_file(&path);
    }

    #[test]
    fn generate_pdf_should_handle_minimal_data() {
        let data = RepairPdfData {
            repair_id: "00001/06/18".into(),
            status: "Received".into(),
            device_type: String::new(),
            device_brand: "Unknown".into(),
            device_model: String::new(),
            device_serial: String::new(),
            device_color: String::new(),
            reported_problem: "Testing issue".into(),
            received_at: "2025-06-18 10:00:00".into(),
            customer_name: "Bob".into(),
            customer_phone: "0987654321".into(),
            customer_email: String::new(),
            customer_company: String::new(),
            technician_name: String::new(),
            shop_name: String::new(),
            shop_phone: String::new(),
            has_condition: false,
            screen: String::new(),
            keyboard: String::new(),
            body: String::new(),
            battery_present: String::new(),
            charger_included: String::new(),
            accessories_included: String::new(),
            accessories_notes: String::new(),
            extra_notes: String::new(),
        };

        let tmp = std::env::temp_dir().join("saraatek_test_minimal.pdf");
        let path = tmp.to_str().unwrap().to_string();

        generate_pdf(&data, &path).unwrap();

        assert!(Path::new(&path).exists());
        let meta = std::fs::metadata(&path).unwrap();
        assert!(meta.len() > 100);

        let _ = std::fs::remove_file(&path);
    }
}
