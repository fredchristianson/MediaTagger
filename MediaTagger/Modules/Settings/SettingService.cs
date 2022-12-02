using MediaTagger.Data;
using MediaTagger.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MediaTagger.Modules.Setting
{


  public interface ISettingService {
    Task<string?> Get(string scope, string name);
    Task Set(string scope, string name, string value);
    Task<DateTime?> GetTime(string scope, string name);
    Task SetTime(string scope, string name, DateTime time);
  }
  public class SettingService : ISettingService
  {
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

        public async Task Set(string scope, string name, string value)
        {
            var setting = await dbContext.Settings.FindAsync(scope,name);
            if (setting == null) {
              await dbContext.Settings.AddAsync(new Settings.SettingModel {Scope = scope, Name=name,Value=value});
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
