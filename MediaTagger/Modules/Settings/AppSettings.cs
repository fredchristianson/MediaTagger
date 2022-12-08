using System.Text.Json;
using ImageMagick;
using MediaTagger.Data;

public class AppSettings
{
    public static AppSettings ParseJson(string text)
    {
        return JsonSerializer.Deserialize<AppSettings>(text);
    }

    public string ToJsonString()
    {
        return JsonSerializer.Serialize(this);
    }

    internal bool isChanged(AppSettings other)
    {
        return !StorageDirectory.Equals(other.StorageDirectory)
        || !getMediaExtensions().All(other.getMediaExtensions().Contains)
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
    public AppSettingsService()
    {
    }
    public AppSettings appSettings = new AppSettings();

    public AppSettings get() { return appSettings; }
    internal void set(AppSettings settings)
    {
        if (get() == null || get().isChanged(settings))
        {
            this.appSettings = settings;
            var tmpDir = settings.getTempDirectory();
            try
            {
                Directory.CreateDirectory(tmpDir);
                MagickNET.SetTempDirectory(tmpDir);
            }
            catch (Exception ex)
            {
                // ignore
            }
        }
    }
}