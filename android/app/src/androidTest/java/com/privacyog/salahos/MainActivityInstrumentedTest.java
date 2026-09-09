package com.privacyog.salahos;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.provider.Settings;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class MainActivityInstrumentedTest {

    private static void waitForOrientation(MainActivity activity, int expectedOrientation) throws InterruptedException {
        for (int attempt = 0; attempt < 50; attempt += 1) {
            if (activity.getResources().getConfiguration().orientation == expectedOrientation) {
                return;
            }
            Thread.sleep(100);
        }
        assertEquals(expectedOrientation, activity.getResources().getConfiguration().orientation);
    }

    private static String evaluateJavascript(
        Instrumentation instrumentation,
        MainActivity activity,
        String script
    ) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();

        instrumentation.runOnMainSync(
            () -> {
                assertNotNull(activity.getBridge());
                assertNotNull(activity.getBridge().getWebView());
                activity.getBridge().getWebView().evaluateJavascript(
                    script,
                    value -> {
                        result.set(value);
                        latch.countDown();
                    }
                );
            }
        );

        assertTrue("Timed out waiting for WebView JavaScript result", latch.await(10, TimeUnit.SECONDS));
        return result.get();
    }

    private static String javascriptStringValue(String encoded) {
        if (encoded != null && encoded.length() >= 2 && encoded.startsWith("\"") && encoded.endsWith("\"")) {
            return encoded.substring(1, encoded.length() - 1);
        }
        return encoded;
    }

    private static void waitForWebViewReady(
        Instrumentation instrumentation,
        MainActivity activity
    ) throws Exception {
        for (int attempt = 0; attempt < 50; attempt += 1) {
            String state = javascriptStringValue(evaluateJavascript(instrumentation, activity, "document.readyState"));
            if ("complete".equals(state)) {
                return;
            }
            Thread.sleep(100);
        }
        assertEquals(
            "complete",
            javascriptStringValue(evaluateJavascript(instrumentation, activity, "document.readyState"))
        );
    }

    private static void assertPackagedQuranLoadsOffline(
        Instrumentation instrumentation,
        MainActivity activity
    ) throws Exception {
        String startProbe =
            "window.__salahosQuranOfflineProbe='pending';" +
            "void (async()=>{" +
            "try{" +
            "const packUrl=new URL('/data/quran/quran-offline-pack.json',window.location.href).href;" +
            "const fontUrl=new URL('/fonts/amiri-quran-arabic.woff2',window.location.href).href;" +
            "const packResponse=await fetch(packUrl,{cache:'no-store'});" +
            "const fontResponse=await fetch(fontUrl,{cache:'no-store'});" +
            "if(!packResponse.ok){window.__salahosQuranOfflineProbe='pack-http-'+packResponse.status;return;}" +
            "if(!fontResponse.ok){window.__salahosQuranOfflineProbe='font-http-'+fontResponse.status;return;}" +
            "const pack=await packResponse.json();" +
            "const fontBytes=(await fontResponse.arrayBuffer()).byteLength;" +
            "const surahCount=Array.isArray(pack.surahs)?pack.surahs.length:-1;" +
            "window.__salahosQuranOfflineProbe=['ok',pack.counts&&pack.counts.surahs,pack.counts&&pack.counts.ayahs,surahCount,fontBytes].join(':');" +
            "}catch(error){window.__salahosQuranOfflineProbe='error:'+String(error);}" +
            "})();'started';";

        assertEquals(
            "started",
            javascriptStringValue(evaluateJavascript(instrumentation, activity, startProbe))
        );

        String probe = "pending";
        for (int attempt = 0; attempt < 100; attempt += 1) {
            probe = javascriptStringValue(
                evaluateJavascript(
                    instrumentation,
                    activity,
                    "window.__salahosQuranOfflineProbe||'missing'"
                )
            );
            if (!"pending".equals(probe)) {
                break;
            }
            Thread.sleep(100);
        }

        assertNotNull(probe);
        assertTrue("Offline Qur’an probe failed: " + probe, probe.startsWith("ok:114:6236:114:"));
        String[] parts = probe.split(":");
        assertEquals(5, parts.length);
        assertTrue("Packaged Qur’an font was empty", Integer.parseInt(parts[4]) > 0);
    }

    @Test
    public void launchesOfflineAndSurvivesOrientationChanges() throws Exception {
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        assertEquals("com.privacyog.salahos", instrumentation.getTargetContext().getPackageName());
        assertEquals(
            1,
            Settings.Global.getInt(
                instrumentation.getTargetContext().getContentResolver(),
                Settings.Global.AIRPLANE_MODE_ON,
                0
            )
        );

        Intent intent = new Intent(instrumentation.getTargetContext(), MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        MainActivity activity = (MainActivity) instrumentation.startActivitySync(intent);
        assertNotNull(activity);
        assertFalse(activity.isFinishing());
        waitForWebViewReady(instrumentation, activity);
        assertPackagedQuranLoadsOffline(instrumentation, activity);

        instrumentation.runOnMainSync(
            () -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)
        );
        instrumentation.waitForIdleSync();
        waitForOrientation(activity, Configuration.ORIENTATION_LANDSCAPE);
        assertFalse(activity.isFinishing());

        instrumentation.runOnMainSync(
            () -> activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT)
        );
        instrumentation.waitForIdleSync();
        waitForOrientation(activity, Configuration.ORIENTATION_PORTRAIT);
        assertFalse(activity.isFinishing());

        instrumentation.runOnMainSync(activity::finish);
    }
}
