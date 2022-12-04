using System.Text.Json;

public class AppSettings {
    public static AppSettings ParseJson(string text) {
        return JsonSerializer.Deserialize<AppSettings>(text);
    }

    public string ToJsonString() {
        return JsonSerializer.Serialize(this);
    }
    public string StorageDirectory {get;set;} 
    = $"{Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData)}\\MediaTagger";
    public List<string> MediaDirectories {get;set;} = new List<string>();


}