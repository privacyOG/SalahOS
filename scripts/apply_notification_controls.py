from pathlib import Path


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing notification control marker: {old[:100]}")
    return text.replace(old, new, 1)


app_path = Path("src/App.tsx")
app = app_path.read_text()

settings_import = "import type { PersistedSettings } from './platform/settingsStorage';\n"
notification_import = """import {
  NOTIFICATION_PRAYERS,
  updatePrayerNotificationPreference,
} from './domain/notificationPreferences';
"""
if notification_import not in app:
    app = replace_once(app, "import type { PrayerName } from './domain/prayerEngine';\n", "import type { PrayerName } from './domain/prayerEngine';\n" + notification_import)

# Remove the second copy of the mosque-library section if the historical duplicate is still present.
mosque_start = """        <section
          className=\"mosque-library-controls\"
          aria-label={translate(locale, 'mosqueLibrary')}
        >
"""
first = app.find(mosque_start)
if first != -1:
    second = app.find(mosque_start, first + len(mosque_start))
    if second != -1:
        end_marker = "        </section>\n\n"
        end = app.find(end_marker, second)
        if end == -1:
            raise RuntimeError("Could not locate duplicate mosque-library section end")
        app = app[:second] + app[end + len(end_marker):]

anchor = """        </fieldset>\n\n        <div className=\"settings-transfer\">\n"""
notification_ui = """        </fieldset>\n\n        <fieldset className=\"notification-fieldset\">\n          <legend>{translate(locale, 'notificationSettings')}</legend>\n          <div className=\"notification-grid\">\n            {NOTIFICATION_PRAYERS.map((prayer) => {\n              const preference = settings.notifications[prayer];\n              return (\n                <article className=\"notification-card\" key={prayer}>\n                  <h3>{translate(locale, prayerTranslationKeys[prayer])}</h3>\n                  <label className=\"toggle-row\">\n                    <input\n                      type=\"checkbox\"\n                      checked={preference.enabled}\n                      onChange={(event) => {\n                        setSettings((current) => ({\n                          ...current,\n                          notifications: updatePrayerNotificationPreference(\n                            current.notifications,\n                            prayer,\n                            { enabled: event.target.checked },\n                          ),\n                        }));\n                      }}\n                    />\n                    <span>{translate(locale, 'notificationEnabled')}</span>\n                  </label>\n                  <label>\n                    <span>{translate(locale, 'reminderMinutes')}</span>\n                    <input\n                      type=\"number\"\n                      min=\"1\"\n                      max=\"180\"\n                      step=\"1\"\n                      value={preference.reminderMinutes ?? ''}\n                      onChange={(event) => {\n                        const raw = event.target.value.trim();\n                        const reminderMinutes = raw === '' ? null : Number(raw);\n                        if (\n                          reminderMinutes !== null &&\n                          (!Number.isInteger(reminderMinutes) ||\n                            reminderMinutes < 1 ||\n                            reminderMinutes > 180)\n                        ) {\n                          return;\n                        }\n                        setSettings((current) => ({\n                          ...current,\n                          notifications: updatePrayerNotificationPreference(\n                            current.notifications,\n                            prayer,\n                            { reminderMinutes },\n                          ),\n                        }));\n                      }}\n                    />\n                  </label>\n                  <label className=\"toggle-row\">\n                    <input\n                      type=\"checkbox\"\n                      checked={preference.prayerTimeNotification}\n                      onChange={(event) => {\n                        setSettings((current) => ({\n                          ...current,\n                          notifications: updatePrayerNotificationPreference(\n                            current.notifications,\n                            prayer,\n                            { prayerTimeNotification: event.target.checked },\n                          ),\n                        }));\n                      }}\n                    />\n                    <span>{translate(locale, 'prayerTimeNotification')}</span>\n                  </label>\n                  <label>\n                    <span>{translate(locale, 'notificationSound')}</span>\n                    <select\n                      value={preference.sound}\n                      onChange={(event) => {\n                        setSettings((current) => ({\n                          ...current,\n                          notifications: updatePrayerNotificationPreference(\n                            current.notifications,\n                            prayer,\n                            { sound: event.target.value === 'silent' ? 'silent' : 'default' },\n                          ),\n                        }));\n                      }}\n                    >\n                      <option value=\"default\">{translate(locale, 'soundDefault')}</option>\n                      <option value=\"silent\">{translate(locale, 'soundSilent')}</option>\n                    </select>\n                  </label>\n                  <label className=\"toggle-row\">\n                    <input\n                      type=\"checkbox\"\n                      checked={preference.vibration}\n                      onChange={(event) => {\n                        setSettings((current) => ({\n                          ...current,\n                          notifications: updatePrayerNotificationPreference(\n                            current.notifications,\n                            prayer,\n                            { vibration: event.target.checked },\n                          ),\n                        }));\n                      }}\n                    />\n                    <span>{translate(locale, 'vibration')}</span>\n                  </label>\n                  <label className=\"toggle-row\">\n                    <input\n                      type=\"checkbox\"\n                      checked={preference.adhanEnabled}\n                      onChange={(event) => {\n                        setSettings((current) => ({\n                          ...current,\n                          notifications: updatePrayerNotificationPreference(\n                            current.notifications,\n                            prayer,\n                            { adhanEnabled: event.target.checked },\n                          ),\n                        }));\n                      }}\n                    />\n                    <span>{translate(locale, 'adhanEnabled')}</span>\n                  </label>\n                </article>\n              );\n            })}\n          </div>\n          <p className=\"settings-note\">{translate(locale, 'notificationDeliveryPending')}</p>\n        </fieldset>\n\n        <div className=\"settings-transfer\">\n"""
if "className=\"notification-fieldset\"" not in app:
    app = replace_once(app, anchor, notification_ui)
