package com.privacyog.salahos;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;

import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.provider.Settings;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
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
