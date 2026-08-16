from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f'Missing patch anchor: {old[:160]}')
    return text.replace(old, new, 1)


path = Path('src/App.tsx')
text = path.read_text()
text = replace_once(
    text,
    "import type { ManualMosquePrayerDrafts } from './domain/manualMosqueEntry';\n",
    "import type { ManualIqamahMode, ManualMosquePrayerDrafts } from './domain/manualMosqueEntry';\n",
)
text = replace_once(
    text,
    "function emptyManualMosqueDrafts(): ManualMosquePrayerDrafts {\n  return {\n    fajr: { start: '', iqamah: '' },\n    dhuhr: { start: '', iqamah: '' },\n    asr: { start: '', iqamah: '' },\n    maghrib: { start: '', iqamah: '' },\n    isha: { start: '', iqamah: '' },\n  };\n}\n",
    "function emptyManualMosqueDrafts(): ManualMosquePrayerDrafts {\n  return {\n    fajr: { start: '', iqamahMode: 'none', iqamah: '' },\n    dhuhr: { start: '', iqamahMode: 'none', iqamah: '' },\n    asr: { start: '', iqamahMode: 'none', iqamah: '' },\n    maghrib: { start: '', iqamahMode: 'none', iqamah: '' },\n    isha: { start: '', iqamahMode: 'none', iqamah: '' },\n  };\n}\n",
)
anchor = "  function updateManualMosqueDraft(\n    prayer: (typeof MANUAL_MOSQUE_PRAYERS)[number],\n    field: 'start' | 'iqamah',\n    value: string,\n  ): void {\n    setManualMosqueDrafts((current) => ({\n      ...current,\n      [prayer]: { ...current[prayer], [field]: value },\n    }));\n    setMosqueMessage(null);\n  }\n"
replacement = anchor + "\n  function updateManualIqamahMode(\n    prayer: (typeof MANUAL_MOSQUE_PRAYERS)[number],\n    iqamahMode: ManualIqamahMode,\n  ): void {\n    setManualMosqueDrafts((current) => ({\n      ...current,\n      [prayer]: { ...current[prayer], iqamahMode, iqamah: '' },\n    }));\n    setMosqueMessage(null);\n  }\n"
text = replace_once(text, anchor, replacement)
old_ui = """                  <label>\n                    <span>{translate(locale, 'iqamahTimeOptional')}</span>\n                    <input\n                      type=\"time\"\n                      step=\"60\"\n                      value={manualMosqueDrafts[prayer].iqamah}\n                      onChange={(event) => {\n                        updateManualMosqueDraft(prayer, 'iqamah', event.target.value);\n                      }}\n                    />\n                  </label>\n"""
new_ui = """                  <label>\n                    <span>{translate(locale, 'iqamahSetting')}</span>\n                    <select\n                      value={manualMosqueDrafts[prayer].iqamahMode}\n                      onChange={(event) => {\n                        updateManualIqamahMode(prayer, event.target.value as ManualIqamahMode);\n                      }}\n                    >\n                      <option value=\"none\">{translate(locale, 'noIqamah')}</option>\n                      <option value=\"fixed\">{translate(locale, 'iqamahFixed')}</option>\n                      <option value=\"offset\">{translate(locale, 'iqamahOffset')}</option>\n                    </select>\n                  </label>\n                  {manualMosqueDrafts[prayer].iqamahMode === 'fixed' && (\n                    <label>\n                      <span>{translate(locale, 'iqamahFixedTime')}</span>\n                      <input\n                        type=\"time\"\n                        step=\"60\"\n                        required\n                        value={manualMosqueDrafts[prayer].iqamah}\n                        onChange={(event) => {\n                          updateManualMosqueDraft(prayer, 'iqamah', event.target.value);\n                        }}\n                      />\n                    </label>\n                  )}\n                  {manualMosqueDrafts[prayer].iqamahMode === 'offset' && (\n                    <label>\n                      <span>{translate(locale, 'iqamahOffsetMinutes')}</span>\n                      <input\n                        type=\"number\"\n                        min=\"0\"\n                        max=\"180\"\n                        step=\"1\"\n                        required\n                        inputMode=\"numeric\"\n                        value={manualMosqueDrafts[prayer].iqamah}\n                        onChange={(event) => {\n                          updateManualMosqueDraft(prayer, 'iqamah', event.target.value);\n                        }}\n                      />\n                    </label>\n                  )}\n"""
text = replace_once(text, old_ui, new_ui)
path.write_text(text)


path = Path('src/i18n/translations.ts')
text = path.read_text()
text = replace_once(
    text,
    "    manualMosqueEntryHelp:\n      'Enter all five prayer start times for one Gregorian date. Iqamah times are optional. Saving replaces that date if it already exists for the mosque.',\n",
    "    manualMosqueEntryHelp:\n      'Enter all five prayer start times for one Gregorian date. Iqamah can be disabled, set to a fixed time, or set as minutes after prayer start. Saving replaces that date if it already exists for the mosque.',\n",
)
text = replace_once(
    text,
    "    iqamahTimeOptional: 'Iqamah (optional)',\n",
    "    iqamahTimeOptional: 'Iqamah (optional)',\n    iqamahSetting: 'Iqamah setting',\n    iqamahFixed: 'Fixed time',\n    iqamahOffset: 'Minutes after prayer start',\n    iqamahFixedTime: 'Fixed Iqamah time',\n    iqamahOffsetMinutes: 'Iqamah offset (minutes)',\n",
)
text = replace_once(
    text,
    "    manualMosqueDayError:\n      'Enter a mosque name, valid date, and all five prayer start times in 24-hour format.',\n",
    "    manualMosqueDayError:\n      'Enter a mosque name, valid date, all five prayer start times, and valid Iqamah settings.',\n",
)
text = replace_once(
    text,
    "    manualMosqueEntryHelp:\n      'أدخل أوقات بداية الصلوات الخمس لتاريخ ميلادي واحد. أوقات الإقامة اختيارية. عند الحفظ يُستبدل اليوم نفسه إذا كان موجوداً في جدول المسجد.',\n",
    "    manualMosqueEntryHelp:\n      'أدخل أوقات بداية الصلوات الخمس لتاريخ ميلادي واحد. يمكن تعطيل الإقامة أو ضبطها كوقت ثابت أو كعدد دقائق بعد بداية الصلاة. عند الحفظ يُستبدل اليوم نفسه إذا كان موجوداً في جدول المسجد.',\n",
)
text = replace_once(
    text,
    "    iqamahTimeOptional: 'الإقامة (اختياري)',\n",
    "    iqamahTimeOptional: 'الإقامة (اختياري)',\n    iqamahSetting: 'إعداد الإقامة',\n    iqamahFixed: 'وقت ثابت',\n    iqamahOffset: 'بعد بداية الصلاة بدقائق',\n    iqamahFixedTime: 'وقت الإقامة الثابت',\n    iqamahOffsetMinutes: 'فاصل الإقامة (بالدقائق)',\n",
)
text = replace_once(
    text,
    "    manualMosqueDayError:\n      'أدخل اسم المسجد وتاريخاً صحيحاً وأوقات بداية الصلوات الخمس بصيغة 24 ساعة.',\n",
    "    manualMosqueDayError:\n      'أدخل اسم المسجد وتاريخاً صحيحاً وأوقات بداية الصلوات الخمس وإعدادات إقامة صالحة.',\n",
)
path.write_text(text)
