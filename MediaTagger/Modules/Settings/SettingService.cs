using MediaTagger.Data;
using MediaTagger.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MediaTagger.Modules.Setting
{


  public interface ISettingService {
    Task<string?> Get(string scope, string name);
    Task Set(string scope, string name, string value);
    Task<DateTime?> GetTime(string scope, string name);
    Task SetTime(string scope, string name, DateTime time);
    Task<AppSettings> GetAppSettings();
    Task SaveAppSettings(AppSettings settings);
  }
  public class SettingService : ISettingService
  {
      private const string APP_SETTINGS_SCOPE = "application";
  private const string APP_SETTINGS_NAME = "$app-settings$";

    private ILogger<SettingService> logger;
    private MediaTaggerContext dbContext;


    public SettingService(MediaTaggerContext db, 
      IHttpContextAccessor httpContextAccessor,
      IHubContext<LogHub,ILogHub> logHub,
      IHubContext<ImageHub> imageHub,
      ILogger<SettingService> logger)
    {
      this.logger = logger;
      this.dbContext = db;
    }

        public async Task<string?> Get(string scope, string name)
        {
            var setting = await dbContext.Settings.FindAsync(scope,name);
            if (setting == null) {
              return String.Empty;
            }
            return setting.Value;
        }

        public async  Task<DateTime?> GetTime(string scope, string name)
        {
            var setting = await Get(scope,name);
            if (!String.IsNullOrEmpty(setting)) {
              try {
                return DateTime.Parse(setting);
              } catch(Exception ex){
                logger.LogError(ex,$"Unable to parse setting {scope}:{name}");
              }
            }
            return null;
        }

        public async Task<AppSettings> GetAppSettings()
        {
            string? text = await Get(APP_SETTINGS_SCOPE,APP_SETTINGS_NAME);
            AppSettings result = new AppSettings();
            if (!String.IsNullOrEmpty(text)) {
              result = AppSettings.ParseJson(text);
            }
            return result;
        }


        public async Task SaveAppSettings(AppSettings settings)
        {
            string text = settings.ToJsonString();
            await Set(APP_SETTINGS_SCOPE,APP_SETTINGS_NAME,text);
            return;
        }

        public async Task Set(string scope, string name, string value)
        {
            var setting = await dbContext.Settings.FindAsync(scope,name);
            if (setting == null) {
              await dbContext.Settings.AddAsync(new SettingModel {Scope = scope, Name=name,Value=value});
              dbContext.SaveChanges();
            } else {
              setting.Value = value;
              dbContext.SaveChanges();
            }
        }

        public async Task SetTime(string scope, string name, DateTime time)
        {
            await Set(scope,name,(time == null) ? String.Empty : time.ToString());
            dbContext.SaveChanges();
        }
    }
}
