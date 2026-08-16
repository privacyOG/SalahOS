from pathlib import Path
import json

# Branch-only integration helper; removed before pull request review.
# This comment ensures the already-present integration workflow receives a push event.

app_path = Path('src/App.tsx')
app = app_path.read_text()
old_import = "import { requestBrowserLocation } from './platform/browserGeolocation';\nimport type { BrowserLocationFailureReason } from './platform/browserGeolocation';"
new_import = "import { requestCurrentLocation } from './platform/currentLocation';\nimport type { LocationFailureReason } from './platform/currentLocation';"
if old_import not in app and new_import not in app:
    raise RuntimeError('Missing App location import anchor')
app = app.replace(old_import, new_import, 1)
app = app.replace('Record<BrowserLocationFailureReason, TranslationKey>', 'Record<LocationFailureReason, TranslationKey>')
app = app.replace('useState<BrowserLocationFailureReason | null>(null)', 'useState<LocationFailureReason | null>(null)')
app = app.replace('await requestBrowserLocation()', 'await requestCurrentLocation()')
app_path.write_text(app)

package_path = Path('package.json')
package = json.loads(package_path.read_text())
package.setdefault('scripts', {})['android:sync'] = 'npm run build && cap sync android'
package['scripts']['android:build'] = 'npm run android:sync && cd android && ./gradlew assembleDebug'
package_path.write_text(json.dumps(package, indent=2) + '\n')

manifest_path = Path('android/app/src/main/AndroidManifest.xml')
manifest = manifest_path.read_text()
permissions = [
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
]
application_marker = '    <application'
if application_marker not in manifest:
    raise RuntimeError('Missing Android application marker')
for permission in permissions:
    if permission not in manifest:
        manifest = manifest.replace(application_marker, f'    {permission}\n{application_marker}', 1)
manifest_path.write_text(manifest)
