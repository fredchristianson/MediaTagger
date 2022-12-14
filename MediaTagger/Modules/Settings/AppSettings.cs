using System.Text.Json;
using ImageMagick;
using MediaTagger.Data;

public class AppSettings
{
    public static AppSettings ParseJson(string text)
    {
        var settings = JsonSerializer.Deserialize<AppSettings>(text);
        settings.CleanMediaDirectories();
        return settings;
    }

    private void CleanMediaDirectories()
    {
        List<string> keep = new List<string>();
        MediaDirectories.Sort();
        MediaDirectories.ForEach(dir =>
        {
            if (!keep.Any(k => { return dir.ToLower().StartsWith(k.ToLower()); }))
            {
                keep.Add(dir);
            }
        });
        MediaDirectories = keep;
    }

    public string ToJsonString()
    {
        return JsonSerializer.Serialize(this);
    }

    internal bool isChanged(AppSettings other)
    {
        return !StorageDirectory.Equals(other.StorageDirectory)
        || !getMediaExtensions().All(other.getMediaExtensions().Contains)
        || MediaDirectories.Count != other.MediaDirectories.Count
        || !MediaDirectories.All(other.MediaDirectories.Contains);
    }

    public string StorageDirectory { get; set; }
    = $"{Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData)}\\MediaTagger";
    public List<string> MediaDirectories { get; set; } = new List<string>();


    public string MediaExtensions { get; set; } = ".jpeg,.jpg,.png,.gif,.rw2,.mp4";
    public List<string> getMediaExtensions()
    {
        var items = MediaExtensions.Split(new char[] { ' ', ',', ';' });
        var list = items.ToList();
        list.Sort();
        return list;
    }

    public string getTempDirectory()
    {
        return Path.Combine(StorageDirectory, "temp");
    }

}

public class AppSettingsService
{
    static public bool IsAppStorageDirectory(string dir)
    {
        var path = Path.Combine(dir, ".mediatagger");
        var file = new FileInfo(path);
        return file.Exists;
    }
    public AppSettingsService(ILogger<AppSettingsService> logger)
    {

        this.logger = logger;

    }
    public AppSettings appSettings = new AppSettings();
    private ILogger<AppSettingsService> logger;

    public AppSettings get() { return appSettings; }
    internal void set(AppSettings settings)
    {
        lock (this)
        {
            if (get() == null || get().isChanged(settings))
            {
                var tmpDir = settings.getTempDirectory();
                try
                {
                    Directory.CreateDirectory(settings.StorageDirectory);
                    var path = Path.Combine(settings.StorageDirectory, ".mediatagger");
                    var file = new FileInfo(path);
                    File.WriteAllText(path, $"Media Tagger Storage.  Settings updated {DateTime.Now}");
                    Directory.CreateDirectory(tmpDir);
                    MagickNET.SetTempDirectory(tmpDir);

                }
                catch (Exception ex)
                {
                    logger.LogError(ex, $"unable to set AppSettings");
                    throw;
                }
            }
            this.appSettings = settings;
        }

    }

    public bool IsPathSelected(string path)
    {
        var len = path.Length;
        var selected = appSettings.MediaDirectories.Any(dir =>
        {
            if (len < dir.Length) { return false; }
            return path.StartsWith(dir, true, System.Globalization.CultureInfo.InvariantCulture);
        });
        return selected;
    }

}