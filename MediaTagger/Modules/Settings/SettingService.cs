using MediaTagger.Data;
using MediaTagger.Modules.BackgroundTasks;
using MediaTagger.Modules.BackgroundTasks.Workers;

namespace MediaTagger.Modules.Setting
{

    public interface ISettingService
    {
        Task<string?> Get(string scope, string name);
        Task Set(string scope, string name, string value);
        Task<DateTime?> GetTime(string scope, string name);
        Task SetTime(string scope, string name, DateTime time);
        Task<AppSettings> GetAppSettings();
        Task SaveAppSettings(AppSettings settings);
    }
    public class SettingService : ISettingService
    {

        internal const string APP_SETTINGS_SCOPE = "application";
        internal const string APP_SETTINGS_NAME = "$app-settings$";


        private ILogger<SettingService> logger;
        private MediaTaggerContext dbContext;
        private AppSettingsService appSettingsService;
        private IServiceProvider serviceProvider;
        private BackgroundTaskManager backgroundTaskManager;

        public SettingService(MediaTaggerContext db,
      AppSettingsService appSettingsService,
      IServiceProvider serviceProvider,
      ILogger<SettingService> logger)
        {
            this.logger = logger;
            this.dbContext = db;
            this.appSettingsService = appSettingsService;
            this.serviceProvider = serviceProvider;
        }

        public async Task<string?> Get(string scope, string name)
        {
            var setting = await dbContext.Settings.FindAsync(scope, name);
            if (setting == null)
            {
                return String.Empty;
            }
            return setting.Value;
        }

        public async Task<DateTime?> GetTime(string scope, string name)
        {
            var setting = await Get(scope, name);
            if (!String.IsNullOrEmpty(setting))
            {
                try
                {
                    return DateTime.Parse(setting);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, $"Unable to parse setting {scope}:{name}");
                }
            }
            return null;
        }

        public async Task<AppSettings> GetAppSettings()
        {
            string? text = await Get(APP_SETTINGS_SCOPE, APP_SETTINGS_NAME);
            AppSettings result = new AppSettings();
            if (!String.IsNullOrEmpty(text))
            {
                result = AppSettings.ParseJson(text);
            }
            appSettingsService.set(result);
            return result;
        }


        public async Task SaveAppSettings(AppSettings settings)
        {
            var old = appSettingsService.get();
            if (settings.isChanged(old))
            {
                string text = settings.ToJsonString();
                await Set(APP_SETTINGS_SCOPE, APP_SETTINGS_NAME, text);
                appSettingsService.set(settings);
                var backgroundTaskQueue = serviceProvider.GetRequiredService<IBackgroundTaskQueue>();
                await backgroundTaskQueue.CreateWorker<FileScanWorker>();

            }

            return;
        }

        public async Task Set(string scope, string name, string value)
        {
            var setting = await dbContext.Settings.FindAsync(scope, name);
            if (setting == null)
            {
                await dbContext.Settings.AddAsync(new SettingModel { Scope = scope, Name = name, Value = value });
                dbContext.SaveChanges();
            }
            else
            {
                setting.Value = value;
                dbContext.SaveChanges();
            }
        }

        public async Task SetTime(string scope, string name, DateTime time)
        {
            await Set(scope, name, (time == null) ? String.Empty : time.ToString());
            dbContext.SaveChanges();
        }
    }
}