app_path.write_text(app)

translations_path = Path("src/i18n/translations.ts")
translations = translations_path.read_text()
translations = replace_once(
    translations,
    "    prayerOffsets: 'Manual prayer offsets (minutes)',\n",
    "    prayerOffsets: 'Manual prayer offsets (minutes)',\n    notificationSettings: 'Prayer notifications and Adhan',\n    notificationEnabled: 'Enable notifications',\n    reminderMinutes: 'Reminder before prayer (minutes)',\n    prayerTimeNotification: 'Notify at prayer time',\n    notificationSound: 'Notification sound',\n    soundDefault: 'Default sound',\n    soundSilent: 'Silent',\n    vibration: 'Vibration where supported',\n    adhanEnabled: 'Enable Adhan playback',\n    notificationDeliveryPending: 'Delivery and exact scheduling depend on platform permission and background restrictions; these settings are stored locally until a platform scheduler is enabled.',\n",
)
translations = replace_once(
    translations,
    "    prayerOffsets: 'تعديلات الصلاة اليدوية (بالدقائق)',\n",
    "    prayerOffsets: 'تعديلات الصلاة اليدوية (بالدقائق)',\n    notificationSettings: 'إشعارات الصلاة والأذان',\n    notificationEnabled: 'تفعيل الإشعارات',\n    reminderMinutes: 'التذكير قبل الصلاة (بالدقائق)',\n    prayerTimeNotification: 'إشعار عند دخول وقت الصلاة',\n    notificationSound: 'صوت الإشعار',\n    soundDefault: 'الصوت الافتراضي',\n    soundSilent: 'صامت',\n    vibration: 'الاهتزاز حيثما كان مدعوماً',\n    adhanEnabled: 'تفعيل تشغيل الأذان',\n    notificationDeliveryPending: 'يعتمد التسليم والتوقيت الدقيق على أذونات المنصة وقيود العمل في الخلفية؛ تُحفظ هذه الإعدادات محلياً إلى أن يتم تفعيل مجدول خاص بالمنصة.',\n",
)
translations_path.write_text(translations)

styles_path = Path("src/styles.css")
styles = styles_path.read_text().rstrip()
addition = """

.notification-fieldset {
  margin-block: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.9rem;
}

.notification-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.8rem;
}

.notification-card {
  display: grid;
  gap: 0.7rem;
  padding: 0.9rem;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.025);
}

.notification-card h3 {
  margin: 0;
  font-size: 1rem;
}

.notification-card label {
  display: grid;
  gap: 0.3rem;
  font-size: 0.82rem;
}

.notification-card .toggle-row {
  grid-template-columns: auto 1fr;
  align-items: center;
}

.notification-card .toggle-row input {
  inline-size: 1.1rem;
  block-size: 1.1rem;
}

.settings-note {
  margin-block-end: 0;
  color: #aeb9ac;
  font-size: 0.8rem;
  line-height: 1.45;
}
"""
if ".notification-fieldset {" not in styles:
    styles_path.write_text(styles + addition + "\n")
