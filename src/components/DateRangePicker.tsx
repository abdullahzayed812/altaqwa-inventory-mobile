import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  SafeAreaView, Pressable,
} from "react-native";
import { COLORS } from "../constants/theme";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface Props {
  range: DateRange;
  onChange: (range: DateRange) => void;
  onClear: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDisplay(d: Date): string {
  return d.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const DAYS = ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"];
const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
                "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

// ── calendar grid ─────────────────────────────────────────────────────────────

interface CalendarProps {
  range: DateRange;
  onDayPress: (d: Date) => void;
}

function Calendar({ range, onDayPress }: CalendarProps) {
  const today = startOfDay(new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // build grid: days of current month padded to start on Sunday
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const { startDate, endDate } = range;

  const getState = (d: Date) => {
    const sd = startDate ? startOfDay(startDate) : null;
    const ed = endDate ? startOfDay(endDate) : null;
    const day = startOfDay(d);
    if (sd && sameDay(day, sd)) return "start";
    if (ed && sameDay(day, ed)) return "end";
    if (sd && ed && day > sd && day < ed) return "range";
    return "none";
  };

  return (
    <View>
      {/* Header */}
      <View style={cal.header}>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}>
          <Text style={cal.navText}>›</Text>
        </TouchableOpacity>
        <Text style={cal.monthLabel}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}>
          <Text style={cal.navText}>‹</Text>
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={cal.row}>
        {DAYS.map(d => (
          <View key={d} style={cal.cell}>
            <Text style={cal.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Date cells */}
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <View key={week} style={cal.row}>
          {cells.slice(week * 7, week * 7 + 7).map((d, i) => {
            if (!d) return <View key={i} style={cal.cell} />;
            const state = getState(d);
            const isEdge = state === "start" || state === "end";
            return (
              <TouchableOpacity
                key={i}
                style={[
                  cal.cell,
                  state === "range" && cal.cellRange,
                  isEdge && cal.cellEdge,
                ]}
                onPress={() => onDayPress(d)}
              >
                <Text style={[cal.dayText, isEdge && cal.dayTextEdge]}>
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function DateRangePicker({ range, onChange, onClear }: Props) {
  const [open, setOpen] = useState(false);

  const handleDayPress = (d: Date) => {
    const day = startOfDay(d);
    const { startDate, endDate } = range;

    if (!startDate || (startDate && endDate)) {
      // fresh selection
      onChange({ startDate: day, endDate: null });
    } else {
      // startDate set, picking end
      if (day < startOfDay(startDate)) {
        onChange({ startDate: day, endDate: null });
      } else if (sameDay(day, startDate)) {
        onChange({ startDate: null, endDate: null });
      } else {
        onChange({ startDate, endDate: day });
        setOpen(false); // close after range is complete
      }
    }
  };

  const hasFilter = range.startDate || range.endDate;

  return (
    <>
      {/* Trigger row */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, range.startDate && styles.btnActive]}
          onPress={() => setOpen(true)}
        >
          <Text style={styles.btnLabel}>من</Text>
          <Text style={[styles.btnDate, range.startDate && styles.btnDateActive]}>
            {range.startDate ? fmtDisplay(range.startDate) : "-- / -- / ----"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.arrow}>←</Text>

        <TouchableOpacity
          style={[styles.btn, range.endDate && styles.btnActive]}
          onPress={() => setOpen(true)}
        >
          <Text style={styles.btnLabel}>إلى</Text>
          <Text style={[styles.btnDate, range.endDate && styles.btnDateActive]}>
            {range.endDate ? fmtDisplay(range.endDate) : "-- / -- / ----"}
          </Text>
        </TouchableOpacity>

        {hasFilter && (
          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Calendar modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            {/* Range summary inside modal */}
            <View style={styles.rangeSummary}>
              <View style={[styles.summaryDate, range.startDate && styles.summaryDateActive]}>
                <Text style={styles.summaryLabel}>من</Text>
                <Text style={[styles.summaryValue, range.startDate && { color: COLORS.primary }]}>
                  {range.startDate ? fmtDisplay(range.startDate) : "---"}
                </Text>
              </View>
              <Text style={{ color: COLORS.textSecondary, marginHorizontal: 8 }}>←</Text>
              <View style={[styles.summaryDate, range.endDate && styles.summaryDateActive]}>
                <Text style={styles.summaryLabel}>إلى</Text>
                <Text style={[styles.summaryValue, range.endDate && { color: COLORS.primary }]}>
                  {range.endDate ? fmtDisplay(range.endDate) : "---"}
                </Text>
              </View>
            </View>

            <Calendar range={range} onDayPress={handleDayPress} />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearAllBtn}
                onPress={() => { onClear(); setOpen(false); }}
              >
                <Text style={styles.clearAllText}>مسح</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setOpen(false)}>
                <Text style={styles.doneBtnText}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const cal = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 4 },
  navBtn: { padding: 8 },
  navText: { fontSize: 22, color: COLORS.primary, fontWeight: "bold" },
  monthLabel: { fontSize: 15, fontWeight: "bold", color: COLORS.textPrimary },
  row: { flexDirection: "row" },
  cell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellRange: { backgroundColor: COLORS.primary + "22" },
  cellEdge: { backgroundColor: COLORS.primary, borderRadius: 100 },
  dayLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  dayText: { fontSize: 13, color: COLORS.textPrimary },
  dayTextEdge: { color: "#fff", fontWeight: "bold" },
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  btn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  btnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "0f" },
  btnLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  btnDate: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  btnDateActive: { color: COLORS.primary },
  arrow: { fontSize: 16, color: COLORS.textSecondary },
  clearBtn: { backgroundColor: COLORS.danger + "18", borderRadius: 8, width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  clearText: { color: COLORS.danger, fontSize: 14, fontWeight: "bold" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  rangeSummary: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  summaryDate: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  summaryDateActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "0f" },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: "700", color: COLORS.textSecondary, marginTop: 2 },
  modalActions: { flexDirection: "row", marginTop: 16, gap: 10 },
  clearAllBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 13, alignItems: "center" },
  clearAllText: { color: COLORS.textSecondary, fontWeight: "600" },
  doneBtn: { flex: 2, backgroundColor: COLORS.primary, borderRadius: 10, padding: 13, alignItems: "center" },
  doneBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
