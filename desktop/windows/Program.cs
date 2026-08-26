using System.Diagnostics;
using System.IO.Compression;
using System.Reflection;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace SalahOS.Windows;

internal static class Program
{
    private const string AssetResourceName = "SalahOS.Windows.WebAssets";

    [STAThread]
    private static int Main(string[] args)
    {
        try
        {
            var webRoot = PrepareWebAssets();
            if (args.Any(arg => string.Equals(arg, "--self-test", StringComparison.OrdinalIgnoreCase)))
            {
                VerifyPreparedAssets(webRoot);
                return 0;
            }

            ApplicationConfiguration.Initialize();
            Application.Run(new SalahOSForm(webRoot));
            return 0;
        }
        catch (Exception error)
        {
            if (!args.Any(arg => string.Equals(arg, "--self-test", StringComparison.OrdinalIgnoreCase)))
            {
                MessageBox.Show(
                    $"SalahOS could not start.\n\n{error.Message}",
                    "SalahOS",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }

            return 1;
        }
    }

    private static string PrepareWebAssets()
    {
        var version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "unknown";
        var root = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "SalahOS",
            "Desktop",
            $"v{version}"
        );
        var marker = Path.Combine(root, ".complete");
        var index = Path.Combine(root, "index.html");

        if (File.Exists(marker) && File.Exists(index))
        {
            return root;
        }

        var parent = Path.GetDirectoryName(root)
            ?? throw new InvalidOperationException("Unable to resolve the SalahOS desktop data directory.");
        Directory.CreateDirectory(parent);

        var staging = root + ".staging-" + Guid.NewGuid().ToString("N");
        Directory.CreateDirectory(staging);

        try
        {
            using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(AssetResourceName)
                ?? throw new InvalidOperationException("The packaged SalahOS web application is missing.");
            ZipFile.ExtractToDirectory(stream, staging, overwriteFiles: true);
            VerifyPreparedAssets(staging);
            File.WriteAllText(Path.Combine(staging, ".complete"), version);

            if (Directory.Exists(root))
            {
                Directory.Delete(root, recursive: true);
            }

            Directory.Move(staging, root);
            return root;
        }
        catch
        {
            if (Directory.Exists(staging))
            {
                Directory.Delete(staging, recursive: true);
            }

            throw;
        }
    }

    private static void VerifyPreparedAssets(string webRoot)
    {
        var index = Path.Combine(webRoot, "index.html");
        var assets = Path.Combine(webRoot, "assets");
        if (!File.Exists(index) || new FileInfo(index).Length == 0)
        {
            throw new InvalidOperationException("The packaged SalahOS index.html is missing or empty.");
        }

        if (!Directory.Exists(assets) || !Directory.EnumerateFiles(assets, "*", SearchOption.AllDirectories).Any())
        {
            throw new InvalidOperationException("The packaged SalahOS application assets are missing.");
        }
    }
}

internal sealed class SalahOSForm : Form
{
    private const string AppHost = "app.salahos.local";
    private readonly string _webRoot;
    private readonly WebView2 _webView;

    public SalahOSForm(string webRoot)
    {
        _webRoot = webRoot;
        Text = "SalahOS";
        StartPosition = FormStartPosition.CenterScreen;
        Width = 1280;
        Height = 840;
        MinimumSize = new Size(900, 640);

        _webView = new WebView2 { Dock = DockStyle.Fill };
        Controls.Add(_webView);
        Shown += async (_, _) => await InitializeWebViewAsync();
    }

    private async Task InitializeWebViewAsync()
    {
        try
        {
            var userData = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "SalahOS",
                "WebView2"
            );
            Directory.CreateDirectory(userData);

            var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: userData);
            await _webView.EnsureCoreWebView2Async(environment);
            _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                AppHost,
                _webRoot,
                CoreWebView2HostResourceAccessKind.Allow
            );
            _webView.CoreWebView2.NewWindowRequested += HandleNewWindowRequested;
            _webView.CoreWebView2.NavigationStarting += HandleNavigationStarting;
            _webView.Source = new Uri($"https://{AppHost}/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            MessageBox.Show(
                "SalahOS requires the Microsoft Edge WebView2 Runtime. It is included with current Windows 10/11 installations and can also be installed from Microsoft.",
                "SalahOS",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
            Close();
        }
        catch (Exception error)
        {
            MessageBox.Show(
                $"SalahOS could not initialise its desktop view.\n\n{error.Message}",
                "SalahOS",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            Close();
        }
    }

    private static void HandleNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs args)
    {
        if (OpenExternal(args.Uri))
        {
            args.Handled = true;
        }
    }

    private static void HandleNavigationStarting(object? sender, CoreWebView2NavigationStartingEventArgs args)
    {
        if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri))
        {
            return;
        }

        if (string.Equals(uri.Host, AppHost, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (uri.Scheme is "http" or "https" or "mailto" or "tel" && OpenExternal(args.Uri))
        {
            args.Cancel = true;
        }
    }

    private static bool OpenExternal(string target)
    {
        try
        {
            Process.Start(new ProcessStartInfo(target) { UseShellExecute = true });
            return true;
        }
        catch
        {
            return false;
        }
    }
}
